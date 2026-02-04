import os
from unittest.mock import PropertyMock, patch

import pytest
from django.core.files.uploadedfile import SimpleUploadedFile, UploadedFile
from django.urls import reverse
from rest_framework import status
from storage.models import File
from storage.utils import format_bytes, generate_file_response


@pytest.mark.django_db
class TestFileStorage:
    """
    Тестирование безопасности и функциональности файлового хранилища.
    """

    def test_admin_can_see_all_files(self, client, user_factory, file_factory):
        """
        Проверка доступа администратора ко всему файловому хранилищу.
        """
        admin = user_factory(is_staff=True)
        user1 = user_factory()
        user2 = user_factory()
        file_factory(owner=user1)
        file_factory(owner=user2)
        client.force_authenticate(user=admin)
        response = client.get(reverse('storage:file-list'))

        assert response.status_code == status.HTTP_200_OK
        assert response.data['count'] >= 2
        assert len(response.data['results']) >= 2

    def test_admin_filter_by_user_id(self, client, user_factory, file_factory):
        """
        Проверка возможности целевой фильтрации файлов по владельцу для администратора.
        """
        admin = user_factory(is_staff=True)
        target_user = user_factory()
        other_user = user_factory()
        file_factory(owner=target_user)
        file_factory(owner=other_user)
        client.force_authenticate(user=admin)
        url = f'{reverse("storage:file-list")}?user_id={target_user.pk}'
        response = client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert response.data['count'] == 1
        assert len(response.data['results']) == 1
        assert response.data['results'][0]['owner_username'] == target_user.username

    def test_file_list_isolation(self, client, user_factory, file_factory):
        """
        Проверка изоляции данных: пользователь видит только свои файлы.
        """
        user_me = user_factory(username='me')
        user_other = user_factory(username='other')
        file_factory(_quantity=3, owner=user_me)
        file_factory(_quantity=2, owner=user_other)

        client.force_authenticate(user=user_me)
        url = reverse('storage:file-list')
        response = client.get(url)

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data['count'] == 3
        assert len(data['results']) == 3

    def test_file_upload_limit(self, client, user_factory):
        """
        Проверка валидации максимального размера файла (500 МБ).
        """
        user = user_factory()
        client.force_authenticate(user=user)
        url = reverse('storage:file-list')
        big_file = SimpleUploadedFile(
            'big.txt', b'fake content', content_type='text/plain'
        )
        with patch.object(UploadedFile, 'size', new_callable=PropertyMock) as mock_size:
            mock_size.return_value = 600 * 1024 * 1024
            response = client.post(
                url, {'file': big_file, 'original_name': 'big.txt'}, format='multipart'
            )

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'Файл слишком большой' in str(response.data)

    def test_rename_file_empty_name_fails(self, client, user_factory, file_factory):
        """
        Проверка запрета на установку пустого имени файла при переименовании.
        """
        user = user_factory()
        my_file = file_factory(owner=user, original_name='valid_name.txt')
        client.force_authenticate(user=user)
        url = reverse('storage:file-detail', kwargs={'pk': my_file.pk})
        payload = {'original_name': '   '}
        response = client.patch(url, payload, format='multipart')

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'Имя файла не может быть пустым' in str(response.data)

    def test_special_link_lifecycle(self, client, user_factory, file_factory):
        """
        Проверка формирования и работы специальной ссылки.
        """
        user = user_factory()
        my_file = file_factory(owner=user)
        client.force_authenticate(user=user)

        gen_url = reverse('storage:file-generate-link', kwargs={'pk': my_file.pk})
        res_gen = client.post(gen_url)
        token = res_gen.data['token']

        assert res_gen.status_code == status.HTTP_200_OK
        assert res_gen.data['detail'] == 'Публичная ссылка сформирована'

        client.force_authenticate(user=None)
        ext_url = reverse('storage:external-download', kwargs={'token': token})
        res_ext = client.get(ext_url)

        assert res_ext.status_code == status.HTTP_200_OK
        assert 'X-Accel-Redirect' in res_ext

    def test_revoke_link(self, client, user_factory, file_factory):
        """
        Проверка аннулирования (отзыва) ранее созданной специальной ссылки.
        """
        user = user_factory()
        my_file = file_factory(owner=user, special_link_token='some-token')
        client.force_authenticate(user=user)
        url = reverse('storage:file-revoke-link', kwargs={'pk': my_file.pk})
        response = client.post(url)

        assert response.status_code == status.HTTP_200_OK
        assert response.data['detail'] == 'Публичная ссылка отозвана'
        my_file.refresh_from_db()
        assert my_file.special_link_token is None

    def test_file_save_fills_original_name(self, user_factory):
        """
        Проверка автоматического заполнения оригинального имени файла из объекта.
        """
        user = user_factory()
        test_file = SimpleUploadedFile('auto_name.txt', b'content')
        file_obj = File.objects.create(
            owner=user,
            file=test_file,
        )

        assert file_obj.original_name == 'auto_name.txt'

    def test_file_upload_success(self, client, user_factory):
        """
        Проверка успешной загрузки файла валидного размера авторизованным пользователем.
        """
        user = user_factory()
        client.force_authenticate(user=user)
        url = reverse('storage:file-list')
        small_file = SimpleUploadedFile(
            'test.txt', b'hello world', content_type='text/plain'
        )
        response = client.post(
            url, {'file': small_file, 'original_name': 'test.txt'}, format='multipart'
        )

        assert response.status_code == status.HTTP_201_CREATED
        file_obj = File.objects.get(original_name='test.txt')
        assert file_obj.owner == user

    def test_download_file_by_owner(self, client, user_factory, file_factory):
        """
        Проверка отдачи корректного заголовка X-Accel-Redirect
        при скачивании владельцем.
        """
        user = user_factory()
        my_file = file_factory(owner=user, original_name='test.txt')
        client.force_authenticate(user=user)
        url = reverse('storage:file-download', kwargs={'pk': my_file.pk})
        response = client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert 'X-Accel-Redirect' in response
        assert response['Content-Disposition'] == 'attachment; filename="test.txt"'

    def test_generate_file_response_error_logging(self, file_factory):
        """
        Тестирование обработки исключений и логирования в generate_file_response.
        """
        file_obj = file_factory(original_name='test.txt')
        with patch(
            'storage.utils.HttpResponse', side_effect=Exception('Ошибка сервера')
        ):
            with pytest.raises(Exception) as excinfo:
                generate_file_response(file_obj)

        assert 'Ошибка сервера' in str(excinfo.value)

    def test_delete_file(self, client, user_factory, file_factory):
        """
        Проверка корректного удаления записи о файле из базы данных.
        """
        user = user_factory()
        my_file = file_factory(owner=user)
        client.force_authenticate(user=user)
        url = reverse('storage:file-detail', kwargs={'pk': my_file.pk})
        response = client.delete(url)

        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert not File.objects.filter(pk=my_file.pk).exists()

    def test_delete_file_keeps_non_empty_dir(self, client, user_factory):
        """
        Комплексная проверка процесса удаления: API, база данных и очистка хранилища.
        """
        user = user_factory()
        client.force_authenticate(user=user)
        file_1 = SimpleUploadedFile('file1.txt', b'data1')
        file_2 = SimpleUploadedFile('file2.txt', b'data2')
        url = reverse('storage:file-list')
        response_1 = client.post(
            url, {'file': file_1, 'original_name': 'f1.txt'}, format='multipart'
        )
        response_2 = client.post(
            url, {'file': file_2, 'original_name': 'f2.txt'}, format='multipart'
        )

        file_path_1 = File.objects.get(id=response_1.data['id']).file.path
        dir_path_1 = os.path.dirname(file_path_1)
        assert os.path.exists(file_path_1)

        file_path_2 = File.objects.get(id=response_2.data['id']).file.path
        dir_path_2 = os.path.dirname(file_path_2)
        assert os.path.exists(file_path_2)
        assert dir_path_1 == dir_path_2

        response = client.delete(
            reverse('storage:file-detail', kwargs={'pk': response_1.data['id']})
        )
        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert not File.objects.filter(pk=response_1.data['id']).exists()
        assert not os.path.exists(file_path_1)
        assert os.path.exists(file_path_2)
        assert os.path.exists(dir_path_1)

        response = client.delete(
            reverse('storage:file-detail', kwargs={'pk': response_2.data['id']})
        )
        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert not File.objects.filter(pk=response_2.data['id']).exists()
        assert not os.path.exists(file_path_2)
        assert not os.path.exists(dir_path_2)


def test_format_bytes_extreme_cases():
    """
    Тестирование утилиты конвертации размера
    для экстремально больших значений (Петабайты).
    """
    peta_size = 1024 * 1024 * 1024 * 1024 * 1024

    assert format_bytes(peta_size) == '1.00 PB'
    assert format_bytes(peta_size * 1500) == '1500.00 PB'

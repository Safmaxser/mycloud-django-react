import os
from email.header import decode_header

import pytest
from django.core.files.base import ContentFile
from django.core.files.uploadedfile import SimpleUploadedFile
from django.urls import reverse
from rest_framework import status

from storage.models import File


@pytest.mark.django_db
class TestFileAPI:
    """
    Тесты файлового API: загрузка, лимиты, поиск и методы отдачи контента.
    """

    def test_file_upload_success(self, client, user_factory):
        """
        Проверка успешной загрузки файла и корректного заполнения метаданных.
        """
        user = user_factory()
        client.force_authenticate(user=user)
        file_content = b'hello world'
        file_name = 'test.txt'
        file_mimetype = 'text/plain'
        small_file = SimpleUploadedFile(
            file_name, file_content, content_type=file_mimetype
        )
        url = reverse('storage:file-list')
        response = client.post(
            url, {'file': small_file, 'original_name': file_name}, format='multipart'
        )
        assert response.status_code == status.HTTP_201_CREATED
        file_obj = File.objects.get(original_name=file_name)
        assert file_obj.owner == user
        assert file_obj.size == len(file_content)
        assert file_obj.mimetype == file_mimetype

    def test_file_list_isolation(self, client, user_factory, file_factory):
        """
        Проверка изоляции: пользователь видит в списке только свои файлы.
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

    def test_download_django_method(self, client, user_factory, file_factory, settings):
        """
        Отдача файла через Django FileResponse (settings.FILE_SERVE_METHOD = 'django').
        """
        settings.FILE_SERVE_METHOD = 'django'
        user = user_factory()
        file_obj = file_factory(
            owner=user,
            file=ContentFile(b'test content', name='test_file.txt'),
            original_name='test_file.txt',
        )
        client.force_authenticate(user=user)
        url = reverse('storage:file-download', kwargs={'pk': file_obj.pk})
        response = client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert 'attachment' in response['Content-Disposition']
        response.close()

    def test_download_nginx_method(self, client, user_factory, file_factory, settings):
        """
        Отдача файла через Nginx X-Accel-Redirect. Проверка RFC 2047 кодировки.
        """
        settings.FILE_SERVE_METHOD = 'nginx'
        user = user_factory()
        file_obj = file_factory(owner=user, original_name='Пример.txt')
        client.force_authenticate(user=user)
        url = reverse('storage:file-download', kwargs={'pk': file_obj.pk})
        response = client.get(url)
        assert response.status_code == status.HTTP_200_OK
        raw_header = response['Content-Disposition']
        decoded_fragments = decode_header(raw_header)
        disposition = ''.join(
            [
                f[0].decode(f[1] or 'utf-8') if isinstance(f[0], bytes) else f[0]
                for f in decoded_fragments
            ]
        )
        assert 'attachment' in disposition
        assert 'Пример.txt' in disposition
        assert "filename*=UTF-8''" in disposition

    def test_download_inline_parameter(self, client, user_factory, file_factory):
        """
        Проверка параметра ?inline=true для отображения файла в браузере.
        """
        user = user_factory()
        file_obj = file_factory(owner=user)
        client.force_authenticate(user=user)
        url = reverse('storage:file-download', kwargs={'pk': file_obj.pk})
        response = client.get(url, {'inline': 'true'})
        assert response.status_code == status.HTTP_200_OK
        assert 'inline' in response.headers['Content-Disposition']

    def test_upload_file_exceeds_max_size(self, client, user_factory, settings):
        """
        Валидация: превышение лимита MAX_FILE_SIZE_BYTES.
        """
        settings.MAX_FILE_SIZE_BYTES = 1024
        user = user_factory()
        client.force_authenticate(user=user)
        big_file = SimpleUploadedFile('too_big.txt', b'x' * 2048)
        response = client.post(
            reverse('storage:file-list'), {'file': big_file}, format='multipart'
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'Файл слишком большой' in str(response.data['file'])

    def test_upload_file_exceeds_quota_mb(self, client, user_factory, settings):
        """
        Валидация: превышение общей квоты хранилища (вывод ошибки в МБ).
        """
        settings.STORAGE_QUOTA_BYTES = 5 * 1024 * 1024
        user = user_factory()
        client.force_authenticate(user=user)
        huge_file = SimpleUploadedFile('huge.zip', b'x' * (6 * 1024 * 1024))
        response = client.post(
            reverse('storage:file-list'), {'file': huge_file}, format='multipart'
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'Доступно: 5 МБ' in str(response.data['file'])

    def test_upload_file_exceeds_quota_kb(
        self, client, user_factory, file_factory, settings
    ):
        """
        Валидация: превышение общей квоты хранилища (вывод ошибки в КБ).
        """
        settings.STORAGE_QUOTA_BYTES = 512 * 1024
        user = user_factory()
        file_factory(owner=user, size=500 * 1024)
        client.force_authenticate(user=user)
        last_file = SimpleUploadedFile('last.txt', b'x' * (20 * 1024))
        response = client.post(
            reverse('storage:file-list'), {'file': last_file}, format='multipart'
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'Доступно: 12 КБ' in str(response.data['file'])

    def test_generate_response_error_logging(
        self, client, user_factory, file_factory, settings
    ):
        """
        Логирование ошибки (except Exception) при физическом отсутствии файла.
        """
        settings.FILE_SERVE_METHOD = 'django'
        user = user_factory()
        file_obj = file_factory(
            owner=user, file=ContentFile(b'to be deleted', name='error_test.txt')
        )
        file_path = file_obj.file.path
        if os.path.exists(file_path):
            os.remove(file_path)
        client.force_authenticate(user=user)
        url = reverse('storage:file-download', kwargs={'pk': file_obj.pk})
        with pytest.raises(Exception):
            client.get(url)

    def test_search_files_by_name(self, client, user_factory, file_factory):
        """
        Проверка SearchFilter по оригинальному имени файла.
        """
        user = user_factory()
        file_factory(owner=user, original_name='find_me.pdf', comment='first')
        file_factory(owner=user, original_name='ignore.jpg', comment='second')
        client.force_authenticate(user=user)
        url = reverse('storage:file-list')
        response = client.get(url, {'q': 'find_me'})
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) == 1
        assert response.data['results'][0]['original_name'] == 'find_me.pdf'

    def test_update_file_metadata_success(self, client, user_factory, file_factory):
        """
        Проверка успешного обновления метаданных файла (имя и комментарий).
        """
        user = user_factory()
        file_obj = file_factory(owner=user, original_name='old_name.txt', comment='old')
        client.force_authenticate(user=user)
        url = reverse('storage:file-detail', kwargs={'pk': file_obj.pk})
        payload = {'original_name': 'new_name.txt', 'comment': 'new_comment'}
        response = client.patch(url, payload)
        assert response.status_code == status.HTTP_200_OK
        file_obj.refresh_from_db()
        assert file_obj.original_name == 'new_name.txt'
        assert file_obj.comment == 'new_comment'

    @pytest.mark.parametrize(
        'invalid_name',
        [
            '',
            '   ',
        ],
    )
    def test_validate_original_name_fail(
        self, client, user_factory, file_factory, invalid_name
    ):
        """
        Валидация: запрет пустых имен при частичном обновлении (PATCH).
        """
        user = user_factory()
        file_obj = file_factory(owner=user, original_name='valid.txt')
        client.force_authenticate(user=user)
        url = reverse('storage:file-detail', kwargs={'pk': file_obj.pk})
        response = client.patch(url, {'original_name': invalid_name})
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'Имя файла не может быть пустым' in str(response.data['original_name'])

    def test_delete_file(self, client, user_factory, file_factory):
        """
        Проверка успешного удаления файла владельцем.
        """
        user = user_factory()
        my_file = file_factory(owner=user)
        client.force_authenticate(user=user)
        url = reverse('storage:file-detail', kwargs={'pk': my_file.pk})
        response = client.delete(url)
        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert not File.objects.filter(pk=my_file.pk).exists()

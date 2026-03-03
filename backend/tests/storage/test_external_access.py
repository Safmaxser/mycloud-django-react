import pytest
from django.core.files.base import ContentFile
from django.urls import reverse
from rest_framework import status


@pytest.mark.django_db
class TestExternalAccess:
    """
    Тесты внешнего доступа: управление публичными токенами и анонимное скачивание.
    """

    def test_generate_and_revoke_special_link(self, client, user_factory, file_factory):
        """
        Проверка жизненного цикла токена: генерация и последующий отзыв владельцем.
        """
        user = user_factory()
        file_obj = file_factory(owner=user)
        client.force_authenticate(user=user)
        gen_url = reverse('storage:file-generate-link', kwargs={'pk': file_obj.pk})
        response = client.post(gen_url)
        assert response.status_code == status.HTTP_200_OK
        token = response.data['token']
        file_obj.refresh_from_db()
        assert file_obj.special_link_token == token
        rev_url = reverse('storage:file-revoke-link', kwargs={'pk': file_obj.pk})
        response = client.post(rev_url)
        assert response.status_code == status.HTTP_200_OK
        file_obj.refresh_from_db()
        assert file_obj.special_link_token is None

    def test_external_download_success(self, client, user_factory, file_factory):
        """
        Успешное анонимное скачивание файла по валидному токену.
        Проверяет AllowAny и вызов touch_download для анонима.
        """
        user = user_factory()
        file_obj = file_factory(
            owner=user,
            special_link_token='test-token-123',
            file=ContentFile(b'public content', name='public.txt'),
        )
        url = reverse('storage:external-download', kwargs={'token': 'test-token-123'})
        response = client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert response['Content-Type'] == file_obj.mimetype
        file_obj.refresh_from_db()
        assert file_obj.download_count == 1

    def test_external_download_invalid_token(self, client):
        """
        Защита: проверка возврата 404 при использовании
        несуществующего или пустого токена.
        """
        url = reverse('storage:external-download', kwargs={'token': 'fake-token'})
        response = client.get(url)
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_external_download_inline_support(self, client, user_factory, file_factory):
        """
        Проверка параметра inline=true для анонимного просмотра файла в браузере.
        """
        user = user_factory()
        file_factory(owner=user, special_link_token='inline-token')
        url = reverse('storage:external-download', kwargs={'token': 'inline-token'})
        response = client.get(url, {'inline': 'true'})
        assert response.status_code == status.HTTP_200_OK
        assert 'inline' in response['Content-Disposition']

    def test_cannot_revoke_others_link(self, client, user_factory, file_factory):
        """
        Безопасность: обычный пользователь не может отозвать ссылку на чужой файл.
        """
        user_a = user_factory()
        user_b = user_factory()
        file_b = file_factory(owner=user_b, special_link_token='token-b')
        client.force_authenticate(user=user_a)
        url = reverse('storage:file-revoke-link', kwargs={'pk': file_b.pk})
        response = client.post(url)
        assert response.status_code == status.HTTP_404_NOT_FOUND
        file_b.refresh_from_db()
        assert file_b.special_link_token == 'token-b'

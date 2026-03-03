import os
from unittest.mock import PropertyMock, patch

import pytest
from django.conf import settings
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status

User = get_user_model()


@pytest.mark.django_db
class TestUserMe:
    """
    Тесты для эндпоинта /users/me/: управление собственным профилем и очистка данных.
    """

    def test_get_own_profile_with_stats(self, client, user_factory):
        """
        Проверка получения профиля с аннотированной статистикой (файлы, квоты).
        """
        user = user_factory(full_name='Тестовый Юзер')
        client.force_authenticate(user=user)
        url = reverse('users:user-me')
        response = client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert response.data['full_name'] == 'Тестовый Юзер'
        assert 'files_count' in response.data
        assert 'files_total_size' in response.data

    def test_update_own_profile(self, client, user_factory):
        """
        Проверка частичного обновления (PATCH) полей профиля владельцем.
        """
        user = user_factory(full_name='Old Name')
        client.force_authenticate(user=user)
        url = reverse('users:user-me')
        payload = {'full_name': 'New Name'}
        response = client.patch(url, payload)
        assert response.status_code == status.HTTP_200_OK
        user.refresh_from_db()
        assert user.full_name == 'New Name'

    def test_change_password_via_me(self, client, user_factory):
        """
        Проверка смены пароля. Подтверждает хеширование и сохранение сессии.
        """
        user = user_factory()
        user.set_password('OldPass123!')
        user.save()
        client.force_authenticate(user=user)
        url = reverse('users:user-me')
        new_password = 'NewSecurePass456!'
        response = client.patch(url, {'password': new_password})
        assert response.status_code == status.HTTP_200_OK
        user.refresh_from_db()
        assert user.check_password(new_password)

    def test_delete_own_profile_via_me(self, client, user_factory):
        """
        Проверка удаления аккаунта самим пользователем и срабатывания логгера.
        """
        user = user_factory(username='self_deleter')
        client.force_authenticate(user=user)
        url = reverse('users:user-me')
        response = client.delete(url)
        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert not User.objects.filter(username='self_deleter').exists()

    def test_user_me_is_staff_readonly(self, client, user_factory):
        """
        Защита: проверка, что поле is_staff игнорируется при обновлении через /me.
        """
        user = user_factory(is_staff=False)
        client.force_authenticate(user=user)
        url = reverse('users:user-me')
        response = client.patch(url, {'is_staff': True})
        assert response.status_code == status.HTTP_200_OK
        user.refresh_from_db()
        assert user.is_staff is False

    def test_signal_storage_path_false_branch_coverage(self, user_factory):
        """
        Проверка безопасного выхода из сигнала, если storage_path пуст.
        """
        user = user_factory()
        with patch.object(
            user.__class__, 'storage_path', new_callable=PropertyMock
        ) as mock_storage:
            mock_storage.return_value = ''
            user.delete()
        assert True

    def test_user_directory_cleanup_on_delete(self, user_factory):
        """
        Проверка физического удаления всей папки пользователя при удалении аккаунта.
        """
        user = user_factory()
        user_dir = os.path.join(settings.MEDIA_ROOT, user.storage_path)
        os.makedirs(user_dir, exist_ok=True)
        assert os.path.exists(user_dir)
        user.delete()
        assert not os.path.exists(user_dir)

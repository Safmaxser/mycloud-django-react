import pytest
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status

User = get_user_model()


@pytest.mark.django_db
class TestAdminManagement:
    """
    Тесты административных функций: управление пользователями, правами и доступом.
    """

    def test_admin_list_users_excludes_self(self, client, user_factory):
        """
        Проверка get_queryset: админ видит всех пользователей, кроме самого себя.
        """
        admin = user_factory(is_staff=True)
        user_factory(username='other_user_1')
        user_factory(username='other_user_2')
        client.force_authenticate(user=admin)
        url = reverse('users:user-list')
        response = client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) == 2
        usernames = [u['username'] for u in response.data['results']]
        assert admin.username not in usernames

    def test_admin_can_view_any_user_detail(self, client, user_factory):
        """
        Проверка доступа: админ может просматривать профиль любого пользователя по ID.
        """
        admin = user_factory(is_staff=True)
        target_user = user_factory(username='target')
        client.force_authenticate(user=admin)
        url = reverse('users:user-detail', kwargs={'pk': target_user.pk})
        response = client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert response.data['username'] == 'target'

    def test_admin_can_promote_user_to_staff(self, client, user_factory):
        """
        Успешное изменение статуса is_staff администратором.
        """
        admin = user_factory(is_staff=True)
        target_user = user_factory(is_staff=False)
        client.force_authenticate(user=admin)
        url = reverse('users:user-detail', kwargs={'pk': target_user.pk})
        response = client.patch(url, {'is_staff': True})
        assert response.status_code == status.HTTP_200_OK
        target_user.refresh_from_db()
        assert target_user.is_staff is True

    def test_admin_cannot_demote_self(self, client, user_factory):
        """
        Защита: проверка ValidationError при попытке админа лишить прав самого себя.
        """
        admin = user_factory(is_staff=True)
        client.force_authenticate(user=admin)
        url = reverse('users:user-detail', kwargs={'pk': admin.pk})
        response = client.patch(url, {'is_staff': False})
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'Вы не можете лишить себя прав' in str(response.data)

    def test_create_user_covers_none_instance(self, client, user_factory):
        """
        Проверка валидатора при создании (POST), когда instance=None.
        """
        admin = user_factory(is_staff=True)
        client.force_authenticate(user=admin)
        url = reverse('users:user-list')
        payload = {
            'username': 'newuser123',
            'password': 'Password123!',
            'email': 'new@test.com',
            'is_staff': False,
        }
        response = client.post(url, payload)
        assert response.status_code == status.HTTP_201_CREATED

    def test_admin_can_delete_other_user(self, client, user_factory):
        """
        Проверка удаления: администратор может удалять чужие аккаунты.
        """
        admin = user_factory(is_staff=True)
        target_user = user_factory()
        client.force_authenticate(user=admin)
        url = reverse('users:user-detail', kwargs={'pk': target_user.pk})
        response = client.delete(url)
        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert not User.objects.filter(pk=target_user.pk).exists()

    def test_admin_can_update_any_user_fields(self, client, user_factory):
        """
        Проверка редактирования: админ может менять email,
        имя и логин любого пользователя.
        """
        admin = user_factory(is_staff=True)
        target_user = user_factory(
            username='oldLogin', email='old@test.com', full_name='Старое Имя'
        )
        client.force_authenticate(user=admin)
        url = reverse('users:user-detail', kwargs={'pk': target_user.pk})
        payload = {
            'username': 'newLoginAdmin',
            'email': 'new_admin@test.com',
            'full_name': 'Обновлено Админом',
        }
        response = client.patch(url, payload)
        assert response.status_code == status.HTTP_200_OK
        target_user.refresh_from_db()
        assert target_user.username == 'newLoginAdmin'
        assert target_user.email == 'new_admin@test.com'
        assert target_user.full_name == 'Обновлено Админом'

    def test_user_cannot_update_other_user(self, client, user_factory):
        """
        Безопасность: обычный пользователь получает 403/404
        при попытке изменить чужой профиль.
        """
        user_1 = user_factory()
        user_2 = user_factory(full_name='Не трогать')
        client.force_authenticate(user=user_1)
        url = reverse('users:user-detail', kwargs={'pk': user_2.pk})
        response = client.patch(url, {'full_name': 'Хакер'})
        assert response.status_code in [
            status.HTTP_403_FORBIDDEN,
            status.HTTP_404_NOT_FOUND,
        ]
        user_2.refresh_from_db()
        assert user_2.full_name == 'Не трогать'

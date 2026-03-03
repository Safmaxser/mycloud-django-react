import pytest
from django.contrib.auth.models import AnonymousUser
from django.urls import reverse
from rest_framework import status

from core.permissions import IsOwnerOrAdmin


@pytest.mark.django_db
class TestFilePermissions:
    """
    Тесты прав доступа: изоляция пользователей и административные привилегии.
    """

    def test_admin_view_any_file_detail(self, client, user_factory, file_factory):
        """
        Админ получает доступ к любому файлу по прямому ID.
        """
        admin = user_factory(is_staff=True)
        other_user = user_factory()
        file_obj = file_factory(owner=other_user)
        client.force_authenticate(user=admin)
        url = reverse('storage:file-detail', kwargs={'pk': file_obj.pk})
        response = client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert response.data['id'] == str(file_obj.id)

    def test_admin_list_files_by_target_user(self, client, user_factory, file_factory):
        """
        Админ просматривает список файлов конкретного пользователя.
        """
        admin = user_factory(is_staff=True)
        target_user = user_factory()
        target_file = file_factory(owner=target_user)
        file_factory(owner=user_factory())
        client.force_authenticate(user=admin)
        url = reverse('storage:file-list')
        response = client.get(url, {'user_id': target_user.pk})
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) == 1
        assert response.data['results'][0]['id'] == str(target_file.id)

    def test_admin_list_own_files_by_default(self, client, user_factory, file_factory):
        """
        Админ без параметров видит в списке только свои файлы.
        """
        admin = user_factory(is_staff=True)
        admin_file = file_factory(owner=admin)
        file_factory(owner=user_factory())
        client.force_authenticate(user=admin)
        response = client.get(reverse('storage:file-list'))
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) == 1
        assert response.data['results'][0]['id'] == str(admin_file.id)

    def test_user_cannot_access_others_file(self, client, user_factory, file_factory):
        """
        Безопасность: обычный пользователь получает 404 при попытке доступа к чужому ID.
        """
        user_a = user_factory()
        user_b = user_factory()
        file_b = file_factory(owner=user_b)
        client.force_authenticate(user=user_a)
        url = reverse('storage:file-download', kwargs={'pk': file_b.pk})
        response = client.get(url)
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_owner_can_access_own_file(self, client, user_factory, file_factory):
        """
        Проверка: владелец имеет полный доступ к своим данным.
        """
        user = user_factory()
        file_obj = file_factory(owner=user)
        client.force_authenticate(user=user)
        url = reverse('storage:file-detail', kwargs={'pk': file_obj.pk})
        response = client.get(url)
        assert response.status_code == status.HTTP_200_OK

    def test_anonymous_cannot_access_files(self, client, file_factory):
        """
        Безопасность: анонимный доступ к API файлов полностью закрыт.
        """
        file_obj = file_factory()
        url = reverse('storage:file-detail', kwargs={'pk': file_obj.pk})
        response = client.get(url)
        assert response.status_code in [
            status.HTTP_401_UNAUTHORIZED,
            status.HTTP_403_FORBIDDEN,
        ]


@pytest.mark.django_db
class TestIsOwnerOrAdminUnit:
    """
    Юнит-тесты универсального класса IsOwnerOrAdmin.
    Покрывают редкие логические ветки напрямую.
    """

    @pytest.fixture
    def perm(self):
        return IsOwnerOrAdmin()

    def test_has_object_permission_anonymous(self, perm, file_factory):
        """
        Отказ в доступе, если пользователь не авторизован.
        """
        file_obj = file_factory()
        mock_request = type('MockRequest', (), {'user': AnonymousUser()})
        result = perm.has_object_permission(mock_request, None, file_obj)
        assert result is False

    def test_has_object_permission_self_user(self, perm, user_factory):
        """
        Разрешение доступа, если объект — это сам текущий пользователь.
        """
        user_obj = user_factory()
        mock_request = type('MockRequest', (), {'user': user_obj})
        result = perm.has_object_permission(mock_request, None, user_obj)
        assert result is True

    def test_has_object_permission_no_owner_attr_fail(self, perm, user_factory):
        """
        Отказ, если у объекта нет владельца и это не сам пользователь.
        """
        user = user_factory()
        other_user = user_factory()
        mock_request = type('MockRequest', (), {'user': user})
        result = perm.has_object_permission(mock_request, None, other_user)
        assert result is False

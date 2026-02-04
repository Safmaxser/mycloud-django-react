import os

import pytest
from core.permissions import IsOwnerOrAdmin
from core.validators import ComplexPasswordValidator
from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.models import AnonymousUser
from django.urls import reverse
from rest_framework import status

User = get_user_model()


@pytest.mark.django_db
class TestUserAuth:
    """
    Тестирование системы аутентификации, регистрации и прав доступа.
    """

    def test_registration_success(self, client):
        """
        Проверка успешной регистрации нового пользователя.
        """
        url = reverse('users:user-list')
        payload = {
            'username': 'useruser',
            'password': '8Password334$g',
            'email': 'test@test.com',
            'full_name': 'Петр Сидоров',
        }
        response = client.post(url, payload)

        assert response.status_code == status.HTTP_201_CREATED
        assert User.objects.filter(username='useruser').exists()
        user = User.objects.get(username='useruser')
        assert user.check_password('8Password334$g')

    def test_delete_user_by_owner(self, client, user_factory):
        """
        Проверка удаления собственного аккаунта авторизованным пользователем.
        """
        user = user_factory()
        client.force_authenticate(user=user)
        url = reverse('users:user-detail', kwargs={'pk': user.pk})
        response = client.delete(url)

        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert not User.objects.filter(pk=user.pk).exists()

    def test_admin_can_delete_other_user(self, client, user_factory):
        """
        Проверка удаления аккаунта другого пользователя администратором.
        """
        admin = user_factory(is_staff=True)
        target_user = user_factory(username='to_be_deleted')
        client.force_authenticate(user=admin)
        url = reverse('users:user-detail', kwargs={'pk': target_user.pk})
        response = client.delete(url)

        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert not User.objects.filter(pk=target_user.pk).exists()

    def test_update_user_name_and_password(self, client, user_factory):
        """
        Проверка частичного обновления (PATCH) профиля: смена имени и пароля.
        """
        old_password = 'OldPassword123#'
        new_password = 'NewPassword456@'

        user = user_factory(full_name='Old Name')
        user.set_password(old_password)
        user.save()

        client.force_authenticate(user=user)
        url = reverse('users:user-detail', kwargs={'pk': user.pk})
        payload = {'full_name': 'New Name', 'password': new_password}
        response = client.patch(url, payload)

        assert response.status_code == status.HTTP_200_OK
        user.refresh_from_db()
        assert user.full_name == 'New Name'
        assert user.check_password(new_password)
        assert not user.check_password(old_password)

    def test_create_admin_by_anonymous_fails(self, client):
        """
        Проверка защиты от регистрации пользователя со статусом администратора анонимом.
        """
        url = reverse('users:user-list')
        payload = {
            'username': 'hackeruser',
            'password': '45Password-78',
            'email': 'hacker@test.com',
            'full_name': 'Hacker Name',
            'is_staff': True,
        }
        response = client.post(url, payload)

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'У вас недостаточно прав' in str(response.data)

    def test_admin_can_promote_user_to_staff(self, client, user_factory):
        """
        Проверка возможности делегирования прав администратора.
        """
        admin = user_factory(is_staff=True)
        target_user = user_factory(is_staff=False)
        client.force_authenticate(user=admin)
        url = reverse('users:user-detail', kwargs={'pk': target_user.pk})
        response = client.patch(url, {'is_staff': True})

        assert response.status_code == status.HTTP_200_OK
        target_user.refresh_from_db()
        assert target_user.is_staff is True

    @pytest.mark.parametrize(
        'username, password, expected_status',
        [
            ('correct_user', 'correct_pass', status.HTTP_200_OK),
            ('correct_user', 'wrong_pass', status.HTTP_401_UNAUTHORIZED),
            ('non_existent', 'any_pass', status.HTTP_401_UNAUTHORIZED),
        ],
    )
    def test_login_logic(
        self, client, user_factory, username, password, expected_status
    ):
        """
        Проверка логики входа в систему для различных комбинаций учетных данных.
        """
        real_user = user_factory(username='correct_user')
        real_user.set_password('correct_pass')
        real_user.save()

        url = reverse('users:login')
        payload = {'username': username, 'password': password}
        response = client.post(url, payload)

        if expected_status == status.HTTP_200_OK:
            assert response.data['detail'] == 'Сессия успешно создана'
            assert 'username' in response.data
        elif expected_status == status.HTTP_401_UNAUTHORIZED:
            assert (
                response.data['detail']
                == 'Ошибка аутентификации: неверные учетные данные'
            )
        assert response.status_code == expected_status

    @pytest.mark.parametrize(
        'bad_password, error_msg',
        [
            ('onlylower1!', 'заглавную букву'),
            ('NoDigit!', 'хотя бы одну цифру'),
            ('NoSpecial1', 'один спецсимвол'),
            ('Sho1!', 'слишком короткий'),
        ],
    )
    def test_password_validation_rules(self, client, bad_password, error_msg):
        """
        Проверка политики сложности паролей на соответствие.
        """
        url = reverse('users:user-list')
        payload = {
            'username': 'test_valid_user',
            'password': bad_password,
            'email': 'test@valid.com',
            'full_name': 'Test User',
        }
        response = client.post(url, payload)

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert error_msg in str(response.data['password'])

    @pytest.mark.parametrize(
        'field, bad_value, error_msg',
        [
            ('username', '1user', 'начинаться с буквы'),
            ('username', 'user_name!', 'только латиницу и цифры'),
            ('username', 'usr', 'от 4 до 20'),
            ('email', 'not-an-email', 'корректный формат email'),
        ],
    )
    def test_user_fields_validation_rules(self, client, field, bad_value, error_msg):
        """
        Комплексная проверка валидации username и email.
        """
        url = reverse('users:user-list')
        payload = {
            'username': 'validUser123',
            'password': 'ValidPass123!',
            'email': 'valid@test.com',
            'full_name': 'Test User',
        }
        payload[field] = bad_value
        response = client.post(url, payload)

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert error_msg in str(response.data[field])

    def test_logout_authenticated(self, client, user_factory):
        """
        Проверка успешного выхода (завершения сессии) для авторизованного пользователя.
        """
        user = user_factory()
        client.force_authenticate(user=user)

        url = reverse('users:logout')
        response = client.post(url)
        assert response.status_code == status.HTTP_200_OK
        assert response.data['detail'] == 'Сессия завершена'

    def test_admin_can_access_any_user_profile(self, client, user_factory):
        """
        Проверка доступа администратора к профилям любых пользователей.
        """
        admin = user_factory(is_staff=True)
        other_user = user_factory(username='target')

        client.force_authenticate(user=admin)
        url = reverse('users:user-detail', kwargs={'pk': other_user.pk})
        response = client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert response.data['username'] == 'target'

    def test_user_list_admin_only(self, client, user_factory):
        """
        Проверка, что список всех пользователей видит только администратор.
        """
        regular_user = user_factory(is_staff=False)
        admin_user = user_factory(is_staff=True)
        url = reverse('users:user-list')

        client.force_authenticate(user=regular_user)
        response = client.get(url)

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data['count'] == 1
        assert len(data['results']) == 1

        client.force_authenticate(user=admin_user)
        response = client.get(url)

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data['count'] >= 2
        assert len(data['results']) >= 2

    def test_user_directory_cleanup_on_delete(self, user_factory):
        """
        Проверка физического удаления папки при удалении пользователя.
        """
        user = user_factory()
        user_dir = os.path.join(settings.MEDIA_ROOT, user.storage_path)
        os.makedirs(user_dir, exist_ok=True)
        assert os.path.exists(user_dir)
        user.delete()
        assert not os.path.exists(user_dir)


def test_is_owner_or_admin_direct_anonymous():
    """
    Тестирование класса разрешений IsOwnerOrAdmin для неавторизованного доступа.
    """
    permission = IsOwnerOrAdmin()
    request = type('Request', (), {'user': AnonymousUser()})
    obj = type('Obj', (), {'pk': 1})
    result = permission.has_object_permission(request, None, obj)

    assert result is False


def test_complex_password_validator_help_text():
    """
    Проверка корректности формирования текста подсказки для политики паролей.
    """
    validator = ComplexPasswordValidator()
    help_text = validator.get_help_text()
    assert 'заглавную букву' in help_text
    assert 'цифру' in help_text
    assert 'спецсимвол' in help_text

import pytest
from django.contrib.auth import (
    get_user_model,
)
from django.urls import reverse
from rest_framework import status

from core.validators import ComplexPasswordValidator

User = get_user_model()


@pytest.mark.django_db
class TestRegistration:
    """
    Тесты регистрации новых пользователей и валидации входных данных.
    """

    def test_registration_success(self, client):
        """
        Проверка успешного создания аккаунта с валидными данными.
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
        assert response.data['username'] == payload['username']
        user = User.objects.get(username=payload['username'])
        assert user.check_password(payload['password'])

    def test_create_admin_by_anonymous_fails(self, client):
        """
        Запрет регистрации пользователя с правами администратора анонимом.
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
        assert 'Только администратор может' in str(response.data)

    @pytest.mark.parametrize(
        'password, error_code, expected_status',
        [
            ('onlylower1!', 'no_uppercase', status.HTTP_400_BAD_REQUEST),
            ('NoDigit!', 'no_digit', status.HTTP_400_BAD_REQUEST),
            ('NoSpecial1', 'no_special', status.HTTP_400_BAD_REQUEST),
            ('Sho1!', 'password_too_short', status.HTTP_400_BAD_REQUEST),
            ('Password123!', None, status.HTTP_201_CREATED),
        ],
    )
    def test_password_validation_rules(
        self, client, password, error_code, expected_status
    ):
        """
        Проверка политики сложности паролей на соответствие.
        """
        url = reverse('users:user-list')
        uid = f'{abs(hash(password))}'[:10]
        payload = {
            'username': f'u{uid}',
            'password': password,
            'email': f'e_{uid}@t.com',
            'full_name': 'Test User',
        }
        response = client.post(url, payload)
        assert response.status_code == expected_status
        if expected_status == status.HTTP_400_BAD_REQUEST:
            actual_codes = [err.code for err in response.data['password']]
            assert error_code in actual_codes

    @pytest.mark.parametrize(
        'field, value, error_code, expected_status',
        [
            ('username', '1user', 'invalid_format', status.HTTP_400_BAD_REQUEST),
            ('username', 'user_name!', 'invalid_format', status.HTTP_400_BAD_REQUEST),
            ('username', 'usr', 'invalid_format', status.HTTP_400_BAD_REQUEST),
            ('username', 'u' * 21, 'max_length', status.HTTP_400_BAD_REQUEST),
            ('email', 'not-an-email', 'invalid', status.HTTP_400_BAD_REQUEST),
            ('username', 'loginOk', None, status.HTTP_201_CREATED),
            ('email', 'm@m.com', None, status.HTTP_201_CREATED),
        ],
    )
    def test_user_fields_validation_rules(
        self, client, field, value, error_code, expected_status
    ):
        """
        Проверка ограничений модели и сериализатора для username и email.
        """
        url = reverse('users:user-list')
        uid = f'{abs(hash(value))}'[:10]
        payload = {
            'username': f'u{uid}',
            'password': 'ValidPass123!',
            'email': f'e_{uid}@t.com',
            'full_name': 'Test User',
        }
        payload[field] = value
        response = client.post(url, payload)
        assert response.status_code == expected_status
        if expected_status == status.HTTP_400_BAD_REQUEST:
            actual_codes = [err.code for err in response.data[field]]
            assert error_code in actual_codes


class TestPasswordValidatorUnit:
    """
    Unit-тесты для проверки внутренней логики ComplexPasswordValidator.
    """

    def test_complex_password_validator_help_text(self):
        """
        Проверка корректности формирования текста подсказки для политики паролей.
        """
        validator = ComplexPasswordValidator()
        help_text = validator.get_help_text()
        assert 'заглавную букву' in help_text
        assert 'цифру' in help_text
        assert 'спецсимвол' in help_text

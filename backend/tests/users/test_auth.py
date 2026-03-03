import pytest
from django.urls import reverse
from rest_framework import status


@pytest.mark.django_db
class TestAuth:
    """
    Тесты системы аутентификации (вход и выход из системы).
    """

    @pytest.mark.parametrize(
        'username, password, error_code, expected_status',
        [
            ('correct_user', 'correct_pass123!', None, status.HTTP_200_OK),
            (
                'correct_user',
                'wrong_pass',
                'authorization_failed',
                status.HTTP_400_BAD_REQUEST,
            ),
            (
                'non_existent',
                'any_pass',
                'authorization_failed',
                status.HTTP_400_BAD_REQUEST,
            ),
        ],
    )
    def test_login_logic(
        self, client, user_factory, username, password, error_code, expected_status
    ):
        """
        Проверка логики входа для различных комбинаций учетных данных.
        """
        real_user = user_factory(username='correct_user')
        real_user.set_password('correct_pass123!')
        real_user.save()
        url = reverse('users:login')
        payload = {'username': username, 'password': password}
        response = client.post(url, payload)
        assert response.status_code == expected_status
        if expected_status == status.HTTP_200_OK:
            assert response.data['detail'] == 'Сессия успешно создана'
            assert 'user' in response.data
            assert response.data['user']['username'] == 'correct_user'
        else:
            actual_codes = [err.code for err in response.data['detail']]
            assert error_code in actual_codes

    def test_logout_authenticated(self, client, user_factory):
        """
        Проверка завершения сессии для авторизованного пользователя.
        """
        user = user_factory()
        client.force_authenticate(user=user)
        url = reverse('users:logout')
        response = client.post(url)
        assert response.status_code == status.HTTP_200_OK
        assert response.data['detail'] == 'Сессия завершена'

    def test_logout_anonymous_fails(self, client):
        """
        Проверка, что неавторизованный пользователь не может вызвать logout.
        """
        url = reverse('users:logout')
        response = client.post(url)
        assert response.status_code == status.HTTP_403_FORBIDDEN

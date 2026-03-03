import logging

import pytest
from django.http import HttpResponseServerError
from django.urls import reverse
from rest_framework import status

from users.views import UserViewSet


@pytest.mark.django_db
class TestEventLoggingMiddleware:
    """
    Тестирование системного логгера: проверка фиксации действий,
    ошибок и определения метаданных (IP, User).
    """

    def test_logging_info_on_action(self, client, user_factory, caplog):
        """
        Логирование успешного действия (POST).
        """
        user = user_factory()
        client.force_authenticate(user=user)
        url = reverse('users:user-list')
        with caplog.at_level(logging.INFO, logger='users'):
            payload = {
                'username': 'newUserLog',
                'password': 'Password123!',
                'email': 'log@test.com',
            }
            response = client.post(url, payload)
            assert response.status_code == status.HTTP_201_CREATED
        assert 'ДЕЙСТВИЕ' in caplog.text
        assert str(user) in caplog.text
        assert '127.0.0.1' in caplog.text

    def test_logging_info_on_download_path(
        self, client, user_factory, file_factory, caplog
    ):
        """
        Логирование GET-запроса, если в пути есть 'download'.
        """
        user = user_factory()
        file_obj = file_factory(owner=user)
        client.force_authenticate(user=user)
        url = reverse('storage:file-download', kwargs={'pk': file_obj.pk})
        with caplog.at_level(logging.INFO, logger='storage'):
            response = client.get(url)
            assert response.status_code == status.HTTP_200_OK
        assert 'ДЕЙСТВИЕ' in caplog.text
        assert 'GET' in caplog.text

    def test_logging_skips_common_get_request(self, client, user_factory, caplog):
        """
        Проверка "тихого" режима для обычных GET-запросов (просмотр профиля).
        """
        user = user_factory()
        client.force_authenticate(user=user)
        url = reverse('users:user-me')
        with caplog.at_level(logging.INFO, logger='users'):
            response = client.get(url)
            assert response.status_code == status.HTTP_200_OK
        assert 'ДЕЙСТВИЕ' not in caplog.text
        assert 'ОШИБКА' not in caplog.text

    def test_logging_warning_on_client_error(self, client, caplog):
        """
        Логирование ошибок 4xx и извлечение IP из X-Forwarded-For.
        """
        headers = {'HTTP_X_FORWARDED_FOR': '192.168.1.1, 10.0.0.1'}
        with caplog.at_level(logging.WARNING, logger='django'):
            response = client.get('/non-existent-path/', **headers)
            assert response.status_code == status.HTTP_404_NOT_FOUND
        assert 'ОШИБКА КЛИЕНТА' in caplog.text
        assert 'IP: 192.168.1.1' in caplog.text
        assert 'User: Anonymous' in caplog.text

    def test_logging_error_on_server_error(
        self, client, caplog, monkeypatch, user_factory
    ):
        """
        Логирование критических ошибок 5xx.
        """

        def mock_500(*args, **kwargs):
            return HttpResponseServerError('Server Broken')

        monkeypatch.setattr(UserViewSet, 'dispatch', mock_500)
        user = user_factory()
        client.force_authenticate(user=user)
        url = reverse('users:user-list')
        with caplog.at_level(logging.ERROR, logger='users'):
            response = client.get(url)
            assert response.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
        assert 'СЕРВЕРНАЯ ОШИБКА' in caplog.text
        assert '500: GET' in caplog.text

    def test_logging_resolver_404_fallback(self, client, caplog):
        """
        Проверка fallback-логгера ('django'), если путь не резолвится.
        """
        with caplog.at_level(logging.WARNING, logger='django'):
            response = client.get('/invalid/path/that/does/not/resolve/')
            assert response.status_code == status.HTTP_404_NOT_FOUND
        for record in caplog.records:
            if 'ОШИБКА КЛИЕНТА' in record.message:
                assert record.name == 'django'

import logging

import pytest
from django.core.files.uploadedfile import SimpleUploadedFile
from django.urls import reverse
from rest_framework import status
from rest_framework.response import Response


def test_log_storage_success(client, user_factory, caplog):
    """
    Проверка логгера 'storage' и записи INFO (ДЕЙСТВИЕ).
    """
    user = user_factory()
    client.force_authenticate(user=user)
    url = reverse('storage:file-list')
    test_file = SimpleUploadedFile('test.txt', b'content', content_type='text/plain')
    response = client.post(
        url, {'file': test_file, 'original_name': 'test.txt'}, format='multipart'
    )

    assert response.status_code == status.HTTP_201_CREATED
    relevant = [r for r in caplog.records if url in r.message]
    assert relevant[0].name == 'storage'
    assert 'ДЕЙСТВИЕ' in relevant[0].message


def test_log_users_warning(client, caplog):
    """
    Проверка логгера 'users' и записи WARNING (ОШИБКА КЛИЕНТА).
    """
    url = reverse('users:login')
    response = client.get(url)

    assert response.status_code == status.HTTP_405_METHOD_NOT_ALLOWED
    relevant = [r for r in caplog.records if url in r.message]
    assert relevant[0].name == 'users'
    assert 'ОШИБКА КЛИЕНТА' in relevant[0].message


def test_log_django_fallback(client, caplog):
    """
    Проверка fallback на логгер 'django' при несуществующем пути.
    """
    url = '/api/non-existent-path/'
    response = client.get(url)

    assert response.status_code == status.HTTP_404_NOT_FOUND
    relevant = [r for r in caplog.records if url in r.message]
    assert relevant[0].name == 'django'
    assert '404' in relevant[0].message


def test_middleware_logging_x_forwarded_for(client, caplog):
    """
    Проверка обработки заголовка X-Forwarded-For.
    Проверка, что Middleware записывает правильный IP в текст лога.
    """
    caplog.set_level(logging.WARNING)
    test_ip = '192.168.1.1'

    response = client.get(
        reverse('users:login'), HTTP_X_FORWARDED_FOR=f'{test_ip}, 10.0.0.1'
    )
    assert response.status_code == status.HTTP_405_METHOD_NOT_ALLOWED
    assert test_ip in caplog.text
    assert 'ОШИБКА КЛИЕНТА' in caplog.text


def test_middleware_logging_server_error(client, caplog):
    """
    Тестирование логирования критических ошибок (500) в Middleware.
    """
    caplog.set_level(logging.ERROR)
    with pytest.MonkeyPatch().context() as m:
        m.setattr(
            'users.views.JsonLoginView.post',
            lambda *args, **kwargs: Response(status=500),
        )
        response = client.post(reverse('users:login'))

    assert response.status_code == 500
    relevant = [r for r in caplog.records if 'СЕРВЕРНАЯ ОШИБКА' in r.message]
    assert len(relevant) > 0
    assert relevant[0].levelname == 'ERROR'

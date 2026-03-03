import logging
import shutil
import tempfile

import pytest
from django.contrib.auth import get_user_model
from django.core.files.base import ContentFile
from django.utils.crypto import get_random_string
from model_bakery import baker
from rest_framework.test import APIClient

from storage.models import File

User = get_user_model()


@pytest.fixture(autouse=True)
def set_log_level(caplog):
    """
    Глобальная настройка уровня логов для всех тестов.
    """
    caplog.set_level(logging.INFO)


@pytest.fixture(autouse=True)
def use_temp_media_dir(settings):
    """
    Автоматически перенаправляет все медиа-файлы во временную папку на время теста.
    """
    temp_dir = tempfile.mkdtemp()
    settings.MEDIA_ROOT = temp_dir
    yield
    shutil.rmtree(temp_dir, ignore_errors=True)


@pytest.fixture
def client(db):
    """
    Фикстура API-клиента для выполнения запросов.
    """
    return APIClient()


@pytest.fixture
def user_factory(db):
    """
    Фабрика для создания пользователей в тестах.
    """

    def create_user(**kwargs):
        if 'username' not in kwargs:
            kwargs['username'] = f'user_{get_random_string(8)}'
        if 'email' not in kwargs:
            kwargs['email'] = f'{kwargs["username"]}@example.com'
        if 'password' not in kwargs:
            kwargs['password'] = '1Password*Password5'
        return User.objects.create_user(**kwargs)

    return create_user


@pytest.fixture
def file_factory():
    """
    Фабрика для генерации файлов с реальным контентом на диске.
    """

    def factory(**kwargs):
        if 'size' in kwargs and 'file' not in kwargs:
            kwargs['file'] = ContentFile(b'fake', name='quota_test.txt')
        if 'file' not in kwargs:
            kwargs['file'] = ContentFile(b'fake file content', name='test_file.txt')
        if 'original_name' not in kwargs:
            kwargs['original_name'] = 'test_file.txt'
        if 'size' not in kwargs:
            kwargs['size'] = 17
        instance = baker.make(File, **kwargs)
        if 'size' in kwargs:
            if isinstance(instance, list):
                for obj in instance:
                    obj.size = kwargs['size']
                File.objects.bulk_update(instance, ['size'])
            else:
                instance.size = kwargs['size']
                instance.save(update_fields=['size'])
        return instance

    return factory

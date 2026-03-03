import os
from unittest.mock import AsyncMock, patch

import pytest
from django.core.files.base import ContentFile
from django.core.files.uploadedfile import SimpleUploadedFile
from django.urls import reverse
from model_bakery import baker
from rest_framework import status

from storage.models import File


@pytest.mark.django_db(transaction=True)
class TestFileWebSocketSignals:
    """
    Интеграционные тесты WebSocket-уведомлений:
    FILE_CREATED, FILE_UPDATED, FILE_DELETED.
    """

    @pytest.fixture(autouse=True)
    def mock_channel_layer(self):
        """
        Изоляция слоя каналов для перехвата широковещательных сообщений.
        """
        with patch('storage.signals.get_channel_layer') as mock_get:
            mock_layer = AsyncMock()
            mock_get.return_value = mock_layer
            yield mock_layer

    def test_upload_file_notifies_channels(
        self, client, user_factory, mock_channel_layer
    ):
        """
        Проверка отправки FILE_CREATED и USER_UPDATED (квоты) при создании.
        """
        user = user_factory()
        client.force_authenticate(user=user)
        test_file = SimpleUploadedFile('signal.txt', b'hello')
        response = client.post(
            reverse('storage:file-list'), {'file': test_file}, format='multipart'
        )
        assert response.status_code == status.HTTP_201_CREATED
        assert mock_channel_layer.group_send.called
        sent_types = [
            call.args[1]['data']['type']
            for call in mock_channel_layer.group_send.call_args_list
        ]
        assert 'FILE_CREATED' in sent_types
        assert 'USER_UPDATED' in sent_types

    def test_update_file_notifies_channels(
        self, client, user_factory, file_factory, mock_channel_layer
    ):
        """
        Проверка отправки FILE_UPDATED при изменении комментария/имени.
        """
        user = user_factory()
        file_obj = file_factory(owner=user)
        client.force_authenticate(user=user)
        mock_channel_layer.group_send.reset_mock()
        url = reverse('storage:file-detail', kwargs={'pk': file_obj.pk})
        client.patch(url, {'comment': 'New comment'})
        sent_types = [
            call.args[1]['data']['type']
            for call in mock_channel_layer.group_send.call_args_list
        ]
        assert 'FILE_UPDATED' in sent_types

    def test_delete_file_notifies_channels(
        self, user_factory, file_factory, mock_channel_layer
    ):
        """
        Проверка отправки FILE_DELETED и пересчета статистики USER_UPDATED.
        """
        user = user_factory()
        file_obj = file_factory(owner=user)
        mock_channel_layer.group_send.reset_mock()
        file_obj.delete()
        sent_types = [
            call.args[1]['data']['type']
            for call in mock_channel_layer.group_send.call_args_list
        ]
        assert 'FILE_DELETED' in sent_types
        assert 'USER_UPDATED' in sent_types

    def test_file_signals_no_channel_layer(self, file_factory):
        """
        Безопасный выход из сигналов, если Channels не настроен (layer is None).
        """
        file_obj = file_factory()
        with patch('storage.signals.get_channel_layer', return_value=None):
            file_obj.save()
            file_obj.delete()
        assert True

    def test_delete_file_user_not_exists_graceful(
        self, user_factory, file_factory, mock_channel_layer
    ):
        """
        Обработка DoesNotExist, если пользователь удален раньше файла.
        """
        user = user_factory()
        file_obj = file_factory(owner=user)
        user.delete()
        file_obj.delete()
        assert True

    def test_file_signal_skips_staff_user_group(
        self, user_factory, file_factory, mock_channel_layer
    ):
        """
        Админы получают уведомления о создании или изменении
        только в общую группу, пропуская персональную.
        """
        admin = user_factory(is_staff=True)
        mock_channel_layer.group_send.reset_mock()
        file_factory(owner=admin)
        admin_group = f'user_{admin.id}'
        calls = [call.args[0] for call in mock_channel_layer.group_send.call_args_list]
        assert admin_group not in calls
        assert 'admin_notifications' in calls

    def test_file_delete_signal_skips_staff_user_group(
        self, user_factory, file_factory, mock_channel_layer
    ):
        """
        Админы получают уведомления об удалении
        только в общую группу, пропуская персональную.
        """
        admin = user_factory(is_staff=True)
        file_obj = file_factory(owner=admin)
        admin_id = admin.id
        mock_channel_layer.group_send.reset_mock()
        file_obj.delete()
        sent_groups = [
            call.args[0] for call in mock_channel_layer.group_send.call_args_list
        ]
        assert 'admin_notifications' in sent_groups
        assert f'user_{admin_id}' not in sent_groups

    def test_auto_delete_signal_skips_if_no_file_on_disk(self, user_factory):
        """
        Проверка сигнала при удалении записи, у которой нет файла.
        """
        user = user_factory()
        file_obj = baker.make(File, owner=user, file=None)
        file_obj.delete()
        assert File.objects.count() == 0


@pytest.mark.django_db
class TestFileCleanupSignals:
    """
    Тесты физической очистки: удаление объектов из файловой системы.
    """

    def test_signal_deletes_physical_file_and_empty_dirs(
        self, user_factory, file_factory
    ):
        """
        Рекурсивное удаление пустых папок дат (for _ in range(3)).
        """
        user = user_factory()
        content = ContentFile(b'cleanup test', name='to_be_deleted.txt')
        file_obj = file_factory(owner=user, file=content)
        file_path = file_obj.file.path
        dir_day = os.path.dirname(file_path)
        dir_month = os.path.dirname(dir_day)
        dir_year = os.path.dirname(dir_month)
        assert os.path.exists(file_path)
        file_obj.delete()
        assert not os.path.exists(file_path)
        assert not os.path.exists(dir_day)
        assert not os.path.exists(dir_month)
        assert not os.path.exists(dir_year)
        assert os.path.exists(os.path.dirname(dir_year))

    def test_signal_file_already_missing_on_disk(self, user_factory, file_factory):
        """
        Проверка устойчивости сигнала (if os.path.isfile -> False).
        """
        user = user_factory()
        file_obj = file_factory(owner=user, file=ContentFile(b'data', name='ghost.txt'))
        file_path = file_obj.file.path
        if os.path.exists(file_path):
            os.remove(file_path)
        file_obj.delete()
        assert not os.path.exists(file_path)
        assert not File.objects.filter(pk=file_obj.pk).exists()

    def test_signal_stops_if_directory_not_empty(self, user_factory, file_factory):
        """
        Остановка удаления папок (else: break), если в них есть другие файлы.
        """
        user = user_factory()
        file_1 = file_factory(owner=user, file=ContentFile(b'1', name='file1.txt'))
        file_2 = file_factory(owner=user, file=ContentFile(b'2', name='file2.txt'))
        dir_path = os.path.dirname(file_1.file.path)
        file_1.delete()
        assert os.path.exists(dir_path)
        assert os.path.exists(file_2.file.path)

    def test_delete_file_keeps_non_empty_dir(self, client, user_factory):
        """
        Проверка каскадного удаления пустых папок.
        Убеждаемся, что папка удаляется только когда в ней не остается файлов.
        """
        user = user_factory()
        client.force_authenticate(user=user)
        file_1 = SimpleUploadedFile('file1.txt', b'data1')
        file_2 = SimpleUploadedFile('file2.txt', b'data2')
        url = reverse('storage:file-list')
        response_1 = client.post(
            url, {'file': file_1, 'original_name': 'f1.txt'}, format='multipart'
        )
        response_2 = client.post(
            url, {'file': file_2, 'original_name': 'f2.txt'}, format='multipart'
        )

        file_path_1 = File.objects.get(id=response_1.data['id']).file.path
        dir_path_1 = os.path.dirname(file_path_1)
        assert os.path.exists(file_path_1)
        file_path_2 = File.objects.get(id=response_2.data['id']).file.path
        dir_path_2 = os.path.dirname(file_path_2)
        assert os.path.exists(file_path_2)
        assert dir_path_1 == dir_path_2
        response = client.delete(
            reverse('storage:file-detail', kwargs={'pk': response_1.data['id']})
        )
        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert not File.objects.filter(pk=response_1.data['id']).exists()
        assert not os.path.exists(file_path_1)
        assert os.path.exists(file_path_2)
        assert os.path.exists(dir_path_1)
        response = client.delete(
            reverse('storage:file-detail', kwargs={'pk': response_2.data['id']})
        )
        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert not File.objects.filter(pk=response_2.data['id']).exists()
        assert not os.path.exists(file_path_2)
        assert not os.path.exists(dir_path_2)

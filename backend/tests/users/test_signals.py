from unittest.mock import ANY, AsyncMock, patch

import pytest
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status

User = get_user_model()


@pytest.mark.django_db(transaction=True)
class TestUserWebSocketSignals:
    """
    Тестирование Django Signals: интеграция с Channels и уведомления в реальном времени.
    """

    @pytest.fixture(autouse=True)
    def mock_channel_layer(self):
        """
        Изоляция слоя каналов для перехвата широковещательных сообщений.
        """
        with patch('users.signals.get_channel_layer') as mock_get:
            mock_layer = AsyncMock()
            mock_get.return_value = mock_layer
            yield mock_layer

    def test_signal_user_created_notifies_channels(self, client, mock_channel_layer):
        """
        Проверка USER_CREATED: уведомление админов и создание персональной группы.
        """
        url = reverse('users:user-list')
        payload = {
            'username': 'signalUser',
            'password': 'Password123!',
            'email': 'signal@test.com',
            'full_name': 'Signal Test',
        }
        response = client.post(url, payload)
        assert response.status_code == status.HTTP_201_CREATED
        user_id = response.data['id']
        assert mock_channel_layer.group_send.called
        groups = ['admin_notifications', f'user_{user_id}']
        calls = mock_channel_layer.group_send.call_args_list
        calls_group = [call for call in calls if call.args[0] in groups]
        assert len(calls_group) == 2
        for call in calls_group:
            assert call.args[1]['data']['type'] == 'USER_CREATED'

    def test_signal_user_updated_notifies_channels(
        self, client, user_factory, mock_channel_layer
    ):
        """
        Проверка USER_UPDATED: корректная реакция на изменение профиля.
        """
        user = user_factory(is_staff=True)
        client.force_authenticate(user=user)
        url = reverse('users:user-me')
        mock_channel_layer.group_send.reset_mock()
        response = client.patch(url, {'full_name': 'New Name'})
        assert response.status_code == status.HTTP_200_OK
        assert mock_channel_layer.group_send.called
        calls = mock_channel_layer.group_send.call_args_list
        admin_call = next(c for c in calls if c.args[0] == 'admin_notifications')
        assert admin_call.args[1]['data']['type'] == 'USER_UPDATED'

    def test_signal_user_deleted_notifies_channels(
        self, client, user_factory, mock_channel_layer
    ):
        """
        Проверка USER_DELETED: оповещение о полном удалении аккаунта.
        """
        user = user_factory(username='to_delete')
        user_id = str(user.id)
        user.delete()
        assert mock_channel_layer.group_send.called
        mock_channel_layer.group_send.assert_any_call('admin_notifications', ANY)
        mock_channel_layer.group_send.assert_any_call(f'user_{user_id}', ANY)
        calls = mock_channel_layer.group_send.call_args_list
        sent_event_types = [call.args[1]['data']['type'] for call in calls]
        assert 'USER_DELETED' in sent_event_types

    def test_signal_no_channel_layer_early_return(self, user_factory):
        """
        Проверка устойчивости сигнала post_save при отсутствии Channels.
        """
        with patch('users.signals.get_channel_layer', return_value=None):
            user = user_factory()
        assert user.pk is not None

    def test_signal_delete_no_channel_layer_early_return(self, user_factory):
        """
        Проверка устойчивости сигнала post_delete при отсутствии Channels.
        """
        user = user_factory()
        user_id = user.pk
        with patch('users.signals.get_channel_layer', return_value=None):
            user.delete()
        assert not User.objects.filter(pk=user_id).exists()

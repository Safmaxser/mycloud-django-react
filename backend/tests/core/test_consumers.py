from typing import Any, cast

import pytest
from asgiref.sync import sync_to_async
from channels.layers import get_channel_layer
from channels.testing import WebsocketCommunicator
from django.contrib.auth.models import AnonymousUser

from core.consumers import CloudConsumer


@pytest.mark.asyncio
@pytest.mark.django_db(transaction=True)
class TestCloudConsumer:
    """
    Тестирование WebSocket-взаимодействия: авторизация,
    динамические подписки и доставка событий.
    """

    async def test_connect_authenticated_user(self, user_factory):
        """
        Проверка: авторизованный пользователь успешно
        подключается и подписывается на свою группу.
        """
        user = await sync_to_async(user_factory)(is_staff=False)
        communicator = WebsocketCommunicator(CloudConsumer.as_asgi(), '/ws/cloud/')
        cast(Any, communicator).scope['user'] = user
        connected, _ = await communicator.connect()
        assert connected
        channel_layer = get_channel_layer()
        assert channel_layer is not None
        user_group = f'user_{user.id}'
        await channel_layer.group_send(
            user_group,
            {'type': 'file.event', 'data': {'type': 'SYNC_CHECK', 'payload': 'ok'}},
        )
        response = await communicator.receive_json_from()
        assert response['type'] == 'SYNC_CHECK'
        assert response['payload'] == 'ok'
        await communicator.disconnect()

    async def test_connect_admin_adds_to_admin_group(self, user_factory):
        """
        Проверка автоматического добавления админа в группу admin_notifications.
        """
        admin = await sync_to_async(user_factory)(is_staff=True)
        communicator = WebsocketCommunicator(CloudConsumer.as_asgi(), '/ws/cloud/')
        cast(Any, communicator).scope['user'] = admin
        connected, _ = await communicator.connect()
        assert connected
        channel_layer = get_channel_layer()
        assert channel_layer is not None
        await channel_layer.group_send(
            'admin_notifications',
            {'type': 'file.event', 'data': {'type': 'TEST_ADMIN'}},
        )
        response = await communicator.receive_json_from()
        assert response['type'] == 'TEST_ADMIN'
        await communicator.disconnect()

    async def test_command_update_subscriptions_as_user(self, user_factory):
        """
        Обработка команды переподписки для обычного пользователя.
        """
        user = await sync_to_async(user_factory)(is_staff=False)
        communicator = WebsocketCommunicator(CloudConsumer.as_asgi(), '/ws/cloud/')
        cast(Any, communicator).scope['user'] = user
        await communicator.connect()
        await communicator.send_json_to({'command': 'update_subscriptions'})
        response = await communicator.receive_json_from()
        assert response['type'] == 'SUBSCRIPTIONS_UPDATED'
        assert response['payload'] == 'user'
        await communicator.disconnect()

    async def test_command_update_subscriptions_as_admin(self, user_factory):
        """
        Переподписка админа с проверкой вступления в группу.
        """
        admin = await sync_to_async(user_factory)(is_staff=True)
        communicator = WebsocketCommunicator(CloudConsumer.as_asgi(), '/ws/cloud/')
        cast(Any, communicator).scope.update(
            {'user': admin, 'client': ('127.0.0.1', 0)}
        )
        await communicator.connect()
        await communicator.send_json_to({'command': 'update_subscriptions'})
        response = await communicator.receive_json_from()
        assert response['payload'] == 'admin'
        channel_layer = get_channel_layer()
        assert channel_layer is not None
        await channel_layer.group_send(
            'admin_notifications',
            {'type': 'file.event', 'data': {'type': 'ADMIN_CONFIRM'}},
        )
        admin_response = await communicator.receive_json_from()
        assert admin_response['type'] == 'ADMIN_CONFIRM'
        await communicator.disconnect()

    async def test_receive_json_unknown_command(self, user_factory):
        """
        Игнорирование неизвестных или пустых команд.
        """
        user = await sync_to_async(user_factory)(is_staff=False)
        communicator = WebsocketCommunicator(CloudConsumer.as_asgi(), '/ws/cloud/')
        cast(Any, communicator).scope.update({'user': user, 'client': ('127.0.0.1', 0)})
        await communicator.connect()
        await communicator.send_json_to({'command': 'unknown_cmd'})
        await communicator.send_json_to({'foo': 'bar'})
        assert await communicator.receive_nothing() is True
        await communicator.disconnect()

    async def test_connect_anonymous_denied(self):
        """
        Блокировка анонимных подключений.
        """
        communicator = WebsocketCommunicator(CloudConsumer.as_asgi(), '/ws/cloud/')
        cast(Any, communicator).scope.update(
            {'user': AnonymousUser(), 'client': ('127.0.0.1', 0)}
        )
        connected, _ = await communicator.connect()
        assert not connected
        await communicator.disconnect()

    async def test_update_user_status_anonymous_branch(self):
        """
        Безопасный выход из обновления статуса для анонима.
        """
        consumer = CloudConsumer()
        c_any = cast(Any, consumer)
        c_any.scope = {'user': AnonymousUser()}
        c_any.user = AnonymousUser()
        await consumer.update_user_status()
        assert c_any.user.is_anonymous is True

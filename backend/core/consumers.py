import logging
import uuid
from typing import Any

from asgiref.sync import sync_to_async
from channels.generic.websocket import AsyncJsonWebsocketConsumer

logger = logging.getLogger(__name__)


class CloudConsumer(AsyncJsonWebsocketConsumer):
    """
    Глобальный обработчик WebSocket-соединений облачного хранилища.
    Обеспечивает авторизацию, управление подписками на группы и трансляцию
    системных событий (файлы, пользователи, права) в реальном времени.
    """

    async def connect(self) -> None:
        """
        Инициализация соединения и первичная регистрация пользователя в группах.
        """
        self.user = self.scope.get('user')
        if not self.user or self.user.is_anonymous:
            logger.warning(
                f'WS: Анонимная попытка подключения от {self.scope["client"]}'
            )
            await self.close()
            return

        logger.info(
            f'WS: Пользователь {self.user.username} (ID: {self.user.id}) подключился'
        )
        await self.channel_layer.group_add(f'user_{self.user.id}', self.channel_name)
        if self.user.is_staff:
            await self.channel_layer.group_add('admin_notifications', self.channel_name)

        await self.accept()

    async def disconnect(self, code: int) -> None:
        """
        Удаление идентификаторов канала из групп Redis при разрыве соединения.
        """
        user = self.user
        username = user.username if user and not user.is_anonymous else 'Anonymous'
        logger.info(f'WS: Пользователь {username} отключился (Код причины: {code})')

        if self.user and not self.user.is_anonymous:
            await self.channel_layer.group_discard(
                f'user_{self.user.id}', self.channel_name
            )
            await self.channel_layer.group_discard(
                'admin_notifications', self.channel_name
            )

    async def update_user_status(self) -> None:
        """
        Актуализация данных пользователя из базы данных (проверка прав доступа).
        """
        if self.user and not self.user.is_anonymous:
            logger.debug(
                'WS: Обновление статуса базы данных для пользователя '
                f'{self.user.username}'
            )
            await sync_to_async(self.user.refresh_from_db)()

    async def receive_json(self, content: dict[str, Any], **kwargs: Any) -> None:
        """
        Обработка входящих JSON-команд от клиента (например, запрос на переподписку).
        """
        command = content.get('command')
        user = self.user
        username = user.username if user and not user.is_anonymous else 'Anonymous'
        logger.debug(f'WS: Получена команда {command} от {username}')

        if command == 'update_subscriptions':
            logger.info(
                'WS: Обработка запроса "update_subscriptions" для пользователя '
                f'{username}'
            )
            await self.update_user_status()
            await self.channel_layer.group_discard(
                'admin_notifications', self.channel_name
            )

            is_staff = self.user and self.user.is_staff
            if is_staff:
                await self.channel_layer.group_add(
                    'admin_notifications', self.channel_name
                )

            user_role = 'admin' if is_staff else 'user'
            await self.send_json(
                {
                    'id': str(uuid.uuid4()),
                    'type': 'SUBSCRIPTIONS_UPDATED',
                    'payload': user_role,
                }
            )
            logger.debug(
                f'WS: Пользователь {username} повторно '
                f'зарегистрирован как {user_role.upper()}'
            )

    async def file_event(self, event: dict[str, Any]) -> None:
        """
        Пересылка событий, сгенерированных на бэкенде (Channel Layer), в WebSocket.
        """
        user = self.user
        username = user.username if user and not user.is_anonymous else 'Unknown'
        event_type = event.get('data', {}).get('type', 'UNKNOWN')
        logger.debug(f'WS: Передача события {event_type} пользователю {username}')

        await self.send_json(event['data'])

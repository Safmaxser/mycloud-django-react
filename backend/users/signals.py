import logging
import uuid
from typing import TYPE_CHECKING, Any, cast

from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from django.contrib.auth import get_user_model
from django.db import transaction
from django.db.models.signals import post_delete, post_save
from django.dispatch import receiver

if TYPE_CHECKING:
    from .models import User

UserModel = get_user_model()

logger = logging.getLogger(__name__)


@receiver(post_save, sender=UserModel)
def notify_user_update(
    sender: Any, instance: 'User', created: bool, **kwargs: Any
) -> None:
    """
    Сигнал автоматического уведомления о создании или обновлении пользователя.
    Инициирует события USER_CREATED/UPDATED для синхронизации профилей и прав
    доступа в реальном времени через WebSocket-группы.
    """
    channel_layer = get_channel_layer()
    if channel_layer is None:
        return

    def send_updates():
        # Локальные импорты для исключения циклических зависимостей
        from .models import UserQuerySet
        from .serializers import UserDetailSerializer

        # Получаем актуальную статистику пользователя (квоты, кол-во файлов)
        user_queryset = cast(UserQuerySet, instance.__class__.objects)
        user_with_stats = user_queryset.with_stats().get(pk=instance.pk)

        event_type = 'USER_CREATED' if created else 'USER_UPDATED'
        data = {
            'id': str(uuid.uuid4()),
            'type': event_type,
            'payload': UserDetailSerializer(user_with_stats).data,
        }

        # Определение целевых групп: администраторы и сам пользователь
        target_groups = {'admin_notifications'}
        if not instance.is_staff or not created:
            target_groups.add(f'user_{instance.id}')

        logger.debug(
            f'Signal: Отправка события {event_type} '
            f'для пользователя {instance.username} '
            f'(ID: {instance.id}, Статус: {"ADMIN" if instance.is_staff else "USER"}) '
            f'в группы: {list(target_groups)}'
        )

        for group in target_groups:
            async_to_sync(channel_layer.group_send)(
                group, {'type': 'file.event', 'data': data}
            )

    # Выполнение рассылки только после успешного завершения транзакции БД
    transaction.on_commit(send_updates)


@receiver(post_delete, sender=UserModel)
def notify_user_delete(sender: Any, instance: 'User', **kwargs: Any) -> None:
    """
    Сигнал автоматического уведомления о полном удалении пользователя.
    Генерирует событие USER_DELETED, позволяя мгновенно закрыть активные сессии
    и обновить административные списки без перезагрузки.
    """
    channel_layer = get_channel_layer()
    if channel_layer is None:
        return

    user_id = str(instance.id)
    username = instance.username
    is_staff = instance.is_staff

    def send_updates() -> None:
        data = {
            'id': str(uuid.uuid4()),
            'type': 'USER_DELETED',
            'payload': {'id': user_id},
        }

        target_groups = {f'user_{user_id}', 'admin_notifications'}

        logger.info(
            f'Signal: Отправка события USER_DELETED '
            f'для пользователя {username} '
            f'(ID: {user_id}, Статус: {"ADMIN" if is_staff else "USER"}) '
            f'в группы: {list(target_groups)}'
        )

        for group in target_groups:
            async_to_sync(channel_layer.group_send)(
                group, {'type': 'file.event', 'data': data}
            )

    # Выполнение рассылки только после успешного завершения транзакции БД
    transaction.on_commit(send_updates)

import logging
import os
import uuid
from typing import Any

from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from django.db import transaction
from django.db.models.signals import post_delete, post_save
from django.dispatch import receiver

from .models import File

logger = logging.getLogger(__name__)


@receiver(post_save, sender=File)
def notify_file_update(
    sender: Any, instance: File, created: bool, **kwargs: Any
) -> None:
    """
    Сигнал автоматического уведомления о создании или обновлении файла.
    Генерирует события FILE_CREATED/UPDATED и
    обновляет статистику владельца (USER_UPDATED),
    рассылая данные в персональные и административные WebSocket-группы.
    """
    channel_layer = get_channel_layer()
    if channel_layer is None:
        return

    def send_updates() -> None:
        # Локальные импорты для предотвращения циклических зависимостей
        from users.serializers import UserDetailSerializer

        from .serializers import FileSerializer

        owner = instance.owner
        target_groups = {'admin_notifications'}
        if not owner.is_staff:
            target_groups.add(f'user_{owner.id}')

        event_type = 'FILE_CREATED' if created else 'FILE_UPDATED'

        # Формирование пакетов данных в формате SocketEvent
        messages = [
            {
                'type': 'file.event',
                'data': {
                    'id': str(uuid.uuid4()),
                    'type': event_type,
                    'payload': FileSerializer(instance).data,
                },
            }
        ]
        event_types = [event_type]

        if created:
            # При создании нового файла обновляем квоту и счетчик владельца
            owner_with_stats = instance.owner.__class__.objects.with_stats().get(
                pk=instance.owner.pk
            )
            messages.append(
                {
                    'type': 'file.event',
                    'data': {
                        'id': str(uuid.uuid4()),
                        'type': 'USER_UPDATED',
                        'payload': UserDetailSerializer(owner_with_stats).data,
                    },
                }
            )
            event_types.append('USER_UPDATED')

        logger.debug(
            f'Signal: Отправка событий {event_types} для файла {instance.original_name}'
            f' (Владелец: {owner.username}) в группы: {list(target_groups)}'
        )

        for group in target_groups:
            for msg in messages:
                async_to_sync(channel_layer.group_send)(group, msg)

    # Выполнение рассылки только после успешного завершения транзакции БД
    transaction.on_commit(send_updates)


@receiver(post_delete, sender=File)
def notify_file_delete(sender: Any, instance: File, **kwargs: Any) -> None:
    """
    Сигнал автоматического уведомления об удалении файла из системы.
    Инициирует событие FILE_DELETED и пересчет занятого пространства пользователя,
    обеспечивая актуальность интерфейса без перезагрузки страницы.
    """
    channel_layer = get_channel_layer()
    if channel_layer is None:
        return

    owner = instance.owner
    owner_id = owner.id
    owner_model = owner.__class__
    file_id = str(instance.id)
    is_owner_staff = owner.is_staff

    owner_username = owner.username
    file_name = instance.original_name

    def send_updates() -> None:
        # Локальные импорты для исключения циклических зависимостей
        from users.serializers import UserDetailSerializer

        target_groups = {'admin_notifications'}

        if not is_owner_staff:
            target_groups.add(f'user_{owner_id}')

        messages = [
            {
                'type': 'file.event',
                'data': {
                    'id': str(uuid.uuid4()),
                    'type': 'FILE_DELETED',
                    'payload': {'id': file_id, 'owner_id': str(owner_id)},
                },
            }
        ]

        try:
            # Обновление статистики пользователя после удаления контента
            owner_with_stats = owner_model.objects.with_stats().get(pk=owner_id)
            messages.append(
                {
                    'type': 'file.event',
                    'data': {
                        'id': str(uuid.uuid4()),
                        'type': 'USER_UPDATED',
                        'payload': UserDetailSerializer(owner_with_stats).data,
                    },
                }
            )

        except owner_model.DoesNotExist:
            # Если пользователя удалили вместе с файлами, статистика больше не нужна
            pass

        logger.debug(
            f'Signal: Отправка события USER_UPDATED для файла {file_name}'
            f' (Владелец: {owner_username}) в группы: {list(target_groups)}'
        )

        for group in target_groups:
            for msg in messages:
                async_to_sync(channel_layer.group_send)(group, msg)

    # Выполнение рассылки только после успешного завершения транзакции БД
    transaction.on_commit(send_updates)


@receiver(post_delete, sender=File)
def auto_delete_file_on_delete(sender, instance: File, **kwargs):
    """
    Удаляет файл и пустые родительские папки дат.
    """
    if not instance.file:
        return

    file_path = instance.file.path
    if os.path.isfile(file_path):
        os.remove(file_path)

        directory = os.path.dirname(file_path)
        for _ in range(3):
            try:
                if not os.listdir(directory):
                    os.rmdir(directory)
                    directory = os.path.dirname(directory)
                else:
                    break
            except (OSError, FileNotFoundError):  # pragma: no cover
                break

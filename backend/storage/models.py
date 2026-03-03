import mimetypes
import os
import secrets
import uuid
from typing import TYPE_CHECKING

from django.conf import settings
from django.core.cache import cache
from django.db import models
from django.utils import timezone

if TYPE_CHECKING:
    from .models import File


def user_directory_path(instance: 'File', filename: str) -> str:
    """
    Формирует путь для сохранения файла: user_id/YYYY/MM/DD/uuid_name.ext
    """
    now = timezone.now()
    date_path = now.strftime('%Y/%m/%d')
    ext = os.path.splitext(filename)[1]
    secure_name = f'{uuid.uuid4()}{ext}'
    user_profile = getattr(instance.owner, 'profile', None)
    user_base_path = getattr(user_profile, 'storage_path', f'user_{instance.owner.pk}')
    return f'{user_base_path}/{date_path}/{secure_name}'


class File(models.Model):
    """
    Модель для хранения метаданных и путей к файлам пользователей.
    """

    id = models.UUIDField(
        primary_key=True, default=uuid.uuid4, editable=False, verbose_name='ID файла'
    )
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='files',
        verbose_name='Владелец',
    )
    file = models.FileField(upload_to=user_directory_path, verbose_name='Файл на диске')

    original_name = models.CharField(
        max_length=255, blank=True, verbose_name='Имя файла'
    )
    size = models.PositiveBigIntegerField(
        default=0, blank=True, verbose_name='Размер (байт)'
    )
    mimetype = models.CharField(max_length=100, blank=True, verbose_name='Тип контента')
    comment = models.TextField(blank=True, verbose_name='Комментарий')
    special_link_token = models.CharField(
        max_length=64,
        unique=True,
        blank=True,
        null=True,
        default=None,
        verbose_name='Токен внешней ссылки',
    )
    download_count = models.PositiveIntegerField(
        default=0, verbose_name='Количество скачиваний'
    )
    last_download_at = models.DateTimeField(
        null=True, blank=True, verbose_name='Дата последнего скачивания'
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Дата загрузки')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Дата изменения')

    class Meta:
        verbose_name = 'Файл'
        verbose_name_plural = 'Файлы'
        ordering = ('-created_at',)

    def touch_download(self, request=None):
        """
        Обновляет статистику скачиваний файла с защитой от дублирования.
        Использует Redis-кэш для ограничения частоты обновлений по IP-адресу.
        """
        if not request or request.method != 'GET':
            return

        ip = request.META.get('HTTP_X_FORWARDED_FOR', request.META.get('REMOTE_ADDR'))
        cache_key = f'dl_lock_{self.id}_{ip}'

        if cache.get(cache_key):
            return

        self.last_download_at = timezone.now()
        self.download_count += 1
        self.save(update_fields=['last_download_at', 'download_count'])
        cache.set(cache_key, True, 2)

    def generate_special_link(self):
        """
        Создает и сохраняет уникальный токен для публичного доступа к файлу.
        """
        if not self.special_link_token:
            self.special_link_token = secrets.token_urlsafe(32)
            self.save()
        return self.special_link_token

    def revoke_special_link(self):
        """
        Аннулирует внешнюю ссылку, удаляя токен доступа.
        """
        self.special_link_token = None
        self.save()

    def save(self, *args, **kwargs):
        """
        Заполняет метаданные (имя, размер, тип) только при первой загрузке.
        """
        is_creating = self._state.adding or not self.pk
        if is_creating and self.file:
            if not self.original_name:
                self.original_name = self.file.name
            self.size = self.file.size
            if not self.mimetype:
                type_guess = mimetypes.guess_type(self.file.name)[0]
                self.mimetype = type_guess or 'application/octet-stream'
        super().save(*args, **kwargs)

    def __str__(self):
        return f'{self.owner.username} | {self.original_name}'

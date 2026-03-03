import os
import shutil
import uuid

from django.conf import settings
from django.contrib.auth.models import AbstractUser
from django.contrib.auth.models import UserManager as BaseUserManager
from django.contrib.auth.password_validation import validate_password
from django.core.validators import EmailValidator, RegexValidator
from django.db import models
from django.db.models import Count, Sum, Value
from django.db.models.functions import Coalesce
from django.db.models.signals import post_delete
from django.dispatch import receiver

username_regex = RegexValidator(
    regex=r'^[a-zA-Z][a-zA-Z0-9]{3,19}$',
    message=(
        'Логин должен быть от 4 до 20 символов, начинаться '
        'с буквы и содержать только латиницу и цифры.'
    ),
    code='invalid_format',
)


class UserQuerySet(models.QuerySet):
    """
    Набор методов для расширенных запросов к модели пользователя.
    """

    def with_stats(self):
        """
        Аннотирует пользователей статистикой хранилища (объем и количество файлов).
        Используется для синхронизации данных через API и WebSocket.
        """
        return self.annotate(
            files_total_size=Coalesce(Sum('files__size'), Value(0)),
            files_count=Count('files'),
        )


class UserManager(BaseUserManager.from_queryset(UserQuerySet)):
    """
    Менеджер модели пользователя с поддержкой методов UserQuerySet.
    """

    pass


class User(AbstractUser):
    """
    Кастомная модель пользователя, расширяющая стандартный AbstractUser.

    Включает UUID в качестве первичного ключа и дополнительные поля
    согласно техническому заданию (полное имя, путь к хранилищу).
    """

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
        verbose_name='ID пользователя',
    )
    password = models.CharField(max_length=128, validators=[validate_password])
    username = models.CharField(
        max_length=20,
        unique=True,
        validators=[username_regex],
        verbose_name='Логин',
        error_messages={
            'unique': 'Пользователь с таким логином уже существует.',
        },
    )
    full_name = models.CharField(max_length=255, blank=True, verbose_name='Полное имя')
    storage_path = models.CharField(
        max_length=500, blank=True, verbose_name='Путь к хранилищу'
    )
    email = models.EmailField(
        unique=True,
        validators=[EmailValidator(message='Введите корректный формат email')],
        verbose_name='Электронная почта',
        error_messages={
            'unique': 'Пользователь с такой электронной почтой уже существует.',
        },
    )
    is_staff = models.BooleanField(default=False, verbose_name='Статус администратора')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Дата изменения')
    date_joined = models.DateTimeField(
        auto_now_add=True, verbose_name='Дата регистрации'
    )

    objects: UserManager = UserManager()  # type: ignore[assignment]

    class Meta:
        verbose_name = 'Пользователь'
        verbose_name_plural = 'Пользователи'
        ordering = ('-date_joined',)

    def save(self, *args, **kwargs):
        """
        Автоматически генерирует путь к персональному хранилищу, если он не задан.
        """
        if not self.storage_path:
            self.storage_path = f'user_{self.id}'
        super().save(*args, **kwargs)

    REQUIRED_FIELDS = ['full_name', 'email']

    def __str__(self):
        return self.username


@receiver(post_delete, sender=User)
def auto_delete_user_storage(sender, instance: 'User', **kwargs):
    """
    Полное удаление папки пользователя при удалении его аккаунта.
    """
    if instance.storage_path:
        user_dir = os.path.join(settings.MEDIA_ROOT, instance.storage_path)
        if os.path.exists(user_dir):
            shutil.rmtree(user_dir)

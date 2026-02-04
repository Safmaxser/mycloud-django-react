from typing import TYPE_CHECKING, cast

from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.db.models import Sum
from rest_framework import serializers
from storage.utils import format_bytes

if TYPE_CHECKING:
    from .models import User

UserModel = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    """
    Сериализатор для работы с пользователями: преобразует данные из БД в JSON и обратно.
    """

    password = serializers.CharField(
        write_only=True, required=True, style={'input_type': 'password'}
    )
    files_count = serializers.SerializerMethodField()
    files_total_size = serializers.SerializerMethodField()
    files_total_size_human = serializers.SerializerMethodField()

    class Meta:
        model = UserModel
        fields = (
            'id',
            'username',
            'password',
            'email',
            'full_name',
            'storage_path',
            'is_staff',
            'date_joined',
            'updated_at',
            'files_count',
            'files_total_size',
            'files_total_size_human',
        )
        read_only_fields = (
            'id',
            'storage_path',
            'date_joined',
            'updated_at',
            'files_count',
            'files_total_size',
            'files_total_size_human',
        )

    def get_files_count(self, obj) -> int:
        """
        Возвращает общее количество файлов в хранилище пользователя.
        """
        return obj.files.count()

    def get_files_total_size(self, obj) -> int:
        """
        Вычисляет суммарный объем всех файлов пользователя в байтах.
        Используется для числовой сортировки на фронтенде.
        """
        return obj.files.aggregate(Sum('size'))['size__sum'] or 0

    def get_files_total_size_human(self, obj) -> str:
        """
        Преобразует суммарный объем файлов в человекочитаемый формат (КБ, МБ, ГБ).
        """
        total = self.get_files_total_size(obj)
        return format_bytes(total)

    def validate_password(self, value: str) -> str:
        """
        Валидация пароля на соответствие требованиям сложности.
        Использует стандартные валидаторы Django из settings.py.
        """
        validate_password(value)
        return value

    def validate_is_staff(self, value: bool) -> bool:
        """
        Проверяем, имеет ли право текущий пользователь менять статус админа.
        """
        request = self.context.get('request')
        if value is True:
            if not request or not request.user.is_staff:
                raise serializers.ValidationError(
                    'У вас недостаточно прав для назначения статуса администратора.'
                )
        return value

    def create(self, validated_data: dict) -> 'User':
        """
        Создает нового пользователя, используя метод create_user.
        Это гарантирует корректное хеширование пароля.
        """
        user = UserModel.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password'],
            full_name=validated_data.get('full_name', ''),
            is_staff=validated_data.get('is_staff', False),
        )
        return cast('User', user)

    def update(self, instance: 'User', validated_data: dict) -> 'User':
        """
        Обновляет данные пользователя. Если передан пароль,
        он хешируется перед сохранением.
        """
        password = validated_data.pop('password', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if password:
            instance.set_password(password)
        instance.save()
        return instance

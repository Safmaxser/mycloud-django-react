from typing import TYPE_CHECKING, cast

from django.conf import settings
from django.contrib.auth import get_user_model
from rest_framework import serializers

if TYPE_CHECKING:
    from .models import User

UserModel = get_user_model()


class UserBaseSerializer(serializers.ModelSerializer):
    """
    Базовый сериализатор со всеми методами подсчета файлов и квот
    (без password и без is_staff).
    """

    files_count = serializers.IntegerField(read_only=True)
    files_total_size = serializers.IntegerField(read_only=True)
    storage_quota = serializers.SerializerMethodField()
    max_file_size = serializers.SerializerMethodField()

    class Meta:
        model = UserModel
        fields = (
            'id',
            'username',
            'email',
            'full_name',
            'date_joined',
            'updated_at',
            'files_count',
            'files_total_size',
            'storage_quota',
            'max_file_size',
        )
        read_only_fields = (
            'id',
            'date_joined',
            'updated_at',
        )

    def get_storage_quota(self, obj) -> int:
        """
        Возвращает общий лимит хранилища из настроек.
        """
        return settings.STORAGE_QUOTA_BYTES

    def get_max_file_size(self, obj) -> int:
        """
        Возвращает лимит на один файл из настроек.
        """
        return settings.MAX_FILE_SIZE_BYTES


class UserRegistrationSerializer(UserBaseSerializer):
    """
    Сериализатор для регистрации пользователей (пароль обязателен).
    """

    password = serializers.CharField(write_only=True, required=True)

    class Meta(UserBaseSerializer.Meta):
        fields = UserBaseSerializer.Meta.fields + ('password',)

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


class UserDetailSerializer(UserBaseSerializer):
    """
    Сериализатор для детального отображения данных пользователя
    и безопасного редактирования профилей администратором.
    """

    is_staff = serializers.BooleanField(required=False)

    class Meta(UserBaseSerializer.Meta):
        fields = UserBaseSerializer.Meta.fields + ('is_staff',)

    def validate_is_staff(self, value: bool) -> bool:
        """
        Проверяем, имеет ли право текущий пользователь менять статус админа.
        """
        request = self.context.get('request')
        if not request or not request.user.is_staff:
            raise serializers.ValidationError(
                'Только администратор может изменять статус доступа.'
            )
        if self.instance and self.instance.is_staff != value:
            if self.instance.pk == request.user.pk and value is False:
                raise serializers.ValidationError(
                    'Вы не можете лишить себя прав администратора.'
                )
        return value


class UserMeSerializer(UserBaseSerializer):
    """
    Сериализатор для работы со своим профилем.
    """

    password = serializers.CharField(write_only=True, required=False)
    is_staff = serializers.BooleanField(read_only=True)

    class Meta(UserBaseSerializer.Meta):
        fields = UserBaseSerializer.Meta.fields + (
            'password',
            'is_staff',
        )

    def update(self, instance: 'User', validated_data: dict) -> 'User':
        """
        Обновляет данные пользователя. Если передан пароль,
        он хешируется перед сохранением.
        """
        password = validated_data.pop('password', None)
        instance = super().update(instance, validated_data)
        if password:
            instance.set_password(password)
            instance.save()
        return instance

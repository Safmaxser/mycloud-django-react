from typing import TYPE_CHECKING, cast

from django.conf import settings
from django.contrib.auth import authenticate, get_user_model
from django.contrib.auth.password_validation import validate_password
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
    is_staff = serializers.BooleanField(required=False)

    class Meta:
        model = UserModel
        fields = (
            'id',
            'username',
            'email',
            'full_name',
            'is_staff',
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


class UserRegistrationSerializer(UserBaseSerializer):
    """
    Сериализатор для регистрации пользователей (пароль обязателен).
    """

    password = serializers.CharField(
        write_only=True, required=True, validators=[validate_password]
    )

    class Meta(UserBaseSerializer.Meta):
        fields = UserBaseSerializer.Meta.fields + ('password',)

    def create(self, validated_data: dict) -> 'User':
        """
        Создает нового пользователя, используя метод create_user.
        Это гарантирует корректное хеширование пароля.
        """
        validated_data['is_staff'] = False
        return cast('User', UserModel.objects.create_user(**validated_data))


class UserDetailSerializer(UserBaseSerializer):
    """
    Сериализатор для детального отображения данных пользователя
    и безопасного редактирования профилей администратором.
    """

    pass


class UserMeSerializer(UserBaseSerializer):
    """
    Сериализатор для работы со своим профилем.
    """

    password = serializers.CharField(
        write_only=True, required=False, validators=[validate_password]
    )
    is_staff = serializers.BooleanField(read_only=True)

    class Meta(UserBaseSerializer.Meta):
        fields = UserBaseSerializer.Meta.fields + ('password',)

    def update(self, instance: 'User', validated_data: dict) -> 'User':
        """
        Обновляет данные пользователя. Если передан пароль,
        он хешируется перед сохранением.
        """
        password = validated_data.pop('password', None)
        if password:
            instance.set_password(password)
        return super().update(instance, validated_data)


class LoginSerializer(serializers.Serializer):
    """
    Сериализатор для валидации учетных данных при входе.
    """

    username = serializers.CharField(required=True)
    password = serializers.CharField(write_only=True, required=True)

    def validate(self, attrs):
        username = attrs.get('username')
        password = attrs.get('password')
        user = authenticate(
            request=self.context.get('request'), username=username, password=password
        )

        if not user:
            raise serializers.ValidationError(
                {'detail': 'Ошибка аутентификации: неверные учетные данные'},
                code='authorization_failed',
            )
        attrs['user'] = user
        return attrs

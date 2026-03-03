import logging
from typing import Any, Dict, Type, cast

from django.contrib.auth import (
    get_user_model,
    login,
    logout,
    update_session_auth_hash,
)
from django.db.models import QuerySet
from rest_framework import filters, permissions, serializers, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.serializers import BaseSerializer
from rest_framework.views import APIView

from .models import UserQuerySet
from .serializers import (
    LoginSerializer,
    UserDetailSerializer,
    UserMeSerializer,
    UserRegistrationSerializer,
)

User = get_user_model()
logger = logging.getLogger(__name__)


class UserViewSet(viewsets.ModelViewSet):
    """
    Управление пользователями: регистрация, профили и администрирование.
    """

    queryset = User.objects.all()
    serializer_class = UserDetailSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['username', 'full_name', 'email']
    ordering_fields = [
        'username',
        'email',
        'files_total_size',
        'date_joined',
        'is_staff',
    ]
    ordering = ['-date_joined']

    def get_queryset(self) -> QuerySet:  # type: ignore[override]
        """
        Возвращает список пользователей с расчетом статистики на уровне БД.
        Исключает текущего админа из общего списка для удобства управления.
        """
        user = self.request.user
        queryset = cast(UserQuerySet, self.queryset).with_stats()
        if user.is_staff:
            if self.action == 'list':
                return queryset.exclude(pk=user.pk)
            return queryset
        return queryset.filter(pk=user.pk)

    def get_permissions(self):
        """
        Динамическое определение прав доступа.
        """
        if self.action == 'create':
            return [permissions.AllowAny()]
        if self.action == 'me':
            return super().get_permissions()
        return [permissions.IsAdminUser()]

    def get_serializer_class(self) -> Type[BaseSerializer]:  # type: ignore[override]
        if self.action == 'create':
            return UserRegistrationSerializer
        if self.action == 'me':
            return UserMeSerializer
        return super().get_serializer_class()

    def perform_create(self, serializer):
        """
        Логируем создание нового аккаунта.
        """
        instance = serializer.save()
        logger.info(f'Зарегистрирован новый пользователь: {instance.username}')

    def perform_destroy(self, instance):
        """
        Логируем удаление пользователя.
        """
        request_user = self.request.user

        if request_user == instance:
            logger.warning(
                f'Пользователь {request_user.username} '
                'самостоятельно удалил свой аккаунт'
            )
        else:
            logger.warning(
                f'Администратор {request_user.username} '
                f'удалил пользователя: {instance.username}'
            )
        instance.delete()

    @action(detail=False, methods=['get', 'patch', 'put', 'delete'], url_path='me')
    def me(self, request):
        """
        Управление профилем текущего авторизованного пользователя.
        """
        user = self.get_queryset().get(pk=request.user.pk)
        if request.method == 'GET':
            serializer = self.get_serializer(user)
            return Response(serializer.data)
        if request.method == 'DELETE':
            self.perform_destroy(user)
            return Response(status=status.HTTP_204_NO_CONTENT)
        serializer = self.get_serializer(user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        if 'password' in request.data:
            update_session_auth_hash(request, user)
        return Response(serializer.data)


class JsonLoginView(APIView):
    """
    Аутентификация пользователя и создание сессии.
    При успешном входе возвращает объект пользователя.
    """

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data, context={'request': request})
        try:
            serializer.is_valid(raise_exception=True)
        except serializers.ValidationError:
            username = request.data.get('username', 'unknown')
            logger.warning(f'Неудачная попытка входа для пользователя: {username}')
            raise
        data = cast(Dict[str, Any], serializer.validated_data)
        user = data['user']
        user_queryset = cast(UserQuerySet, User.objects)
        user_with_stats = user_queryset.with_stats().get(pk=user.pk)
        login(request, user)
        logger.info(f'Пользователь {user.username} успешно вошел в систему')
        response_serializer = UserDetailSerializer(
            user_with_stats, context={'request': request}
        )
        return Response(
            {'detail': 'Сессия успешно создана', 'user': response_serializer.data},
            status=status.HTTP_200_OK,
        )


class JsonLogoutView(APIView):
    """
    Завершение сессии текущего пользователя.
    """

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user_name = request.user.username
        logout(request)
        logger.info(f'Пользователь {user_name} вышел из системы')
        return Response({'detail': 'Сессия завершена'}, status=status.HTTP_200_OK)

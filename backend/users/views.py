import logging
from typing import Type, cast

from django.contrib.auth import (
    authenticate,
    get_user_model,
    login,
    logout,
    update_session_auth_hash,
)
from django.db.models import Count, QuerySet, Sum, Value
from django.db.models.functions import Coalesce
from rest_framework import filters, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.serializers import BaseSerializer
from rest_framework.views import APIView

from core.permissions import IsOwnerOrAdmin

from .models import UserQuerySet
from .serializers import (
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
    permission_classes = [IsOwnerOrAdmin]
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
        if self.action == 'list':
            return [permissions.IsAdminUser()]
        return super().get_permissions()

    def get_serializer_class(self) -> Type[BaseSerializer]:  # type: ignore[override]
        """
        Динамический выбор сериализатора в зависимости от действия.
        """
        if self.action == 'create':
            return UserRegistrationSerializer
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
            serializer = UserMeSerializer(user, context={'request': request})
            return Response(serializer.data)
        if request.method == 'DELETE':
            user.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        serializer = UserMeSerializer(
            user, data=request.data, partial=True, context={'request': request}
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
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
        username = request.data.get('username')
        password = request.data.get('password')
        user = authenticate(request, username=username, password=password)
        if user is not None:
            user_with_stats = User.objects.annotate(
                files_total_size=Coalesce(Sum('files__size'), Value(0)),
                files_count=Count('files'),
            ).get(pk=user.pk)

            login(request, user)
            logger.info(f'Пользователь {user.username} успешно вошел в систему')
            serializer = UserDetailSerializer(
                user_with_stats, context={'request': request}
            )
            return Response(
                {'detail': 'Сессия успешно создана', 'user': serializer.data},
                status=status.HTTP_200_OK,
            )
        logger.warning(f'Неудачная попытка входа для пользователя: {username}')
        return Response(
            {'detail': 'Ошибка аутентификации: неверные учетные данные'},
            status=status.HTTP_401_UNAUTHORIZED,
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

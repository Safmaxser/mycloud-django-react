import logging

from core.permissions import IsOwnerOrAdmin
from django.contrib.auth import authenticate, get_user_model, login, logout
from django.db.models import QuerySet
from rest_framework import filters, permissions, status, viewsets
from rest_framework.response import Response
from rest_framework.views import APIView

from .serializers import UserSerializer

User = get_user_model()
logger = logging.getLogger(__name__)


class UserViewSet(viewsets.ModelViewSet):
    """
    Управление пользователями: регистрация, профили и администрирование.
    """

    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsOwnerOrAdmin]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['username', 'full_name', 'email']
    ordering_fields = ['username', 'date_joined', 'updated_at']
    ordering = ['-date_joined']

    def get_permissions(self):
        """
        Динамическое определение прав доступа.
        """
        if self.action == 'create':
            return [permissions.AllowAny()]
        if self.action == 'list':
            return [permissions.IsAuthenticated()]
        return super().get_permissions()

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

    def get_queryset(self) -> QuerySet:  # type: ignore[override]
        """
        Получение списка пользователей.
        Администратор видит всех, обычный пользователь — только себя.
        """
        user = self.request.user
        if user.is_staff:
            return self.queryset.prefetch_related('files')
        return self.queryset.filter(pk=user.pk).prefetch_related('files')


class JsonLoginView(APIView):
    """
    Аутентификация пользователя и создание сессии.
    """

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        user = authenticate(request, username=username, password=password)
        if user is not None:
            login(request, user)
            logger.info(f'Пользователь {user.username} успешно вошел в систему')
            return Response(
                {'detail': 'Сессия успешно создана', 'username': user.username},
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

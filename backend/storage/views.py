import logging
from typing import cast

from django.db.models import QuerySet
from django.shortcuts import get_object_or_404
from rest_framework import filters, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.parsers import JSONParser, MultiPartParser
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from core.permissions import IsOwnerOrAdmin

from .models import File
from .serializers import FileSerializer
from .utils import generate_file_response

logger = logging.getLogger(__name__)


class FileViewSet(viewsets.ModelViewSet):
    """
    Управление файловым хранилищем: список, загрузка, удаление и редактирование.
    """

    queryset = File.objects.all()
    serializer_class = FileSerializer
    parser_classes = [MultiPartParser, JSONParser]
    permission_classes = [IsOwnerOrAdmin]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['original_name', 'comment']
    ordering_fields = [
        'original_name',
        'size',
        'created_at',
        'download_count',
        'special_link_token',
    ]
    ordering = ['-created_at']

    def get_queryset(self) -> QuerySet[File]:  # type: ignore[override]
        """
        Возвращает список файлов, принадлежащих только текущему пользователю.
        """
        request = cast(Request, self.request)
        user = request.user
        target_user_id = request.query_params.get('user_id')
        if user.is_staff:
            if self.detail:
                return self.queryset
            if target_user_id:
                return self.queryset.filter(owner_id=target_user_id)
            return self.queryset.filter(owner=user)
        return self.queryset.filter(owner=user)

    def perform_create(self, serializer):
        """
        Привязывает загружаемый файл к текущему авторизованному пользователю.
        """
        user = self.request.user
        serializer.save(owner=user)
        logger.info(
            f'Пользователь {user} загрузил файл: {serializer.instance.original_name}'
        )

    @action(detail=True, methods=['get'])
    def download(self, request, pk=None):
        """
        Скачивание файла владельцем.
        """
        file_obj = self.get_object()
        logger.info(
            f'Пользователь {request.user} начал скачивание файла: '
            f'{file_obj.original_name} (ID: {file_obj.id})'
        )
        file_obj.touch_download()
        is_inline = request.query_params.get('inline') == 'true'
        return generate_file_response(file_obj, inline=is_inline)

    @action(detail=True, methods=['post'], url_path='generate-link')
    def generate_link(self, request, pk=None):
        """
        Формирование специальной ссылки для внешних пользователей.
        """
        file_obj = self.get_object()
        token = file_obj.generate_special_link()
        logger.info(
            f'Пользователь {request.user} создал публичную ссылку для файла: '
            f'{file_obj.original_name} (ID: {file_obj.id})'
        )
        return Response(
            {'detail': 'Публичная ссылка сформирована', 'token': token},
            status=status.HTTP_200_OK,
        )

    @action(detail=True, methods=['post'], url_path='revoke-link')
    def revoke_link(self, request, pk=None):
        """
        Отзыв специальной ссылки (сброс доступа).
        """
        file_obj = self.get_object()
        file_obj.revoke_special_link()
        logger.info(
            f'Пользователь {request.user} отозвал публичную ссылку для файла: '
            f'{file_obj.original_name} (ID: {file_obj.id})'
        )
        return Response(
            {'detail': 'Публичная ссылка отозвана'},
            status=status.HTTP_200_OK,
        )


class ExternalDownloadView(APIView):
    """
    Скачивание файла по специальной ссылке (без авторизации).
    """

    permission_classes = [permissions.AllowAny]

    def get(self, request, token):
        """
        Проверяет токен и отдает файл внешнему пользователю.
        """
        file_obj = get_object_or_404(File, special_link_token=token)
        logger.info(
            f'Анонимное скачивание по токену для файла: '
            f'{file_obj.original_name} (ID: {file_obj.id})'
        )
        file_obj.touch_download()
        is_inline = request.query_params.get('inline') == 'true'
        return generate_file_response(file_obj, inline=is_inline)

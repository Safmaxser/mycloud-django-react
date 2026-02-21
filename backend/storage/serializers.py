from django.conf import settings
from django.db.models import Sum
from rest_framework import serializers

from .models import File


class FileSerializer(serializers.ModelSerializer):
    """
    Сериализатор для работы с файловыми объектами хранилища.
    """

    file = serializers.FileField(allow_empty_file=True)
    owner_username = serializers.ReadOnlyField(source='owner.username')

    class Meta:
        model = File
        fields = (
            'id',
            'file',
            'original_name',
            'size',
            'comment',
            'special_link_token',
            'mimetype',
            'owner_username',
            'download_count',
            'last_download_at',
            'created_at',
            'updated_at',
        )

        read_only_fields = (
            'id',
            'size',
            'special_link_token',
            'mimetype',
            'download_count',
            'last_download_at',
            'created_at',
            'updated_at',
        )

    def validate_original_name(self, value: str) -> str:
        """
        Проверка: имя файла не должно быть пустым при переименовании.
        """
        if not value.strip():
            raise serializers.ValidationError('Имя файла не может быть пустым.')
        return value

    def validate_file(self, value):
        """
        Комплексная проверка: лимит одного файла + лимит всего хранилища.
        """
        user = self.context['request'].user
        if value.size > settings.MAX_FILE_SIZE_BYTES:
            limit_mb = settings.MAX_FILE_SIZE_BYTES // (1024 * 1024)
            raise serializers.ValidationError(
                f'Файл слишком большой. Максимум для одного файла: {limit_mb} МБ.'
            )
        current_usage = (
            File.objects.filter(owner=user).aggregate(total=Sum('size'))['total'] or 0
        )
        if current_usage + value.size > settings.STORAGE_QUOTA_BYTES:
            free_space_mb = (settings.STORAGE_QUOTA_BYTES - current_usage) // (
                1024 * 1024
            )
            if free_space_mb < 1:
                free_space_kb = (settings.STORAGE_QUOTA_BYTES - current_usage) // 1024
                error_msg = f'Недостаточно места. Доступно: {free_space_kb} КБ.'
            else:
                error_msg = f'Недостаточно места. Доступно: {free_space_mb} МБ.'
            raise serializers.ValidationError(error_msg)
        return value

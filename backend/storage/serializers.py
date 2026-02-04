from django.core.files.uploadedfile import UploadedFile
from rest_framework import serializers

from .models import File
from .utils import format_bytes


class FileSerializer(serializers.ModelSerializer):
    """
    Сериализатор для работы с файлами: преобразует данные из БД в JSON и обратно.
    """

    owner_username = serializers.ReadOnlyField(source='owner.username')
    size_human = serializers.SerializerMethodField()

    class Meta:
        model = File
        fields = (
            'id',
            'file',
            'original_name',
            'size',
            'size_human',
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
            'size_human',
            'special_link_token',
            'mimetype',
            'owner_username',
            'download_count',
            'last_download_at',
            'created_at',
            'updated_at',
        )

    def get_size_human(self, obj: 'File') -> str:
        """
        Конвертирует байты в читаемый формат (КБ, МБ, ГБ).
        """
        return format_bytes(obj.size)

    def validate_original_name(self, value: str) -> str:
        """
        Проверка: имя файла не должно быть пустым при переименовании.
        """
        if not value.strip():
            raise serializers.ValidationError('Имя файла не может быть пустым.')
        return value

    def validate_file(self, value: UploadedFile) -> UploadedFile:
        """
        Проверка: размер загружаемого файла не должен превышать 500 МБ.
        """
        limit = 500 * 1024 * 1024
        if value.size > limit:
            raise serializers.ValidationError('Файл слишком большой (макс. 500 МБ).')
        return value

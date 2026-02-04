from django.contrib import admin

from .models import File
from .utils import format_bytes


@admin.register(File)
class FileAdmin(admin.ModelAdmin):
    """
    Настройка административной панели для управления файлами пользователей.
    """

    list_display = (
        'original_name',
        'owner',
        'get_size_display',
        'mimetype',
        'download_count',
        'last_download_at',
        'created_at',
        'has_link',
    )

    list_filter = (
        'mimetype',
        'created_at',
        'owner',
        'last_download_at',
    )
    search_fields = (
        'original_name',
        'owner__username',
        'comment',
    )
    readonly_fields = (
        'id',
        'size',
        'mimetype',
        'special_link_token',
        'download_count',
        'last_download_at',
        'created_at',
        'updated_at',
    )

    @admin.display(description='Размер')
    def get_size_display(self, obj: File) -> str:
        """
        Отображает размер файла в человекочитаемом формате.
        """
        return format_bytes(obj.size)

    @admin.display(description='Ссылка', boolean=True)
    def has_link(self, obj: File) -> bool:
        """
        Визуальный индикатор наличия внешней ссылки (галочка/крестик).
        """
        return obj.special_link_token is not None

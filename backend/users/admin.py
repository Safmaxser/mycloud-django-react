from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.db.models import Sum

from storage.utils import format_bytes

from .models import User


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    """
    Настройка административной панели для кастомной модели пользователя.
    """

    list_display = (
        'username',
        'email',
        'full_name',
        'get_files_count',
        'get_files_total_size',
        'is_staff',
        'date_joined',
        'is_active',
    )
    search_fields = (
        'username',
        'full_name',
        'email',
    )
    fieldsets = list(UserAdmin.fieldsets) + [
        (
            'Дополнительная информация',
            {
                'fields': (
                    'full_name',
                    'storage_path',
                    'updated_at',
                )
            },
        ),
    ]
    add_fieldsets = UserAdmin.add_fieldsets + (
        (
            'Дополнительная информация',
            {
                'fields': (
                    'full_name',
                    'email',
                )
            },
        ),
    )
    readonly_fields = (
        'id',
        'storage_path',
        'last_login',
        'date_joined',
        'updated_at',
    )

    @admin.display(description='Файлов')
    def get_files_count(self, obj):
        """
        Возвращает количество файлов пользователя для отображения в списке.
        """
        return obj.files.count()

    @admin.display(description='Общий объем')
    def get_files_total_size(self, obj):
        """
        Возвращает суммарный размер хранилища пользователя в человекочитаемом формате.
        """
        total = obj.files.aggregate(Sum('size'))['size__sum'] or 0
        return format_bytes(total)

    def get_form(self, request, obj=None, change=False, **kwargs):
        """
        Переопределение формы для корректного отображения полей.
        """
        return super().get_form(request, obj, change, **kwargs)

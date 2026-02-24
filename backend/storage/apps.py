from django.apps import AppConfig


class StorageConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'storage'

    def ready(self) -> None:
        """
        Регистрация сигналов WebSocket-синхронизации при инициализации приложения.
        """
        import storage.signals  # noqa: F401

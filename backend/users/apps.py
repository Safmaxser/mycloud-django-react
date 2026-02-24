from django.apps import AppConfig


class UsersConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'users'

    def ready(self) -> None:
        """
        Регистрация сигналов WebSocket-синхронизации при инициализации приложения.
        """
        import users.signals  # noqa: F401

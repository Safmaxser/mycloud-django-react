import importlib
import sys

import pytest


class TestSettingsLogic:
    """
    Тесты динамической логики settings.py: DEBUG-зависимости и валидация методов отдачи.
    """

    def test_debug_mode_enables_toolbar(self, monkeypatch):
        """
        Проверка подключения Debug Toolbar при DEBUG = True.
        """
        monkeypatch.setenv('DEBUG', 'True')

        # Локальный импорт и принудительная перезагрузка модуля
        from core import settings as core_settings

        importlib.reload(core_settings)

        assert 'debug_toolbar' in core_settings.INSTALLED_APPS
        assert (
            'debug_toolbar.middleware.DebugToolbarMiddleware'
            in core_settings.MIDDLEWARE
        )
        assert '127.0.0.1' in core_settings.INTERNAL_IPS

    def test_debug_mode_disabled(self, monkeypatch):
        """
        Проверка ветки False для условия if DEBUG.
        """
        # 1. Принудительно ставим False в окружении
        monkeypatch.setenv('DEBUG', 'False')

        from core import settings as core_settings

        importlib.reload(core_settings)

        # 2. Проверяем, что списки остались чистыми
        assert 'debug_toolbar' not in core_settings.INSTALLED_APPS
        assert not any('DebugToolbarMiddleware' in m for m in core_settings.MIDDLEWARE)
        assert core_settings.DEBUG is False

    def test_file_serve_method_validation_logic(self, monkeypatch):
        """
        Проверка получения значения и отката на django.
        """
        import importlib

        from core import settings as core_settings

        # 1. Сценарий: Невалидное значение (должен сработать fallback на django)
        # Мы ставим "invalid", что заставит сработать условие if в конце settings.py
        monkeypatch.setenv('FILE_SERVE_METHOD', 'INVALID_VALUE')
        importlib.reload(core_settings)
        assert core_settings.FILE_SERVE_METHOD == 'django'

        # 2. Сценарий: Валидное значение (nginx)
        monkeypatch.setenv('FILE_SERVE_METHOD', 'NGINX')
        importlib.reload(core_settings)
        assert core_settings.FILE_SERVE_METHOD == 'nginx'

    def test_file_serve_method_validation_fallback(self, monkeypatch):
        """
        Проверка отката на 'django', если указан неверный метод.
        """
        monkeypatch.setenv('FILE_SERVE_METHOD', 'invalid_method')

        # Локальный импорт и принудительная перезагрузка модуля
        from core import settings as core_settings

        importlib.reload(core_settings)

        assert core_settings.FILE_SERVE_METHOD == 'django'

    def test_file_serve_method_valid_nginx(self, monkeypatch):
        """
        Проверка принятия валидного метода 'nginx'.
        """
        monkeypatch.setenv('FILE_SERVE_METHOD', 'NGINX')
        from core import settings as core_settings

        importlib.reload(core_settings)
        assert core_settings.FILE_SERVE_METHOD == 'nginx'

    def test_settings_is_testing_false_branch(self, monkeypatch):
        """
        Проверка ветки False для условия if IS_TESTING.
        Имитируем запуск обычного сервера (не pytest).
        """
        original_argv = sys.argv
        original_modules = sys.modules.copy()
        try:
            sys.argv = ['manage.py', 'runserver']
            if 'pytest' in sys.modules:
                del sys.modules['pytest']

            # Локальный импорт и принудительная перезагрузка модуля
            from core import settings as core_settings

            importlib.reload(core_settings)

            assert core_settings.IS_TESTING is False
        finally:
            sys.argv = original_argv
            sys.modules.update(original_modules)
            importlib.reload(importlib.import_module('core.settings'))

    def test_site_protocol_https(self, monkeypatch):
        """
        Проверка установки заголовков для HTTPS.
        """
        monkeypatch.setenv('SITE_PROTOCOL', 'https')

        # Локальный импорт и принудительная перезагрузка модуля
        from core import settings as core_settings

        importlib.reload(core_settings)

        assert core_settings.SECURE_PROXY_SSL_HEADER == (
            'HTTP_X_FORWARDED_PROTO',
            'https',
        )
        assert core_settings.USE_X_FORWARDED_HOST is True

    @pytest.fixture(autouse=True)
    def reset_settings(self):
        """
        Фикстура для возврата настроек в исходное состояние после тестов.
        """
        yield

        # Локальный импорт и принудительная перезагрузка модуля
        from core import settings as core_settings

        importlib.reload(core_settings)

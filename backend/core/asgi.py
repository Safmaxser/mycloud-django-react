"""
Конфигурация ASGI для проекта MyCloud.
Обеспечивает маршрутизацию трафика между стандартным HTTP (Django)
и протоколом WebSocket (Django Channels) с поддержкой авторизации.
"""

import os
from typing import Any, cast

from channels.auth import AuthMiddlewareStack
from channels.routing import ProtocolTypeRouter, URLRouter
from django.core.asgi import get_asgi_application
from django.urls import path

# Установка настроек модуля Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')

# Инициализация ASGI-приложения Django для обработки HTTP
django_asgi_app = get_asgi_application()

# Импорт консьюмера выполняется после инициализации основного приложения
from core.consumers import CloudConsumer  # noqa: E402

application = ProtocolTypeRouter(
    {
        # Стандартный HTTP-трафик
        'http': django_asgi_app,
        # Трафик реального времени с поддержкой сессий Django
        'websocket': AuthMiddlewareStack(
            URLRouter(
                [
                    path('ws/cloud/', cast(Any, CloudConsumer.as_asgi())),
                ]
            )
        ),
    }
)

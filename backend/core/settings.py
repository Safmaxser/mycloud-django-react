"""
Конфигурационный файл Django для проекта MyCloud.

Обеспечивает динамическое управление настройками через переменные окружения (.env).
Интегрирован с архитектурой DRF (API), Daphne (WebSockets) и Nginx (X-Accel-Redirect).
"""

import sys
from pathlib import Path

import environ

BASE_DIR = Path(__file__).resolve().parent.parent

env = environ.Env(
    DEBUG=(bool, False),
    ALLOWED_HOSTS=(list, ['127.0.0.1', 'localhost']),
    DATABASE_URL=(str, 'sqlite://:memory:'),
    CORS_ALLOWED_ORIGINS=(list, []),
    CSRF_TRUSTED_ORIGINS=(list, []),
    SESSION_COOKIE_DOMAIN=(str, ''),
    CSRF_COOKIE_DOMAIN=(str, ''),
    STORAGE_QUOTA_MB=(int, 2048),
    MAX_FILE_SIZE_MB=(int, 500),
    FILE_SERVE_METHOD=(str, 'django'),
    BASE_REDIS_URL=(str, 'redis://redis:6379'),
)

environ.Env.read_env(BASE_DIR.parent / '.env')

# Основные параметры безопасности
SECRET_KEY = env('SECRET_KEY')
DEBUG = env('DEBUG')
ALLOWED_HOSTS = env.list('ALLOWED_HOSTS')

# --- Определение состава приложений ---
INSTALLED_APPS = [
    'daphne',  # Должен быть выше staticfiles для корректной работы ASGI
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    # Библиотеки расширения
    'rest_framework',
    'django_filters',
    'corsheaders',
    'channels',
    # Модули проекта
    'storage',
    'users',
]

if DEBUG:
    INSTALLED_APPS += ['debug_toolbar']
    INTERNAL_IPS = ['127.0.0.1', 'localhost']

# --- Промежуточное ПО (Middleware) ---
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'core.middleware.EventLoggingMiddleware',
]

if DEBUG:
    MIDDLEWARE.insert(0, 'debug_toolbar.middleware.DebugToolbarMiddleware')

ROOT_URLCONF = 'core.urls'

# --- Настройки CORS и CSRF (Безопасность SPA) ---
CORS_ALLOWED_ORIGINS = env.list('CORS_ALLOWED_ORIGINS')
CORS_ALLOW_CREDENTIALS = True
CSRF_TRUSTED_ORIGINS = env.list('CSRF_TRUSTED_ORIGINS')

# Параметры Cookies (настроены на SameSite=Lax для работы SPA в одном домене)
SESSION_COOKIE_DOMAIN = env('SESSION_COOKIE_DOMAIN')
CSRF_COOKIE_DOMAIN = env('CSRF_COOKIE_DOMAIN')
SESSION_COOKIE_SECURE = not DEBUG
CSRF_COOKIE_SECURE = not DEBUG
CSRF_COOKIE_HTTPONLY = False  # Позволяет фронтенду (Axios) читать CSRF-токен
CSRF_COOKIE_SAMESITE = 'Lax'
SESSION_COOKIE_SAMESITE = 'Lax'

# --- Django REST Framework (API) ---
REST_FRAMEWORK = {
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.SessionAuthentication',
    ],
    'DEFAULT_FILTER_BACKENDS': [
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ],
    'SEARCH_PARAM': 'q',
    'ORDERING_PARAM': 'o',
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle',
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '500/hour',
        'user': '2000/hour',
    },
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 10,  # Синхронизировано с фронтенд-константой PAGE_SIZE
    'TEST_REQUEST_DEFAULT_FORMAT': 'json',
}

# --- Real-time (WebSockets & Redis) ---
CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels_redis.core.RedisChannelLayer',
        'CONFIG': {'hosts': [f'{env.str("BASE_REDIS_URL")}/0']},
    },
}

CACHES = {
    'default': {
        'BACKEND': 'django_redis.cache.RedisCache',
        'LOCATION': f'{env.str("BASE_REDIS_URL")}/1',
        'OPTIONS': {
            'CLIENT_CLASS': 'django_redis.client.DefaultClient',
        },
        'KEY_PREFIX': 'mycloud',
    }
}

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

# --- База данных и Пользователи ---
DATABASES = {'default': env.db_url('DATABASE_URL')}

AUTH_USER_MODEL = 'users.User'
VAL_PATH = 'django.contrib.auth.password_validation'
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': f'{VAL_PATH}.UserAttributeSimilarityValidator'},
    {
        'NAME': f'{VAL_PATH}.MinimumLengthValidator',
        'OPTIONS': {
            'min_length': 6,
        },
    },
    {'NAME': f'{VAL_PATH}.CommonPasswordValidator'},
    {'NAME': f'{VAL_PATH}.NumericPasswordValidator'},
    {'NAME': 'core.validators.ComplexPasswordValidator'},
]
ACCOUNT_UNIQUE_EMAIL = True

# --- Логирование ---
LOG_LEVEL_DEBUG = 'DEBUG' if DEBUG else 'ERROR'
LOG_LEVEL_INFO = 'INFO' if DEBUG else 'ERROR'
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '[{levelname}] {asctime} {name}.{module}: {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'level': 'DEBUG',
            'class': 'logging.StreamHandler',
            'formatter': 'verbose',
        },
    },
    'loggers': {
        'django': {
            'handlers': ['console'],
            'level': LOG_LEVEL_INFO,
            'propagate': True,
        },
        'storage': {
            'handlers': ['console'],
            'level': LOG_LEVEL_DEBUG,
            'propagate': True,
        },
        'users': {
            'handlers': ['console'],
            'level': LOG_LEVEL_DEBUG,
            'propagate': True,
        },
        'daphne': {
            'handlers': ['console'],
            'level': LOG_LEVEL_INFO,
            'propagate': False,
        },
        'django.channels': {
            'handlers': ['console'],
            'level': LOG_LEVEL_DEBUG,
            'propagate': False,
        },
        'core': {
            'handlers': ['console'],
            'level': LOG_LEVEL_DEBUG,
            'propagate': True,
        },
    },
}

# --- Точки входа и Статика ---
WSGI_APPLICATION = 'core.wsgi.application'
ASGI_APPLICATION = 'core.asgi.application'

STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_DIRS = [BASE_DIR / 'static']
MEDIA_URL = '/protected_media/'
MEDIA_ROOT = BASE_DIR / 'protected_media'

# Локализация
LANGUAGE_CODE = 'ru-ru'
TIME_ZONE = 'Europe/Moscow'
USE_I18N = True
USE_TZ = True
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# --- Хранилище и лимиты ---
# Конвертация МБ в Байты для системных проверок
STORAGE_QUOTA_BYTES = int(env.int('STORAGE_QUOTA_MB')) * 1024 * 1024  # type: ignore
MAX_FILE_SIZE_BYTES = int(env.int('MAX_FILE_SIZE_MB')) * 1024 * 1024  # type: ignore

# Выбор метода отдачи файлов (django для разработки, nginx для продакшена)
FILE_SERVE_METHOD = str(env('FILE_SERVE_METHOD')).lower()
if FILE_SERVE_METHOD not in ['django', 'nginx']:
    FILE_SERVE_METHOD = 'django'

# --- Настройки для тестирования (автоматическое переключение) ---
# Проверяем, запущены ли тесты через pytest
IS_TESTING = 'pytest' in sys.modules or (len(sys.argv) > 1 and 'pytest' in sys.argv)
if IS_TESTING:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': ':memory:',
        }
    }
    CACHES = {
        'default': {
            'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
            'LOCATION': 'unique-snowflake',
        }
    }
    CHANNEL_LAYERS = {
        'default': {
            'BACKEND': 'channels.layers.InMemoryChannelLayer',
        },
    }
    PASSWORD_HASHERS = [
        'django.contrib.auth.hashers.MD5PasswordHasher',
    ]

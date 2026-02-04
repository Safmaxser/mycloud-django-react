import logging

from django.urls import Resolver404, resolve


class EventLoggingMiddleware:
    """
    Middleware для автоматического логирования всех событий API.
    Динамически определяет логгер на основе приложения (storage или users).
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        try:
            match = resolve(request.path)
            app_name = match.app_name or 'django'
            logger = logging.getLogger(app_name)
        except Resolver404:
            logger = logging.getLogger('django')

        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        user_agent = request.META.get('HTTP_USER_AGENT', 'unknown')
        user = request.user if request.user.is_authenticated else 'Anonymous'
        status = response.status_code
        method = request.method
        path = request.path

        log_msg = (
            f'{status}: {method} {path} (User: {user}, IP: {ip}, Browser: {user_agent})'
        )

        if status >= 500:
            logger.error(f'СЕРВЕРНАЯ ОШИБКА -> {log_msg}')
        elif status >= 400:
            logger.warning(f'ОШИБКА КЛИЕНТА -> {log_msg}')
        elif method in ['POST', 'PUT', 'PATCH', 'DELETE'] or 'download' in path:
            logger.info(f'ДЕЙСТВИЕ -> {log_msg}')

        return response

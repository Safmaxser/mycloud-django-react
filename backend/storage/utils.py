import logging
import urllib.parse

from django.conf import settings
from django.http import FileResponse, HttpResponse

logger = logging.getLogger('storage')


def generate_file_response(file_obj, inline: bool = False):
    """
    Формирует HTTP-ответ для отдачи файла.
    Выбирает метод (Nginx X-Accel-Redirect или Django FileResponse)
    на основе настроек FILE_SERVE_METHOD.
    """
    try:
        if settings.FILE_SERVE_METHOD == 'django':
            logger.debug(
                'Отдача файла через Django FileResponse: '
                f'{file_obj.original_name} (ID: {file_obj.id}) '
            )
            response = FileResponse(
                open(file_obj.file.path, 'rb'),
                as_attachment=not inline,
                filename=file_obj.original_name,
            )
            response['Content-Type'] = file_obj.mimetype
            return response

        filename_quoted = urllib.parse.quote(file_obj.original_name)
        disposition = 'inline' if inline else 'attachment'
        response = HttpResponse()
        response['X-Accel-Redirect'] = f'/protected_files/{file_obj.file.name}'
        response['Content-Type'] = file_obj.mimetype
        response['Content-Disposition'] = (
            f'{disposition}; filename="{file_obj.original_name}"; '
            f"filename*=UTF-8''{filename_quoted}"
        )
        logger.debug(
            'Подготовлен X-Accel-Redirect для Nginx: '
            f'{file_obj.original_name} (ID: {file_obj.id}) '
            f'(Internal Path: {file_obj.file.name})'
        )
        return response
    except Exception as e:
        logger.error(
            'Ошибка при формировании ответа для файла: '
            f'{file_obj.original_name} (ID: {file_obj.id}): {str(e)}',
            exc_info=True,
        )
        raise


def format_bytes(size_bytes: int) -> str:
    """
    Универсальная функция конвертации байтов в читаемый формат
    """
    if size_bytes == 0:
        return '0 B'
    units = ['B', 'KB', 'MB', 'GB', 'TB']
    size = float(size_bytes)
    for unit in units:
        if size < 1024:
            return f'{size:.2f} {unit}'
        size /= 1024
    return f'{size:.2f} PB'

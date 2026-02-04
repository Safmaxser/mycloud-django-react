import logging

from django.http import HttpResponse

logger = logging.getLogger('storage')


def generate_file_response(file_obj, inline: bool = False):
    """
    Формирует HTTP-ответ для отдачи файла через Nginx (X-Accel-Redirect).
    Параметр inline=True позволяет браузеру отобразить файл (превью),
    вместо принудительного скачивания.
    """
    try:
        response = HttpResponse()
        response['X-Accel-Redirect'] = f'/protected_files/{file_obj.file.name}'
        disposition = 'inline' if inline else 'attachment'
        filename = file_obj.original_name.encode('utf-8').decode('latin-1')
        response['Content-Type'] = file_obj.mimetype
        response['Content-Disposition'] = f'{disposition}; filename="{filename}"'
        logger.debug(
            'Подготовлен X-Accel-Redirect для файла: '
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

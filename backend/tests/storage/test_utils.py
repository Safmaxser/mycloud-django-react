from unittest.mock import patch

import pytest

from storage.utils import format_bytes, generate_file_response


@pytest.mark.django_db
class TestStorageUtils:
    """
    Тесты вспомогательных функций хранилища: генерация ответов и обработка ошибок.
    """

    def test_generate_file_response_error_logging(self, file_factory, settings):
        """
        Проверка: логирование сбоя и повторный выброс (raise) исключения.
        """
        settings.FILE_SERVE_METHOD = 'nginx'
        file_obj = file_factory(original_name='test.txt')
        with patch(
            'storage.utils.HttpResponse', side_effect=Exception('Ошибка сервера')
        ):
            with pytest.raises(Exception) as excinfo:
                generate_file_response(file_obj)
        assert 'Ошибка сервера' in str(excinfo.value)


class TestFormatBytes:
    """
    Тесты конвертера байтов в читаемый формат (B, KB, MB ... PB).
    """

    @pytest.mark.parametrize(
        'size_bytes, expected',
        [
            (0, '0 B'),
            (512, '512.00 B'),
            (1024, '1.00 KB'),
            (1024**2, '1.00 MB'),
            (1024**3 * 1.5, '1.50 GB'),
            (1024**4, '1.00 TB'),
            (1024**5 * 10, '10.00 PB'),
        ],
    )
    def test_format_bytes_logic(self, size_bytes, expected):
        """
        Проверка корректности расчетов для всех порядков величин.
        """
        assert format_bytes(size_bytes) == expected

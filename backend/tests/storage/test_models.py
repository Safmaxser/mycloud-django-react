import pytest
from django.core.cache import cache
from django.core.files.uploadedfile import SimpleUploadedFile
from django.utils import timezone

from storage.models import File, user_directory_path


@pytest.mark.django_db
class TestFileModelLogic:
    """
    Тесты внутренней логики модели File: метаданные, пути и безопасность скачиваний.
    """

    def test_save_auto_fills_mimetype(self, user_factory):
        """
        Автоматическое определение mimetype по расширению.
        """
        user = user_factory()
        test_file = SimpleUploadedFile('document.pdf', b'pdf content')
        file_obj = File(owner=user, file=test_file)
        file_obj.save()
        assert file_obj.mimetype == 'application/pdf'
        assert file_obj.size == len(b'pdf content')

    def test_save_respects_provided_mimetype(self, user_factory):
        """
        Сохранение вручную указанного mimetype.
        """
        user = user_factory()
        test_file = SimpleUploadedFile('image.jpg', b'jpeg content')
        custom_type = 'image/custom-format'
        file_obj = File(owner=user, file=test_file, mimetype=custom_type)
        file_obj.save()
        assert file_obj.mimetype == custom_type

    def test_save_fallback_mimetype(self, user_factory):
        """
        Установка типа по умолчанию для неизвестных расширений.
        """
        user = user_factory()
        test_file = SimpleUploadedFile('data.unknown_ext', b'some binary data')
        file_obj = File(owner=user, file=test_file)
        file_obj.save()
        assert file_obj.mimetype == 'application/octet-stream'

    def test_generate_special_link_lifecycle(self, file_factory):
        """
        Генерация нового токена и возврат существующего.
        """
        file_obj = file_factory(special_link_token=None)
        token = file_obj.generate_special_link()
        assert token is not None
        assert len(token) > 30
        file_obj.refresh_from_db()
        assert file_obj.special_link_token == token

    def test_generate_special_link_returns_existing_token(self, file_factory):
        existing_token = 'already-exists-123'
        file_obj = file_factory(special_link_token=existing_token)
        token = file_obj.generate_special_link()
        assert token == existing_token
        file_obj.refresh_from_db()
        assert file_obj.special_link_token == existing_token

    def test_user_directory_path_logic(self, user_factory, file_factory):
        """
        Проверка формирования структуры пути: user_id/YYYY/MM/DD/uuid.ext.
        """
        user = user_factory(username='testuser')
        file_obj = file_factory(owner=user)
        path = user_directory_path(file_obj, 'photo.jpg')
        assert path.startswith(f'user_{user.pk}/')
        assert timezone.now().strftime('%Y/%m/%d') in path
        assert path.endswith('.jpg')

    def test_touch_download_validation(self, file_factory):
        """
        Игнорирование некорректных запросов для счетчика.
        """
        file_obj = file_factory()
        file_obj.touch_download(request=None)
        assert file_obj.download_count == 0

        class PostRequest:
            method = 'POST'

        file_obj.touch_download(request=PostRequest())
        assert file_obj.download_count == 0

    def test_touch_download_cache_protection(self, file_factory, rf):
        """
        Защита от накрутки скачиваний через кэш (по IP).
        """
        file_obj = file_factory()
        request = rf.get('/')
        request.META['REMOTE_ADDR'] = '127.0.0.1'
        cache.clear()
        file_obj.touch_download(request)
        assert file_obj.download_count == 1
        file_obj.touch_download(request)
        assert file_obj.download_count == 1

    def test_file_save_auto_fills_original_name(self, user_factory):
        """
        Автозаполнение original_name из имени загруженного файла.
        """
        user = user_factory()
        test_file = SimpleUploadedFile('auto_name.txt', b'content')
        file_obj = File.objects.create(
            owner=user,
            file=test_file,
        )
        assert file_obj.original_name == 'auto_name.txt'

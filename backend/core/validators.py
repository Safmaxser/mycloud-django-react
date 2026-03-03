import logging
import re

from django.core.exceptions import ValidationError

logger = logging.getLogger('users')


class ComplexPasswordValidator:
    """
    Валидатор для проверки пароля на наличие заглавных букв, цифр и спецсимволов.
    """

    def validate(self, password, user=None):
        """
        Проверка пароля на соответствие требованиям сложности.
        """
        username = user.username if user else 'Anonymous'

        if not re.search(r'[A-Z]', password):
            logger.debug(
                f'Валидация пароля отклонена для {username}: '
                'отсутствует заглавная буква'
            )
            raise ValidationError(
                'Пароль должен содержать хотя бы одну заглавную букву.',
                code='no_uppercase',
            )

        if not re.search(r'\d', password):
            logger.debug(
                f'Валидация пароля отклонена для {username}: отсутствует цифра'
            )
            raise ValidationError(
                'Пароль должен содержать хотя бы одну цифру.', code='no_digit'
            )

        if not re.search(r'[!@#$%^&*(),.?":{}|<>|_\-\[\]\'/\\+~]', password):
            logger.debug(
                f'Валидация пароля отклонена для {username}: отсутствует спецсимвол'
            )
            raise ValidationError(
                'Пароль должен содержать хотя бы один спецсимвол.', code='no_special'
            )

    def get_help_text(self):
        return 'Ваш пароль должен содержать заглавную букву, цифру и спецсимвол.'

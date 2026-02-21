import axios from 'axios';

/**
 * Извлекает понятное пользователю сообщение об ошибке из ответа сервера (Axios/DRF) или исключения.
 * Игнорирует ошибки отмены запроса, возвращая null.
 */
export const parseError = (
  error: unknown,
  fallback: string = 'Произошла непредвиденная ошибка.',
): string | null => {
  if (axios.isCancel(error) || (error instanceof Error && error.name === 'AbortError')) {
    return null;
  }

  if (axios.isAxiosError(error)) {
    const data = error.response?.data;
    if (data?.detail) return data.detail;

    if (data && typeof data === 'object') {
      const firstFieldErrors = Object.values(data)[0];
      if (Array.isArray(firstFieldErrors)) return firstFieldErrors[0];
      if (typeof firstFieldErrors === 'string') return firstFieldErrors;
    }

    switch (error.code) {
      case 'ERR_NETWORK':
        return 'Ошибка сети. Проверьте интернет-соединение.';
      case 'ERR_BAD_REQUEST':
        return 'Неверный запрос или данные не найдены.';
      case 'ERR_BAD_RESPONSE':
        return 'Ошибка на стороне сервера. Пожалуйста, попробуйте позже.';
      case 'ETIMEDOUT':
      case 'ECONNABORTED':
        return 'Превышено время ожидания ответа от сервера.';
    }

    return error.message || fallback;
  }

  if (error instanceof Error) return error.message;

  return fallback;
};

import { describe, expect, it, vi } from 'vitest';
import axios, { AxiosError, type AxiosResponse } from 'axios';
import { parseError } from '../errors';

/**
 * Тестирование логики преобразования системных исключений в человекочитаемые сообщения.
 * Проверка интеграции с Axios, Django REST Framework и обработки сетевых таймаутов.
 */
describe('errors - parseError', () => {
  /** Блок проверки игнорирования прерванных запросов (Cancellations) */
  describe('Cancellations & Aborts', () => {
    it('should return null if request was cancelled via axios.isCancel', () => {
      vi.spyOn(axios, 'isCancel').mockReturnValue(true);
      expect(parseError({})).toBeNull();
      vi.restoreAllMocks();
    });

    it('should return null for AbortError (native signal)', () => {
      const abortError = new Error('Aborted');
      abortError.name = 'AbortError';
      expect(parseError(abortError)).toBeNull();
    });
  });

  /** Проверка извлечения данных из специфичных структур ответов DRF */
  describe('Axios Errors with Response Data', () => {
    it('should extract message from data.detail if present', () => {
      const error = {
        isAxiosError: true,
        response: { data: { detail: 'Доступ запрещен' } } as AxiosResponse,
      };
      expect(parseError(error)).toBe('Доступ запрещен');
    });

    it('should extract the first error from validation object (array)', () => {
      const error = {
        isAxiosError: true,
        response: {
          data: { email: ['Этот email уже занят'], username: ['Слишком коротко'] },
        } as AxiosResponse,
      };
      expect(parseError(error)).toBe('Этот email уже занят');
    });

    it('should extract the first error from validation object (string)', () => {
      const error = {
        isAxiosError: true,
        response: { data: { non_field_errors: 'Ошибка входа' } } as AxiosResponse,
      };
      expect(parseError(error)).toBe('Ошибка входа');
    });

    it('should skip non-string/non-array values and fallback to message', () => {
      const error = {
        isAxiosError: true,
        message: 'Fallback Axios Message',
        response: { data: { field: 123 } } as AxiosResponse,
      };
      expect(parseError(error)).toBe('Fallback Axios Message');
    });
  });

  /** Проверка маппинга системных кодов ошибок Axios на понятный язык */
  describe('Axios Network & System Codes', () => {
    it.each([
      ['ERR_NETWORK', 'Ошибка сети. Проверьте интернет-соединение.'],
      ['ERR_BAD_REQUEST', 'Неверный запрос или данные не найдены.'],
      ['ERR_BAD_RESPONSE', 'Ошибка на стороне сервера. Пожалуйста, попробуйте позже.'],
      ['ETIMEDOUT', 'Превышено время ожидания ответа от сервера.'],
      ['ECONNABORTED', 'Превышено время ожидания ответа от сервера.'],
    ])('should return specific message for code %s', (code, expected) => {
      const error = { isAxiosError: true, code } as AxiosError;
      expect(parseError(error)).toBe(expected);
    });

    it('should return error.message if no specific code or data found', () => {
      const error = { isAxiosError: true, message: 'Custom Axios Msg' } as AxiosError;
      expect(parseError(error)).toBe('Custom Axios Msg');
    });

    it('should return error.message if no specific code or data found', () => {
      const error = { isAxiosError: true, message: '' } as AxiosError;
      expect(parseError(error)).toBe('Произошла непредвиденная ошибка.');
    });
  });

  /** Проверка обработки стандартных исключений JS и неизвестных типов данных */
  describe('Fallback & Generic Errors', () => {
    const fallbackMsg = 'Стандартная ошибка';

    it('should return message from generic Error object', () => {
      const error = new Error('Simple error');
      expect(parseError(error)).toBe('Simple error');
    });

    it('should return fallback if input is unknown type', () => {
      expect(parseError(null, fallbackMsg)).toBe(fallbackMsg);
      expect(parseError('strange string', fallbackMsg)).toBe(fallbackMsg);
    });
  });
});

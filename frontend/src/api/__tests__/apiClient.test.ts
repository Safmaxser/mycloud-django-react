import { AxiosError, type InternalAxiosRequestConfig, type AxiosResponse } from 'axios';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { unauthorizedError } from '../../store/actions';
import apiClient from '../apiClient';
import { store } from '../../store';

/** Интерфейс для доступа к скрытым обработчикам axios в тестах */
interface AxiosInterceptorManager<T> {
  handlers: Array<{
    fulfilled: (value: T) => T | Promise<T>;
    rejected: (error: AxiosError) => Promise<never>;
  }>;
}

vi.mock('../../store', () => ({
  store: {
    dispatch: vi.fn(),
  },
}));

/**
 * Тестирование глобальных перехватчиков (Interceptors) HTTP-клиента.
 * Проверка автоматической обработки ошибок авторизации и интеграции с Redux Store.
 */
describe('apiClient interceptors', () => {
  let interceptor: AxiosInterceptorManager<AxiosResponse>['handlers'][0];

  /** Вспомогательная фабрика для генерации типизированных ошибок Axios */
  const createAxiosError = (status: number): AxiosError =>
    ({
      response: { status } as AxiosResponse,
      isAxiosError: true,
      config: {} as InternalAxiosRequestConfig,
      name: 'AxiosError',
      message: 'Request failed',
    }) as AxiosError;

  beforeEach(() => {
    vi.clearAllMocks();

    // Извлекаем первый зарегистрированный интерцептор из axios
    const responseManager = apiClient.interceptors
      .response as unknown as AxiosInterceptorManager<AxiosResponse>;
    interceptor = responseManager.handlers[0];

    // Мокаем глобальный объект location для проверки путей
    vi.stubGlobal('location', {
      pathname: '/dashboard',
      assign: vi.fn(),
    });
  });

  afterEach(() => {
    // Возвращаем настоящий объект location (window.location)
    vi.unstubAllGlobals();
  });

  /** Группа тестов обработки статус-кодов ошибок */
  describe('Error Handling (rejected)', () => {
    it('should dispatch unauthorizedError on 401 status', async () => {
      const error401 = createAxiosError(401);
      await expect(interceptor.rejected(error401)).rejects.toThrow();
      expect(store.dispatch).toHaveBeenCalledWith(unauthorizedError());
    });

    it('should dispatch unauthorizedError on 403 status', async () => {
      const error403 = createAxiosError(403);
      await expect(interceptor.rejected(error403)).rejects.toThrow();
      expect(store.dispatch).toHaveBeenCalledWith(unauthorizedError());
    });

    it('should NOT dispatch unauthorizedError if user is already on /login page', async () => {
      vi.stubGlobal('location', { pathname: '/login' });
      const error401 = createAxiosError(401);
      await expect(interceptor.rejected(error401)).rejects.toThrow();
      expect(store.dispatch).not.toHaveBeenCalled();
    });

    it('should NOT dispatch unauthorizedError on 500 server error', async () => {
      const error500 = createAxiosError(500);
      await expect(interceptor.rejected(error500)).rejects.toThrow();
      expect(store.dispatch).not.toHaveBeenCalled();
    });
  });

  /** Проверка успешного прохождения данных через интерцептор */
  describe('Success Handling (fulfilled)', () => {
    it('should return response object as is if request is successful', async () => {
      const mockResponse = { data: { success: true }, status: 200 } as AxiosResponse;
      const result = await interceptor.fulfilled(mockResponse);
      expect(result).toBe(mockResponse);
    });
  });
});

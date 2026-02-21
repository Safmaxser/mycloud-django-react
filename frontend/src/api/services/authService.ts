import type { AxiosRequestConfig } from 'axios';
import apiClient from '../apiClient';
import type { User, LoginResponse, RegisterRequest } from '../../types/user';

/**
 * Сервис для управления аутентификацией и профилем пользователя.
 */
export const authService = {
  /** Регистрирует нового пользователя. */
  register: async (data: RegisterRequest, options?: AxiosRequestConfig): Promise<User> => {
    const response = await apiClient.post<User>('/users/', data, options);
    return response.data;
  },

  /** Выполняет вход и возвращает токены доступа. */
  login: async (
    credentials: Record<string, string>,
    options?: AxiosRequestConfig,
  ): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>('/auth/login/', credentials, options);
    return response.data;
  },

  /** Завершает текущую сессию на сервере. */
  logout: async (): Promise<{ detail: string }> => {
    const response = await apiClient.post('/auth/logout/');
    return response.data;
  },

  /** Получает профиль текущего пользователя. */
  getMe: async (options?: AxiosRequestConfig): Promise<User> => {
    const response = await apiClient.get<User>('/users/me/', options);
    return response.data;
  },

  /** Частично обновляет данные профиля или пароль. */
  updateMe: async (
    data: Partial<User & { password?: string }>,
    options?: AxiosRequestConfig,
  ): Promise<User> => {
    const response = await apiClient.patch<User>('/users/me/', data, options);
    return response.data;
  },

  /** Безвозвратно удаляет аккаунт пользователя. */
  deleteMe: async (): Promise<void> => {
    await apiClient.delete<User>('/users/me/');
  },
};

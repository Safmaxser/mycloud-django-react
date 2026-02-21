import type { AxiosRequestConfig } from 'axios';
import apiClient from '../apiClient';
import type { User, UserListResponse } from '../../types/user';

/**
 * Сервис административного управления пользователями системы.
 * Требует наличия прав is_staff на стороне бэкенда.
 */
export const adminService = {
  /** Получение списка пользователей с поддержкой пагинации, поиска и сортировки. */
  getUsers: async (
    page?: number,
    ordering?: string,
    search?: string,
    options?: AxiosRequestConfig,
  ): Promise<UserListResponse> => {
    const params = {
      page: page || undefined,
      o: ordering || undefined,
      q: search || undefined,
    };
    const response = await apiClient.get<UserListResponse>('/users/', {
      ...options,
      params,
    });
    return response.data;
  },

  /** Изменение данных пользователя (статус администратора, email и др.). */
  updateUser: async (id: string, data: Partial<User>): Promise<User> => {
    const response = await apiClient.patch<User>(`/users/${id}/`, data);
    return response.data;
  },

  /** Безвозвратное удаление пользователя и всех связанных с ним файлов. */
  deleteUser: async (id: string): Promise<void> => {
    await apiClient.delete(`/users/${id}/`);
  },
};

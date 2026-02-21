import type { AxiosRequestConfig } from 'axios';
import apiClient from '../apiClient';
import type { FileItem, FileListResponse } from '../../types/storage';

/**
 * Сервис для управления файлами в облачном хранилище.
 * Поддерживает загрузку, скачивание через Blob и генерацию публичных ссылок.
 */
export const fileService = {
  /** Загрузка файла с поддержкой отслеживания прогресса и привязки к пользователю. */
  uploadFile: async (
    file: File,
    comment?: string,
    onProgress?: (percent: number) => void,
    userId?: string,
  ): Promise<FileItem> => {
    const formData = new FormData();
    formData.append('file', file);
    if (comment) formData.append('comment', comment);
    if (userId) formData.append('user_id', userId);
    const response = await apiClient.post<FileItem>('/files/', formData, {
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(Math.min(percent, 100));
        }
      },
    });
    return response.data;
  },

  /**
   * Скачивание файла через Blob и временную ссылку для сохранения оригинального имени.
   * Использует revokeObjectURL для очистки памяти после завершения операции.
   */
  downloadFile: async (
    id: string,
    name: string,
    onProgress?: (p: number | null) => void,
    options?: AxiosRequestConfig,
  ) => {
    const response = await apiClient.get(`/files/${id}/download/`, {
      ...options,
      responseType: 'blob',
      onDownloadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(Math.min(percent, 100));
        }
      },
    });
    const blob = new Blob([response.data]);
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', name);
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => {
      window.URL.revokeObjectURL(url);
    }, 1000);
  },

  /** Получение временной ObjectURL ссылки с корректным MIME-типом для предпросмотра. */
  getPreview: async (
    id: string,
    onProgress?: (p: number | null) => void,
    options?: AxiosRequestConfig,
  ) => {
    const response = await apiClient.get(`/files/${id}/download/`, {
      ...options,
      responseType: 'blob',
      onDownloadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(Math.min(percent, 100));
        }
      },
    });
    const contentType = response.headers['content-type'] || 'application/pdf';
    const blob = new Blob([response.data], { type: contentType });
    return window.URL.createObjectURL(blob);
  },

  /** Генерация уникального токена для публичного доступа к файлу. */
  generateShareLink: async (id: string): Promise<{ token: string }> => {
    const response = await apiClient.post(`/files/${id}/generate-link/`);
    return response.data;
  },

  /** Отзыв (удаление) токена публичного доступа. */
  revokeShareLink: async (id: string): Promise<{ token: string }> => {
    const response = await apiClient.post(`/files/${id}/revoke-link/`);
    return response.data;
  },

  /** Получение списка файлов с фильтрацией по пользователю, поиском и пагинацией. */
  getFiles: async (
    userId?: string,
    page?: number,
    ordering?: string,
    search?: string,
    options?: AxiosRequestConfig,
  ): Promise<FileListResponse> => {
    const params = {
      user_id: userId || undefined,
      page: page || undefined,
      o: ordering || undefined,
      q: search || undefined,
    };
    const response = await apiClient.get<FileListResponse>('/files/', {
      ...options,
      params,
    });
    return response.data;
  },

  /** Обновление метаданных файла (имя, комментарий). */
  updateFile: async (id: string, data: Partial<FileItem>): Promise<FileItem> => {
    const response = await apiClient.patch<FileItem>(`/files/${id}/`, data);
    return response.data;
  },

  /** Удаление файла из хранилища и базы данных. */
  deleteFile: async (id: string): Promise<void> => {
    await apiClient.delete(`/files/${id}/`);
  },
};

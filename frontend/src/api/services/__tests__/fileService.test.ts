import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { AxiosRequestConfig, AxiosProgressEvent } from 'axios';

import apiClient from '../../apiClient';
import { fileService } from '../fileService';
import {
  mockFile,
  mockFileListResponse,
  mockFileObj,
} from '../../../store/slices/__tests__/storage/storage.fixtures';

vi.mock('../../apiClient', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

/**
 * Тестирование сервиса управления файлами.
 * Проверка формирования FormData, обработки Blob-данных и взаимодействия с браузерным API (URL, DOM).
 */
describe('fileService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Используем встроенный метод Vitest для мокирования глобальных объектов
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn(() => 'blob:url'),
      revokeObjectURL: vi.fn(),
    });
  });

  afterEach(() => {
    document.body.innerHTML = '';
    vi.unstubAllGlobals();
  });

  /** Проверка загрузки файла с FormData и колбэком прогресса */
  describe('uploadFile', () => {
    it('should correctly format FormData and calculate upload progress', async () => {
      const onProgress = vi.fn();
      vi.mocked(apiClient.post).mockResolvedValue({ data: mockFileObj });
      await fileService.uploadFile(mockFileObj, 'my comment', onProgress, 'user-777');
      const [url, formData, config] = vi.mocked(apiClient.post).mock.calls[0] as [
        string,
        FormData,
        AxiosRequestConfig,
      ];
      expect(url).toBe('/files/');
      expect(formData).toBeInstanceOf(FormData);
      expect(formData.get('file')).toBeDefined();
      expect(formData.get('comment')).toBe('my comment');
      expect(formData.get('user_id')).toBe('user-777');
      expect(config.onUploadProgress).toBeInstanceOf(Function);
      config.onUploadProgress!({
        loaded: 50,
        total: 100,
        bytes: 50,
        lengthComputable: true,
      } as AxiosProgressEvent);
      expect(onProgress).toHaveBeenCalledWith(50);
    });

    it('should handle upload without optional params (Branch: false paths)', async () => {
      vi.mocked(apiClient.post).mockResolvedValue({ data: mockFileObj });
      await fileService.uploadFile(mockFileObj);
      const [, formData, config] = vi.mocked(apiClient.post).mock.calls[0] as [
        string,
        FormData,
        AxiosRequestConfig,
      ];
      expect(formData.get('comment')).toBeNull();
      expect(formData.get('user_id')).toBeNull();
      expect(config.onUploadProgress).toBeInstanceOf(Function);
      expect(() =>
        config.onUploadProgress!({ loaded: 10, total: 100 } as AxiosProgressEvent),
      ).not.toThrow();
    });
  });

  /** Проверка логики скачивания: создание ссылки, клик и удаление */
  describe('downloadFile', () => {
    const fileId = 'file-333';
    const fileName = 'test.txt';
    const mockBlob = new Blob(['content'], { type: 'text/plain' });

    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      document.body.innerHTML = '';
      vi.useRealTimers();
    });

    it('should calculate download progress and revoke object URL after timeout', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({ data: mockBlob });
      const onProgress = vi.fn();
      await fileService.downloadFile(fileId, fileName, onProgress);
      const [, config] = vi.mocked(apiClient.get).mock.calls[0] as [string, AxiosRequestConfig];
      expect(config.onDownloadProgress).toBeInstanceOf(Function);
      config.onDownloadProgress!({
        loaded: 30,
        total: 100,
        bytes: 30,
        lengthComputable: true,
      } as AxiosProgressEvent);
      expect(onProgress).toHaveBeenCalledWith(30);
      expect(window.URL.revokeObjectURL).not.toHaveBeenCalled();
      vi.advanceTimersByTime(1000);
      expect(window.URL.revokeObjectURL).toHaveBeenCalledWith('blob:url');
    });

    it('should not throw if onDownloadProgress is called without onProgress callback', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({ data: mockBlob });
      await fileService.downloadFile(fileId, fileName);
      const [, config] = vi.mocked(apiClient.get).mock.calls[0] as [string, AxiosRequestConfig];
      expect(config.onDownloadProgress).toBeInstanceOf(Function);
      expect(() =>
        config.onDownloadProgress!({ loaded: 50, total: 100 } as AxiosProgressEvent),
      ).not.toThrow();
    });
  });

  /** Тестирование генерации превью с отслеживанием прогресса и определением MIME-типа */
  describe('getPreview', () => {
    const fileId = 'preview-123';
    const mockBlobData = new Blob(['preview content']);

    it('should calculate progress and use content-type from headers', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: mockBlobData,
        headers: { 'content-type': 'image/png' },
      });
      const onProgress = vi.fn();
      const result = await fileService.getPreview(fileId, onProgress);
      const [, config] = vi.mocked(apiClient.get).mock.calls[0] as [string, AxiosRequestConfig];
      expect(config.onDownloadProgress).toBeInstanceOf(Function);
      config.onDownloadProgress!({
        loaded: 75,
        total: 100,
        bytes: 75,
        lengthComputable: true,
      } as AxiosProgressEvent);
      expect(onProgress).toHaveBeenCalledWith(75);
      expect(result).toBe('blob:url');
      expect(apiClient.get).toHaveBeenCalledWith(
        `/files/${fileId}/download/`,
        expect.objectContaining({ responseType: 'blob' }),
      );
    });

    it('should calculate progress and cap it at 100%', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({ data: new Blob(['']), headers: {} });
      const onProgress = vi.fn();
      await fileService.getPreview('123', onProgress);
      const [, config] = vi.mocked(apiClient.get).mock.calls[0] as [string, AxiosRequestConfig];
      expect(config.onDownloadProgress).toBeInstanceOf(Function);
      config.onDownloadProgress!({ loaded: 50, total: 100 } as AxiosProgressEvent);
      expect(onProgress).toHaveBeenCalledWith(50);
      config.onDownloadProgress!({ loaded: 150, total: 100 } as AxiosProgressEvent);
      expect(onProgress).toHaveBeenLastCalledWith(100);
    });

    it('should ignore progress if total size is missing', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({ data: new Blob(['']), headers: {} });
      const onProgress = vi.fn();
      await fileService.getPreview('123', onProgress);
      const [, config] = vi.mocked(apiClient.get).mock.calls[0] as [string, AxiosRequestConfig];
      expect(config.onDownloadProgress).toBeInstanceOf(Function);
      config.onDownloadProgress!({ loaded: 50, total: 0 } as AxiosProgressEvent);
      expect(onProgress).not.toHaveBeenCalled();
    });

    it('should handle call without onProgress callback', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({ data: new Blob(['']), headers: {} });
      await fileService.getPreview('123');
      const [, config] = vi.mocked(apiClient.get).mock.calls[0] as [string, AxiosRequestConfig];
      expect(config.onDownloadProgress).toBeInstanceOf(Function);
      expect(() =>
        config.onDownloadProgress!({ loaded: 50, total: 100 } as AxiosProgressEvent),
      ).not.toThrow();
    });

    it('should fallback to application/pdf if content-type header is missing', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: mockBlobData,
        headers: {},
      });
      const blobSpy = vi.spyOn(window, 'Blob');
      await fileService.getPreview(fileId);
      expect(blobSpy).toHaveBeenCalledWith(
        [mockBlobData],
        expect.objectContaining({ type: 'application/pdf' }),
      );
      blobSpy.mockRestore();
    });
  });

  /** Тестирование получения списка файлов с поддержкой фильтрации, поиска и пагинации */
  describe('getFiles', () => {
    it('should call GET /files/ with all provided query parameters', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({ data: mockFileListResponse });
      const result = await fileService.getFiles('user-1', 5, '-size', 'my-search');
      expect(apiClient.get).toHaveBeenCalledWith(
        '/files/',
        expect.objectContaining({
          params: {
            user_id: 'user-1',
            page: 5,
            o: '-size',
            q: 'my-search',
          },
        }),
      );
      expect(result).toEqual(mockFileListResponse);
    });

    it('should fallback to undefined for empty or missing arguments', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({ data: mockFileListResponse });
      await fileService.getFiles('', 0, '', '');
      expect(apiClient.get).toHaveBeenCalledWith(
        '/files/',
        expect.objectContaining({
          params: {
            user_id: undefined,
            page: undefined,
            o: undefined,
            q: undefined,
          },
        }),
      );
    });
  });

  /** Тестирование вспомогательных CRUD-операций и управления публичным доступом */
  describe('Utility methods', () => {
    const fileId = 'file-555';

    it('generateShareLink should call correct endpoint', async () => {
      vi.mocked(apiClient.post).mockResolvedValue({ data: { token: 'tok' } });
      await fileService.generateShareLink(fileId);
      expect(apiClient.post).toHaveBeenCalledWith(`/files/${fileId}/generate-link/`);
    });

    it('revokeShareLink should call correct endpoint', async () => {
      vi.mocked(apiClient.post).mockResolvedValue({});
      await fileService.revokeShareLink(fileId);
      expect(apiClient.post).toHaveBeenCalledWith(`/files/${fileId}/revoke-link/`);
    });

    it('updateFile should call PATCH with data', async () => {
      vi.mocked(apiClient.patch).mockResolvedValue({ data: mockFile });
      const updateData = { comment: 'new' };
      await fileService.updateFile(fileId, updateData);
      expect(apiClient.patch).toHaveBeenCalledWith(`/files/${fileId}/`, updateData);
    });

    it('deleteFile should call DELETE', async () => {
      vi.mocked(apiClient.delete).mockResolvedValue({});
      await fileService.deleteFile(fileId);
      expect(apiClient.delete).toHaveBeenCalledWith(`/files/${fileId}/`);
    });
  });
});

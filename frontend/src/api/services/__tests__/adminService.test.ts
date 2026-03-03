import { describe, it, expect, vi, beforeEach } from 'vitest';

import apiClient from '../../apiClient';
import { adminService } from '../adminService';
import { mockUser } from '../../../store/slices/__tests__/fixtures';
import { mockUserListResponse } from '../../../store/slices/__tests__/admin/admin.fixtures';

vi.mock('../../apiClient', () => ({
  default: {
    get: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

/**
 * Тестирование сервиса администрирования.
 * Проверка корректности формирования HTTP-запросов (URL, методы, параметры) к API управления пользователями.
 */
describe('adminService', () => {
  const mockResponse = { data: mockUserListResponse };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  /** Проверка получения списка пользователей с фильтрацией и пагинацией */
  describe('getUsers', () => {
    it('should call GET /users/ with provided query parameters', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);
      const result = await adminService.getUsers(2, '-date_joined', 'test-query');
      expect(apiClient.get).toHaveBeenCalledWith(
        '/users/',
        expect.objectContaining({
          params: { page: 2, o: '-date_joined', q: 'test-query' },
        }),
      );
      expect(result).toEqual(mockResponse.data);
    });

    it('getUsers should call GET with undefined params when no arguments provided', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);
      const result = await adminService.getUsers();
      expect(apiClient.get).toHaveBeenCalledWith(
        '/users/',
        expect.objectContaining({
          params: { page: undefined, o: undefined, q: undefined },
        }),
      );
      expect(result).toEqual(mockResponse.data);
    });
  });

  // /** Проверка обновления данных конкретной учетной записи */
  describe('updateUser', () => {
    it('should call PATCH with target URL and update data', async () => {
      const userId = mockUser.id;
      const updateData = { is_staff: true };
      const mockResponseData = { ...mockUser, ...updateData };
      vi.mocked(apiClient.patch).mockResolvedValue({ data: mockResponseData });
      const result = await adminService.updateUser(userId, updateData);
      expect(apiClient.patch).toHaveBeenCalledWith(`/users/${userId}/`, updateData);
      expect(result).toEqual(mockResponseData);
    });
  });

  // /** Проверка удаления пользователя из системы */
  describe('deleteUser', () => {
    it('should call DELETE with correct endpoint URL', async () => {
      const userId = 'user-999';
      vi.mocked(apiClient.delete).mockResolvedValue({ status: 204 });
      await adminService.deleteUser(userId);
      expect(apiClient.delete).toHaveBeenCalledWith(`/users/${userId}/`);
    });
  });
});

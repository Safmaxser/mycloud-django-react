import { beforeEach, describe, expect, it, vi } from 'vitest';

import apiClient from '../../apiClient';
import { authService } from '../authService';
import { mockUser } from '../../../store/slices/__tests__/fixtures';

// Имитируем поведение axios клиента
vi.mock('../../apiClient', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

/**
 * Тестирование сервиса аутентификации и управления профилем.
 * Проверка корректности формирования запросов (URL, методы, body) для сессий пользователей.
 */
describe('authService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /** Проверка регистрации нового пользователя */
  describe('register', () => {
    it('should call POST /users/ with registration data', async () => {
      const registerData = { username: 'new', email: 'n@m.com', password: '123' };
      vi.mocked(apiClient.post).mockResolvedValue({ data: mockUser });
      const result = await authService.register(registerData);
      expect(apiClient.post).toHaveBeenCalledWith('/users/', registerData, undefined);
      expect(result).toEqual(mockUser);
    });
  });

  /** Проверка входа в систему */
  describe('login', () => {
    it('should call POST /auth/login/ and return tokens with user data', async () => {
      const mockLoginResponse = { user: mockUser, detail: 'Success response' };
      const credentials = { username: 'test', password: '123' };
      vi.mocked(apiClient.post).mockResolvedValue({ data: mockLoginResponse });
      const result = await authService.login(credentials);
      expect(apiClient.post).toHaveBeenCalledWith('/auth/login/', credentials, undefined);
      expect(result).toEqual(mockLoginResponse);
    });
  });

  /** Проверка выхода из системы */
  describe('logout', () => {
    it('should call POST /auth/logout/ to terminate session', async () => {
      const mockDetail = { detail: 'Logged out' };
      vi.mocked(apiClient.post).mockResolvedValue({ data: mockDetail });
      const result = await authService.logout();
      expect(apiClient.post).toHaveBeenCalledWith('/auth/logout/');
      expect(result).toEqual(mockDetail);
    });
  });

  /** Проверка получения данных текущего профиля */
  describe('getMe', () => {
    it('should call GET /users/me/ to fetch current profile', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({ data: mockUser });
      const result = await authService.getMe();
      expect(apiClient.get).toHaveBeenCalledWith('/users/me/', undefined);
      expect(result).toEqual(mockUser);
    });
  });

  /** Проверка обновления профиля (PATCH) */
  describe('updateMe', () => {
    it('should call PATCH /users/me/ with updated fields', async () => {
      const updateData = { full_name: 'Updated Name' };
      const updatedUser = { ...mockUser, ...updateData };
      vi.mocked(apiClient.patch).mockResolvedValue({ data: updatedUser });
      const result = await authService.updateMe(updateData);
      expect(apiClient.patch).toHaveBeenCalledWith('/users/me/', updateData, undefined);
      expect(result.full_name).toBe('Updated Name');
    });
  });

  /** Проверка удаления собственного аккаунта */
  describe('deleteMe', () => {
    it('should call DELETE /users/me/ to remove account', async () => {
      vi.mocked(apiClient.delete).mockResolvedValue({ status: 204 });
      await authService.deleteMe();
      expect(apiClient.delete).toHaveBeenCalledWith('/users/me/');
    });
  });
});

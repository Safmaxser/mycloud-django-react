import { describe, expect, it } from 'vitest';

import authReducer, { authSlice } from '../../authSlice';
import { mockUser, mockAdmin } from '../fixtures';
import { createDirtyState } from './auth.fixtures';

/**
 * Тесты механизмов синхронизации данных профиля в реальном времени.
 * Проверка WebSocket-обработчиков для поддержания актуальности сессии.
 */
describe('authSlice - WebSockets', () => {
  /** Группа тестов для метода синхронизации текущего пользователя */
  describe('syncCurrentUser', () => {
    it('should update session data if ID matches current user', () => {
      const stateWithUser = createDirtyState();
      const updatedData = { ...mockUser, full_name: 'New Name' };
      const action = authSlice.actions.syncCurrentUser(updatedData);
      const state = authReducer(stateWithUser, action);
      expect(state.user?.full_name).toBe('New Name');
    });

    /** Проверка защиты: игнорируем обновление, если ID не совпадает (чужое событие) */
    it('should ignore update if ID does not match current user', () => {
      const stateWithUser = createDirtyState();
      const action = authSlice.actions.syncCurrentUser(mockAdmin);
      const state = authReducer(stateWithUser, action);
      expect(state.user?.id).toBe(mockUser.id);
      expect(state.user?.id).not.toBe(mockAdmin.id);
    });
  });
});

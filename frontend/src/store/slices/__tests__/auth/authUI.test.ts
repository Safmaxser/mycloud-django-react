import { describe, expect, it } from 'vitest';

import { unauthorizedError } from '../../../actions';
import authReducer, { authSlice } from '../../authSlice';
import { createDirtyState, initialState } from './auth.fixtures';

/**
 * Тесты синхронной логики управления состоянием авторизации.
 * Проверка механизмов сброса сессии, очистки ошибок валидации и глобальных триггеров.
 */
describe('authSlice - UI & State', () => {
  /** Блок тестирования очистки данных и возврата к начальному состоянию */
  describe('initial state & resets', () => {
    it('should reset to initialState via resetState', () => {
      const dirtyState = createDirtyState({
        isInitializing: true,
        isSubmitting: true,
        isUpdating: true,
        error: 'Auth failed',
      });
      const action = authSlice.actions.resetState();
      const state = authReducer(dirtyState, action);
      expect(state).toEqual(initialState);
    });

    it('should clear only auth errors while keeping other flags via clearAuthError', () => {
      const dirtyState = createDirtyState({
        isInitializing: true,
        isSubmitting: true,
        isUpdating: true,
        error: 'Invalid credentials',
      });
      const action = authSlice.actions.clearAuthError();
      const state = authReducer(dirtyState, action);
      expect(state).toEqual({ ...dirtyState, error: null });
    });
  });

  /** Тестирование реакции слайса на системные события (Cross-slice actions) */
  describe('extraReducers (global resets)', () => {
    it('should reset auth state to initial on unauthorizedError', () => {
      const dirtyState = createDirtyState({
        isInitializing: true,
        isSubmitting: true,
        isUpdating: true,
        error: 'Expired token',
      });
      const state = authReducer(dirtyState, { type: unauthorizedError.type });
      expect(state).toEqual(initialState);
    });
  });
});

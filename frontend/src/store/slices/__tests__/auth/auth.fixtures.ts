import type { AuthState } from '../../authSlice';
import { mockUser } from '../fixtures';

/** Начальное состояние аутентификации (эталон для сброса сессии) */
export const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isInitializing: false,
  isSubmitting: false,
  isUpdating: false,
  error: null,
};

/**
 * Фабрика для создания "грязного" состояния авторизации.
 * Используется для тестирования переходов между состояниями и сброса данных.
 */
export const createDirtyState = (overrides: Partial<AuthState> = {}): AuthState => ({
  ...initialState,
  user: mockUser,
  isAuthenticated: true,
  ...overrides,
});

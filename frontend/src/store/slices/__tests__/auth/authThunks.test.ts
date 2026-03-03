import { describe, it, expect, vi, beforeEach } from 'vitest';

import { authService } from '../../../../api/services/authService';
import authReducer, { authSlice } from '../../authSlice';
import type { User } from '../../../../types/user';
import { mockUser } from '../fixtures';
import { createDirtyState, initialState } from './auth.fixtures';

vi.mock('../../../../api/services/authService');

/**
 * Тестирование асинхронных операций (Thunks) управления авторизацией.
 * Проверка жизненного цикла сессии, аутентификации и профиля пользователя.
 */
describe('authSlice - Async Thunks', () => {
  const dispatch = vi.fn();
  const getState = () => ({ auth: initialState });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  /** Тестирование процесса создания новой учетной записи пользователя */
  describe('registerUser', () => {
    /** Проверка управления флагами отправки формы и обновления профиля в стейте */
    describe('lifecycle (reducers)', () => {
      it('should set isSubmitting: true and clear error on pending', () => {
        const stateWithError = { ...initialState, error: 'Old error' };
        const action = { type: authSlice.actions.registerUser.pending.type };
        const state = authReducer(stateWithError, action);
        expect(state.isSubmitting).toBe(true);
        expect(state.error).toBeNull();
      });

      it('should save user data and set isAuthenticated: true on fulfilled', () => {
        const stateWith = { ...initialState, isSubmitting: true };
        const action = { type: authSlice.actions.registerUser.fulfilled.type, payload: mockUser };
        const state = authReducer(stateWith, action);
        expect(state.isSubmitting).toBe(false);
      });

      it('should save error message and reset isSubmitting on rejected', () => {
        const errorMessage = 'Server error 500';
        const stateWith = { ...initialState, isSubmitting: true };
        const action = {
          type: authSlice.actions.registerUser.rejected.type,
          payload: errorMessage,
        };
        const state = authReducer(stateWith, action);
        expect(state.isSubmitting).toBe(false);
        expect(state.error).toBe(errorMessage);
      });

      it('should set error to null if payload is missing on rejected', () => {
        const stateWith = { ...initialState, isSubmitting: true, error: 'Old error' };
        const action = {
          type: authSlice.actions.registerUser.rejected.type,
          payload: undefined,
        };
        const state = authReducer(stateWith, action);
        expect(state.isSubmitting).toBe(false);
        expect(state.error).toBeNull();
      });
    });

    /** Проверка корректности передачи данных формы в API-сервис регистрации */
    describe('execution (thunk logic)', () => {
      const registerData = {
        username: 'newuser',
        email: 'new@example.com',
        password: 'password123',
      };

      it('should call authService.register with form data and handle success', async () => {
        vi.mocked(authService.register).mockResolvedValue(mockUser);
        const thunk = authSlice.actions.registerUser(registerData);
        const result = await thunk(dispatch, getState, undefined);
        expect(authService.register).toHaveBeenCalledWith(registerData, expect.any(Object));
        expect(result.payload).toEqual(mockUser);
      });

      it('should handle registration errors via rejectWithValue', async () => {
        vi.mocked(authService.register).mockRejectedValue(new Error('Validation failed'));
        const thunk = authSlice.actions.registerUser(registerData);
        await thunk(dispatch, getState, undefined);
        const rejectedCall = dispatch.mock.calls.find(
          (call) => call[0].type === authSlice.actions.registerUser.rejected.type,
        );
        expect(rejectedCall).toBeDefined();
      });
    });
  });

  /** Тестирование процесса аутентификации пользователя в системе */
  describe('loginUser', () => {
    const mockLoginResponse = { user: mockUser, detail: 'Success response' };

    /** Проверка управления флагами отправки формы и обновления сессии в стейте */
    describe('lifecycle (reducers)', () => {
      it('should set isSubmitting: true and clear previous error on pending', () => {
        const stateWithError = { ...initialState, error: 'Old error' };
        const action = { type: authSlice.actions.loginUser.pending.type };
        const state = authReducer(stateWithError, action);
        expect(state.isSubmitting).toBe(true);
        expect(state.error).toBeNull();
      });

      it('should save user data and set isAuthenticated: true on fulfilled', () => {
        const stateWith = { ...initialState, isSubmitting: true };
        const action = {
          type: authSlice.actions.loginUser.fulfilled.type,
          payload: mockLoginResponse,
        };
        const state = authReducer(stateWith, action);
        expect(state.isSubmitting).toBe(false);
        expect(state.user).toEqual(mockUser);
        expect(state.isAuthenticated).toBe(true);
      });

      it('should save error message and reset isSubmitting on rejected', () => {
        const errorMessage = 'Invalid credentials';
        const stateWith = { ...initialState, isSubmitting: true };
        const action = {
          type: authSlice.actions.loginUser.rejected.type,
          payload: errorMessage,
        };
        const state = authReducer(stateWith, action);
        expect(state.isSubmitting).toBe(false);
        expect(state.error).toBe(errorMessage);
      });

      it('should set error to null if payload is missing on rejected', () => {
        const stateWith = { ...initialState, isSubmitting: true, error: 'Old error' };
        const action = {
          type: authSlice.actions.loginUser.rejected.type,
          payload: undefined,
        };
        const state = authReducer(stateWith, action);
        expect(state.isSubmitting).toBe(false);
        expect(state.error).toBeNull();
      });
    });

    /** Проверка корректности передачи учетных данных в API-сервис авторизации */
    describe('execution (thunk logic)', () => {
      const loginData = { username: 'myuser', password: 'password123' };

      it('should call authService.login and handle success', async () => {
        vi.mocked(authService.login).mockResolvedValue(mockLoginResponse);
        const thunk = authSlice.actions.loginUser(loginData);
        const result = await thunk(dispatch, getState, undefined);
        expect(authService.login).toHaveBeenCalledWith(loginData, expect.any(Object));
        expect(result.payload).toEqual(mockLoginResponse);
      });

      it('should handle registration errors via rejectWithValue', async () => {
        vi.mocked(authService.login).mockRejectedValue(new Error('Validation failed'));
        const thunk = authSlice.actions.loginUser(loginData);
        await thunk(dispatch, getState, undefined);
        const rejectedCall = dispatch.mock.calls.find(
          (call) => call[0].type === authSlice.actions.loginUser.rejected.type,
        );
        expect(rejectedCall).toBeDefined();
      });
    });
  });

  /** Тестирование процесса завершения сессии пользователя */
  describe('logoutUser', () => {
    /** Проверка полной очистки состояния авторизации и сброса к начальным значениям */
    describe('lifecycle (reducers)', () => {
      it('should reset auth state to initial on fulfilled', () => {
        const dirtyState = createDirtyState({
          isInitializing: true,
          isSubmitting: true,
          isUpdating: true,
          error: 'Old error',
        });
        const action = { type: authSlice.actions.logoutUser.fulfilled.type };
        const state = authReducer(dirtyState, action);
        expect(state).toEqual(initialState);
      });
    });

    /** Проверка вызова API-сервиса деавторизации и обработки исключений */
    describe('execution (thunk logic)', () => {
      const mockLogoutResponse = { detail: 'Successfully logged out' };

      it('should call authService.logout and handle success', async () => {
        vi.mocked(authService.logout).mockResolvedValue(mockLogoutResponse);
        const thunk = authSlice.actions.logoutUser();
        await thunk(dispatch, getState, undefined);
        expect(authService.logout).toHaveBeenCalled();
        const fulfilledCall = dispatch.mock.calls.find(
          (call) => call[0].type === authSlice.actions.logoutUser.fulfilled.type,
        );
        expect(fulfilledCall).toBeDefined();
      });

      it('should handle logout errors via rejectWithValue', async () => {
        vi.mocked(authService.logout).mockRejectedValue(new Error('Logout failed'));
        const thunk = authSlice.actions.logoutUser();
        await thunk(dispatch, getState, undefined);
        const rejectedCall = dispatch.mock.calls.find(
          (call) => call[0].type === authSlice.actions.logoutUser.rejected.type,
        );
        expect(rejectedCall).toBeDefined();
      });
    });
  });

  /** Тестирование фоновой проверки и получения данных текущего профиля */
  describe('fetchMe', () => {
    /** Проверка состояния флагов инициализации и аутентификации */
    describe('lifecycle (reducers)', () => {
      it('should set isInitializing: true on pending', () => {
        const stateWith = createDirtyState();
        const action = { type: authSlice.actions.fetchMe.pending.type };
        const state = authReducer(stateWith, action);
        expect(state.isInitializing).toBe(true);
      });

      it('should save user profile and set isAuthenticated: true on fulfilled', () => {
        const stateWith = { ...initialState, isInitializing: true };
        const action = { type: authSlice.actions.fetchMe.fulfilled.type, payload: mockUser };
        const state = authReducer(stateWith, action);
        expect(state.isInitializing).toBe(false);
        expect(state.user).toEqual(mockUser);
        expect(state.isAuthenticated).toBe(true);
      });

      it('should clear user data and set isAuthenticated: false on rejected', () => {
        const stateWith = createDirtyState({ isInitializing: true });
        const action = { type: authSlice.actions.fetchMe.rejected.type };
        const state = authReducer(stateWith, action);
        expect(state.isInitializing).toBe(false);
        expect(state.user).toBeNull();
        expect(state.isAuthenticated).toBe(false);
      });
    });

    /** Проверка корректности вызова API-сервиса авторизации */
    describe('execution (thunk logic)', () => {
      it('should call getMe and handle successful profile loading', async () => {
        vi.mocked(authService.getMe).mockResolvedValue(mockUser);
        const thunk = authSlice.actions.fetchMe();
        const result = await thunk(dispatch, getState, undefined);
        expect(authService.getMe).toHaveBeenCalledWith(expect.any(Object));
        expect(result.payload).toEqual(mockUser);
      });

      it('should handle API errors via rejectWithValue', async () => {
        vi.mocked(authService.getMe).mockRejectedValue(new Error('Unauthorized'));
        const thunk = authSlice.actions.fetchMe();
        await thunk(dispatch, getState, undefined);
        const rejectedCall = dispatch.mock.calls.find(
          (call) => call[0].type === authSlice.actions.fetchMe.rejected.type,
        );
        expect(rejectedCall).toBeDefined();
      });
    });
  });

  /** Тестирование процесса обновления данных профиля текущего пользователя */
  describe('updateMe', () => {
    const updateData = { full_name: 'New Name', email: 'new@m.com' };

    /** Проверка управления состоянием обновления и синхронизации профиля в стейте */
    describe('lifecycle (reducers)', () => {
      it('should set isUpdating: true on pending', () => {
        const stateWith = createDirtyState({ isUpdating: false });
        const action = { type: authSlice.actions.updateMe.pending.type };
        const state = authReducer(stateWith, action);
        expect(state.isUpdating).toBe(true);
      });

      it('should save updated user and reset isUpdating on fulfilled', () => {
        const stateWith = { ...initialState, isUpdating: true };
        const updatedUser = { ...mockUser, ...updateData };
        const action = { type: authSlice.actions.updateMe.fulfilled.type, payload: updatedUser };
        const state = authReducer(stateWith, action);
        expect(state.isUpdating).toBe(false);
        expect(state.user).toEqual(updatedUser);
      });

      it('should reset isUpdating on rejected', () => {
        const stateWith = { ...initialState, isUpdating: true };
        const action = { type: authSlice.actions.updateMe.rejected.type };
        const state = authReducer(stateWith, action);
        expect(state.isUpdating).toBe(false);
      });
    });

    /** Проверка корректности передачи параметров в API и обработки ответов сервера */
    describe('execution (thunk logic)', () => {
      it('should clean userData by removing empty strings, nulls, and is_staff flag', async () => {
        const dirtyData = {
          full_name: 'Updated Name',
          email: '',
          username: null,
          is_staff: true,
        } as unknown as Partial<User>;
        vi.mocked(authService.updateMe).mockResolvedValue({
          ...mockUser,
          full_name: 'Updated Name',
        });
        const thunk = authSlice.actions.updateMe(dirtyData);
        await thunk(dispatch, getState, undefined);
        expect(authService.updateMe).toHaveBeenCalledWith(
          { full_name: 'Updated Name' },
          expect.any(Object),
        );
      });

      it('should handle profile update errors via rejectWithValue', async () => {
        vi.mocked(authService.updateMe).mockRejectedValue(new Error('Update failed'));
        const thunk = authSlice.actions.updateMe(updateData);
        await thunk(dispatch, getState, undefined);
        const rejectedCall = dispatch.mock.calls.find(
          (call) => call[0].type === authSlice.actions.updateMe.rejected.type,
        );
        expect(rejectedCall).toBeDefined();
      });
    });
  });

  /** Тестирование процесса окончательного удаления учетной записи текущего пользователя */
  describe('deleteMe', () => {
    /** Проверка сброса состояния сессии к начальному значению и очистки данных профиля */
    describe('lifecycle (reducers)', () => {
      it('should set isUpdating: true on pending', () => {
        const stateWith = createDirtyState({ isUpdating: false });
        const action = { type: authSlice.actions.deleteMe.pending.type };
        const state = authReducer(stateWith, action);
        expect(state.isUpdating).toBe(true);
      });

      it('should reset auth state to initial on fulfilled', () => {
        const dirtyState = createDirtyState({
          isInitializing: true,
          isSubmitting: true,
          isUpdating: true,
          error: 'Some error',
        });
        const action = { type: authSlice.actions.deleteMe.fulfilled.type };
        const state = authReducer(dirtyState, action);
        expect(state).toEqual(initialState);
      });

      it('should reset isUpdating on rejected', () => {
        const stateWith = { ...initialState, isUpdating: true };
        const action = { type: authSlice.actions.deleteMe.rejected.type };
        const state = authReducer(stateWith, action);
        expect(state.isUpdating).toBe(false);
      });
    });

    /** Проверка взаимодействия с API-сервисом деавторизации и обработки исключений */
    describe('execution (thunk logic)', () => {
      it('should call authService.deleteMe and handle success', async () => {
        vi.mocked(authService.deleteMe).mockResolvedValue(undefined);
        const thunk = authSlice.actions.deleteMe();
        await thunk(dispatch, getState, undefined);
        expect(authService.deleteMe).toHaveBeenCalled();
        const fulfilledCall = dispatch.mock.calls.find(
          (call) => call[0].type === authSlice.actions.deleteMe.fulfilled.type,
        );
        expect(fulfilledCall).toBeDefined();
      });

      it('should handle deletion errors via rejectWithValue', async () => {
        vi.mocked(authService.deleteMe).mockRejectedValue(new Error('Delete failed'));
        const thunk = authSlice.actions.deleteMe();
        await thunk(dispatch, getState, undefined);
        const rejectedCall = dispatch.mock.calls.find(
          (call) => call[0].type === authSlice.actions.deleteMe.rejected.type,
        );
        expect(rejectedCall).toBeDefined();
      });
    });
  });
});

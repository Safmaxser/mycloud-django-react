import { describe, it, expect, vi, beforeEach } from 'vitest';

import { adminService } from '../../../../api/services/adminService';
import adminReducer, { adminSlice } from '../../adminSlice';
import type { User } from '../../../../types/user';
import { mockUser } from '../fixtures';
import { createDirtyState, initialState, mockUserListResponse } from './admin.fixtures';

vi.mock('../../../../api/services/adminService');

/**
 * Тестирование асинхронных операций (Thunks) панели администратора.
 * Проверка жизненного цикла запросов к API и логики управления пользователями.
 */
describe('adminSlice - Async Thunks', () => {
  const dispatch = vi.fn();
  const getState = () => ({ admin: initialState });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  /** Тестирование получения списка пользователей с поддержкой пагинации, поиска и сортировки */
  describe('fetchUsers', () => {
    /** Проверка корректности обновления состояния панели администратора на всех этапах запроса */
    describe('lifecycle (reducers)', () => {
      it('should set loading: true and clear previous error on pending', () => {
        const stateWithError = createDirtyState({ error: 'Old error' });
        const action = { type: adminSlice.actions.fetchUsers.pending.type };
        const state = adminReducer(stateWithError, action);
        expect(state.loading).toBe(true);
        expect(state.error).toBeNull();
      });

      it('should save users list and totalCount on fulfilled', () => {
        const action = {
          type: adminSlice.actions.fetchUsers.fulfilled.type,
          payload: mockUserListResponse,
        };
        const state = adminReducer(initialState, action);
        expect(state.loading).toBe(false);
        expect(state.users).toEqual(mockUserListResponse.results);
        expect(state.totalCount).toBe(mockUserListResponse.count);
      });

      it('should fallback to default values if payload fields are missing on fulfilled', () => {
        const action = {
          type: adminSlice.actions.fetchUsers.fulfilled.type,
          payload: { results: undefined, count: undefined },
        };
        const state = adminReducer(initialState, action);
        expect(state.loading).toBe(false);
        expect(state.users).toEqual([]);
        expect(state.totalCount).toBe(0);
      });

      it('should save error message from payload on rejected', () => {
        const errorMessage = 'Server error 500';
        const stateWithLoading = { ...initialState, loading: true };
        const action = {
          type: adminSlice.actions.fetchUsers.rejected.type,
          payload: errorMessage,
        };
        const state = adminReducer(stateWithLoading, action);
        expect(state.loading).toBe(false);
        expect(state.error).toBe(errorMessage);
      });

      it('should set error to null if payload is missing on rejected', () => {
        const stateWith = { ...initialState, loading: true, error: 'Old error' };
        const action = {
          type: adminSlice.actions.fetchUsers.rejected.type,
          payload: undefined,
        };
        const state = adminReducer(stateWith, action);
        expect(state.loading).toBe(false);
        expect(state.error).toBeNull();
      });
    });

    /** Проверка логики формирования запроса на основе текущих фильтров в стейте */
    describe('execution (thunk logic)', () => {
      it('should call getUsers with current state params and handle success', async () => {
        const customState = createDirtyState({
          page: 2,
          search: 'report',
          ordering: '-email',
        });
        const customGetState = () => ({ admin: customState });
        vi.mocked(adminService.getUsers).mockResolvedValue(mockUserListResponse);
        const thunk = adminSlice.actions.fetchUsers();
        const result = await thunk(dispatch, customGetState, undefined);
        expect(adminService.getUsers).toHaveBeenCalledWith(
          2,
          '-email',
          'report',
          expect.any(Object),
        );
        expect(result.payload).toEqual(mockUserListResponse);
      });

      it('should handle API errors via rejectWithValue', async () => {
        vi.mocked(adminService.getUsers).mockRejectedValue(new Error('API Error'));
        const thunk = adminSlice.actions.fetchUsers();
        await thunk(dispatch, getState, undefined);
        const rejectedCall = dispatch.mock.calls.find(
          (call) => call[0].type === adminSlice.actions.fetchUsers.rejected.type,
        );
        expect(rejectedCall).toBeDefined();
      });
    });
  });

  /** Тестирование редактирования данных пользователя (логин, email и др.) */
  describe('updateUser', () => {
    const userId = 'user-to-update';
    const updateDataUser = {
      username: 'updated-login',
      email: 'new@m.com',
    };
    const updatePayload = {
      id: userId,
      userData: updateDataUser,
    };

    /** Проверка корректности обновления объекта пользователя в общем списке (Data Integrity) */
    describe('lifecycle (reducers)', () => {
      it('should update user details in the list on fulfilled', () => {
        const stateWithUser = {
          ...initialState,
          users: [{ ...mockUser, id: userId, username: 'old-login', email: 'o@o.us' }],
        };
        const action = {
          type: adminSlice.actions.updateUser.fulfilled.type,
          payload: { ...mockUser, ...updateDataUser, id: userId },
        };
        const state = adminReducer(stateWithUser, action);
        const updatedUser = state.users.find((u) => u.id === userId);
        expect(updatedUser?.username).toBe('updated-login');
        expect(updatedUser?.email).toBe('new@m.com');
      });
    });

    /** Проверка корректности передачи параметров в API и обработки ответов сервера */
    describe('execution (thunk logic)', () => {
      it('should call updateUser service with correct arguments', async () => {
        const mockUpdateResponse = { ...mockUser, ...updateDataUser };
        vi.mocked(adminService.updateUser).mockResolvedValue(mockUpdateResponse);
        const thunk = adminSlice.actions.updateUser(updatePayload);
        const result = await thunk(dispatch, getState, undefined);
        expect(adminService.updateUser).toHaveBeenCalledWith(userId, updateDataUser);
        expect(result.payload).toEqual(mockUpdateResponse);
      });

      it('should clean userData by removing empty strings, nulls, and password', async () => {
        const dirtyUserData = {
          username: 'new-login',
          email: '',
          full_name: null,
          password: '123',
        } as unknown as Partial<User>;
        vi.mocked(adminService.updateUser).mockResolvedValue(mockUser);
        const thunk = adminSlice.actions.updateUser({ id: userId, userData: dirtyUserData });
        await thunk(dispatch, getState, undefined);
        expect(adminService.updateUser).toHaveBeenCalledWith(userId, {
          username: 'new-login',
        });
      });

      it('should handle update errors via rejectWithValue', async () => {
        vi.mocked(adminService.updateUser).mockRejectedValue(new Error('Update failed'));
        const thunk = adminSlice.actions.updateUser(updatePayload);
        await thunk(dispatch, getState, undefined);
        const rejectedCall = dispatch.mock.calls.find(
          (call) => call[0].type === adminSlice.actions.updateUser.rejected.type,
        );
        expect(rejectedCall).toBeDefined();
      });
    });
  });

  /** Тестирование процесса окончательного удаления учетных записей пользователей */
  describe('deleteUser', () => {
    const userId = 'user-to-delete';

    /** Проверка корректности удаления пользователя из стейта и обновления счетчика */
    describe('lifecycle (reducers)', () => {
      it('should remove user from the list and decrement totalCount on fulfilled', () => {
        const stateWithUser = {
          ...initialState,
          users: [{ ...mockUser, id: userId }],
          totalCount: 1,
        };
        const action = {
          type: adminSlice.actions.deleteUser.fulfilled.type,
          meta: { arg: userId },
        };
        const state = adminReducer(stateWithUser, action);
        expect(state.users).toHaveLength(0);
        expect(state.totalCount).toBe(0);
      });
    });

    /** Проверка вызова административного API-сервиса и обработки сетевых ошибок */
    describe('execution (thunk logic)', () => {
      it('should call deleteUser service with correct ID', async () => {
        vi.mocked(adminService.deleteUser).mockResolvedValue(undefined);
        const thunk = adminSlice.actions.deleteUser(userId);
        await thunk(dispatch, getState, undefined);
        expect(adminService.deleteUser).toHaveBeenCalledWith(userId);
        const fulfilledCall = dispatch.mock.calls.find(
          (call) => call[0].type === adminSlice.actions.deleteUser.fulfilled.type,
        );
        expect(fulfilledCall).toBeDefined();
      });

      it('should handle deletion error via rejectWithValue', async () => {
        vi.mocked(adminService.deleteUser).mockRejectedValue(new Error('Delete failed'));
        const thunk = adminSlice.actions.deleteUser(userId);
        await thunk(dispatch, getState, undefined);
        const rejectedCall = dispatch.mock.calls.find(
          (call) => call[0].type === adminSlice.actions.deleteUser.rejected.type,
        );
        expect(rejectedCall).toBeDefined();
      });
    });
  });
});

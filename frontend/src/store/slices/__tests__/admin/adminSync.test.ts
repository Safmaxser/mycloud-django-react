import { describe, it, expect } from 'vitest';

import adminReducer, { adminSlice } from '../../adminSlice';
import { PAGE_SIZE } from '../../../../constants/config';
import { mockAdmin, mockUser } from '../fixtures';
import { createDirtyState, createMockUsers, initialState } from './admin.fixtures';

/**
 * Тесты синхронизации данных административной панели и обработки WebSocket-событий.
 * Проверка целостности списка пользователей и механизмов Real-time обновления.
 */
describe('adminSlice - Synchronization & WebSockets', () => {
  /** Блок тестирования базовых манипуляций с массивом пользователей (CRUD-логика) */
  describe('Data Synchronization Core', () => {
    /** Группа тестов для метода синхронизации/вставки */
    describe('performSync', () => {
      it('should update existing user data and NOT increment totalCount', () => {
        const stateWithUser = createDirtyState();
        const updatedUser = { ...mockUser, full_name: 'Ivan Ivanov' };
        const action = adminSlice.actions.performSync(updatedUser);
        const state = adminReducer(stateWithUser, action);
        const updated = state.users.find((u) => u.id === mockUser.id);
        expect(updated?.full_name).toBe('Ivan Ivanov');
        expect(state.totalCount).toBe(1);
      });

      it('should add new user to the start of the list on first page', () => {
        const action = adminSlice.actions.performSync(mockUser);
        const state = adminReducer(initialState, action);
        expect(state.users).toHaveLength(1);
        expect(state.users[0]).toBe(mockUser);
        expect(state.totalCount).toBe(1);
      });

      it('should ONLY increment totalCount if search filter is active', () => {
        const stateWithFilters = { ...initialState, totalCount: 10, search: 'test', page: 1 };
        const action = adminSlice.actions.performSync(mockUser);
        const state = adminReducer(stateWithFilters, action);
        expect(state.users).toHaveLength(0);
        expect(state.totalCount).toBe(11);
      });

      it('should pop the last user if list exceeds PAGE_SIZE', () => {
        const fullUsers = createMockUsers(PAGE_SIZE);
        const stateFull = { ...initialState, users: fullUsers, totalCount: PAGE_SIZE, page: 1 };
        const action = adminSlice.actions.performSync({ ...mockUser, id: 'new-user' });
        const state = adminReducer(stateFull, action);
        expect(state.users).toHaveLength(PAGE_SIZE);
        expect(state.users[0].id).toBe('new-user');
        expect(state.users[PAGE_SIZE - 1].id).toBe(`old-${PAGE_SIZE - 2}`);
      });
    });

    /** Группа тестов для метода удаления пользователей из списка */
    describe('removeUser', () => {
      it('should remove user from list and decrement totalCount if user exists', () => {
        const stateWithUser = createDirtyState({ totalCount: 10 });
        const action = adminSlice.actions.removeUser(mockUser.id);
        const state = adminReducer(stateWithUser, action);
        expect(state.users).toHaveLength(0);
        expect(state.totalCount).toBe(9);
      });

      it('should NOT decrement totalCount if userId is not in the list', () => {
        const stateWithOther = {
          ...initialState,
          users: [{ ...mockUser, id: 'other-id' }],
          totalCount: 10,
        };
        const action = adminSlice.actions.removeUser('missing-id');
        const state = adminReducer(stateWithOther, action);
        expect(state.users).toHaveLength(1);
        expect(state.totalCount).toBe(10);
      });

      it('should never set totalCount below zero', () => {
        const stateZero = createDirtyState({ totalCount: 0 });
        const action = adminSlice.actions.removeUser(mockUser.id);
        const state = adminReducer(stateZero, action);
        expect(state.totalCount).toBe(0);
        expect(state.users).toHaveLength(0);
      });
    });
  });

  /** Блок тестирования фильтрации WebSocket-событий (Access Control) */
  describe('WebSocket Real-time Sync (Security)', () => {
    it('should ignore syncUser if updatedUser is the same as currentUser', () => {
      const stateWithAdmin = { ...initialState, users: [mockAdmin], totalCount: 1 };
      const action = adminSlice.actions.syncUser({
        updatedUser: { ...mockAdmin, full_name: 'New Admin Name' },
        currentUser: mockAdmin,
      });
      const state = adminReducer(stateWithAdmin, action);
      expect(state.users[0].full_name).toBe(mockAdmin.full_name);
    });

    /** Проверка штатной работы: обновление данных другого пользователя */
    it('should sync user if updatedUser is different from currentUser', () => {
      const stateWithUser = createDirtyState();
      const action = adminSlice.actions.syncUser({
        updatedUser: { ...mockUser, full_name: 'Updated Ivan' },
        currentUser: mockAdmin,
      });
      const state = adminReducer(stateWithUser, action);
      expect(state.users[0].full_name).toBe('Updated Ivan');
    });
  });
});

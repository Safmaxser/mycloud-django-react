import { describe, expect, it } from 'vitest';

import { unauthorizedError } from '../../../actions';
import adminReducer, { adminSlice } from '../../adminSlice';
import { createDirtyState, initialState } from './admin.fixtures';

/**
 * Тесты синхронной логики управления интерфейсом панели администратора.
 * Проверка механизмов фильтрации списка пользователей, пагинации и глобальных сбросов.
 */
describe('adminSlice - UI & Filters', () => {
  /** Блок тестирования очистки данных и возврата к начальному состоянию */
  describe('initial state & resets', () => {
    it('should reset to initialState via resetState', () => {
      const dirtyState = createDirtyState({ page: 3, ordering: 'username', search: 'ivan' });
      const action = adminSlice.actions.resetState();
      const state = adminReducer(dirtyState, action);
      expect(state).toEqual(initialState);
    });

    it('should clear users list but keep current filters via clearItems', () => {
      const activeState = createDirtyState({ page: 5, ordering: 'email', search: 'm@m.com' });
      const action = adminSlice.actions.clearItems();
      const state = adminReducer(activeState, action);
      expect(state.users).toHaveLength(0);
      expect(state.totalCount).toBe(0);
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
      expect(state.page).toBe(5);
      expect(state.ordering).toBe('email');
      expect(state.search).toBe('m@m.com');
    });
  });

  /** Блок тестирования навигации по списку пользователей (пагинация и фильтры) */
  describe('navigation & filters', () => {
    it('should update page via setPage', () => {
      const startPage = 1;
      expect(initialState.page).toBe(startPage);
      const newPage = 10;
      const action = adminSlice.actions.setPage(newPage);
      const state = adminReducer(initialState, action);
      expect(state.page).toBe(newPage);
      expect(state.search).toBe('');
      expect(state.ordering).toBe('');
    });

    it('should update search string and reset page to 1 via setSearch', () => {
      const stateWithPage = createDirtyState({ page: 10, search: '' });
      const newQuery = 'my_login';
      const action = adminSlice.actions.setSearch(newQuery);
      const state = adminReducer(stateWithPage, action);
      expect(state.search).toBe(newQuery);
      expect(state.page).toBe(1);
    });

    it('should update ordering and reset page to 1 via setOrdering', () => {
      const stateWithPage = createDirtyState({
        page: 10,
        ordering: 'username',
      });
      const newOrdering = '-full_name';
      const action = adminSlice.actions.setOrdering(newOrdering);
      const state = adminReducer(stateWithPage, action);
      expect(state.ordering).toBe(newOrdering);
      expect(state.page).toBe(1);
    });
  });

  /** Тестирование глобальных триггеров сброса состояния (Cross-slice actions) */
  describe('extraReducers (global resets)', () => {
    it.each([
      { name: 'logoutUser.fulfilled', type: 'auth/logout/fulfilled' },
      { name: 'deleteMe.fulfilled', type: 'auth/deleteMe/fulfilled' },
      { name: 'unauthorizedError', type: unauthorizedError.type },
    ])('should reset admin state to initial on $name', ({ type }) => {
      const dirtyState = createDirtyState({ page: 5, search: 'secret' });
      const state = adminReducer(dirtyState, { type });
      expect(state).toEqual(initialState);
    });
  });
});

import { describe, expect, it } from 'vitest';

import { unauthorizedError } from '../../../actions';
import storageReducer, { storageSlice } from '../../storageSlice';
import { createDirtyState, initialState } from './storage.fixtures';

/**
 * Тесты синхронной логики управления интерфейсом хранилища.
 * Проверка механизмов фильтрации, пагинации, сброса состояний и индикации прогресса.
 */
describe('storageSlice - UI & Filters', () => {
  /** Блок тестирования очистки данных и возврата к начальному состоянию */
  describe('initial state & resets', () => {
    it('should reset to initialState via resetState', () => {
      const dirtyState = createDirtyState({ page: 3, ordering: 'size', search: 'document' });
      const action = storageSlice.actions.resetState();
      const state = storageReducer(dirtyState, action);
      expect(state).toEqual(initialState);
    });

    it('should clear items but keep filters via clearItems', () => {
      const activeState = createDirtyState({ page: 4, ordering: '-size', search: 'search' });
      const action = storageSlice.actions.clearItems();
      const state = storageReducer(activeState, action);
      expect(state.files).toHaveLength(0);
      expect(state.totalCount).toBe(0);
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
      expect(state.page).toBe(4);
      expect(state.ordering).toBe('-size');
      expect(state.search).toBe('search');
    });
  });

  /** Блок тестирования навигации (пагинация и фильтры) */
  describe('navigation & filters', () => {
    it('should update page via setPage', () => {
      const startPage = 1;
      expect(initialState.page).toBe(startPage);
      const newPage = 5;
      const action = storageSlice.actions.setPage(newPage);
      const state = storageReducer(initialState, action);
      expect(state.page).toBe(newPage);
      expect(state.search).toBe('');
      expect(state.ordering).toBe('');
    });

    it('should update search string and reset page to 1 via setSearch', () => {
      const stateWithPage = createDirtyState({ page: 10, search: '' });
      const newQuery = 'my_report';
      const action = storageSlice.actions.setSearch(newQuery);
      const state = storageReducer(stateWithPage, action);
      expect(state.search).toBe(newQuery);
      expect(state.page).toBe(1);
    });

    it('should update ordering and reset page to 1 via setOrdering', () => {
      const stateWithPage = createDirtyState({
        page: 8,
        ordering: 'name',
      });
      const newOrdering = '-size';
      const action = storageSlice.actions.setOrdering(newOrdering);
      const state = storageReducer(stateWithPage, action);
      expect(state.ordering).toBe(newOrdering);
      expect(state.page).toBe(1);
    });
  });

  /** Блок тестирования индикаторов загрузки и скачивания */
  describe('progress tracking', () => {
    const fileId = 'file-123';

    it('should update upload progress via setUploadProgress', () => {
      expect(initialState.uploadProgress).toBeNull();
      const progress = 45;
      const action = storageSlice.actions.setUploadProgress(progress);
      const state = storageReducer(initialState, action);
      expect(state.uploadProgress).toBe(progress);
      const resetAction = storageSlice.actions.setUploadProgress(null);
      const finalState = storageReducer(state, resetAction);
      expect(finalState.uploadProgress).toBeNull();
    });

    it('should update download progress for initialized file', () => {
      const initialStateWithStart = createDirtyState({ downloadingFiles: { [fileId]: 0 } });
      const action = storageSlice.actions.setDownloadProgress({
        id: fileId,
        progress: 50,
        type: 'download',
      });
      const state = storageReducer(initialStateWithStart, action);
      expect(state.downloadingFiles[fileId]).toBe(50);
    });

    it('should ignore progress update if file is not in the map and progress is not 0', () => {
      const action = storageSlice.actions.setDownloadProgress({
        id: 'unknown-id',
        progress: 10,
        type: 'download',
      });
      const state = storageReducer(initialState, action);
      expect(state.downloadingFiles['unknown-id']).toBeUndefined();
    });

    it('should update previewingFiles if type is preview', () => {
      const stateWithPreview = createDirtyState({ previewingFiles: { [fileId]: 0 } });
      const action = storageSlice.actions.setDownloadProgress({
        id: fileId,
        progress: 80,
        type: 'preview',
      });
      const state = storageReducer(stateWithPreview, action);
      expect(state.previewingFiles[fileId]).toBe(80);
      expect(state.downloadingFiles[fileId]).toBeUndefined();
    });

    it('should remove file from map when progress is null', () => {
      const stateWithProgress = createDirtyState({ downloadingFiles: { [fileId]: 100 } });
      const action = storageSlice.actions.setDownloadProgress({
        id: fileId,
        progress: null,
        type: 'download',
      });
      const state = storageReducer(stateWithProgress, action);
      expect(state.downloadingFiles[fileId]).toBeUndefined();
    });
  });

  /** Тестирование глобальных триггеров сброса состояния (Cross-slice actions) */
  describe('extraReducers (global resets)', () => {
    it.each([
      { name: 'logoutUser.fulfilled', type: 'auth/logout/fulfilled' },
      { name: 'deleteMe.fulfilled', type: 'auth/deleteMe/fulfilled' },
      { name: 'unauthorizedError', type: unauthorizedError.type },
    ])('should reset state to initial on $name', ({ type }) => {
      const dirtyState = createDirtyState({ page: 5, search: 'secret' });
      const state = storageReducer(dirtyState, { type });
      expect(state).toEqual(initialState);
    });
  });
});

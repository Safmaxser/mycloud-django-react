import { describe, it, expect } from 'vitest';

import storageReducer, { storageSlice } from '../../storageSlice';
import { PAGE_SIZE } from '../../../../constants/config';
import { mockAdmin, mockUser } from '../fixtures';
import { createDirtyState, createMockFiles, initialState, mockFile } from './storage.fixtures';

/**
 * Тесты логики синхронизации данных и обработки WebSocket-событий.
 * Проверка целостности списка файлов и системы разграничения доступа (Security).
 */
describe('storageSlice - Synchronization & WebSockets', () => {
  /** Блок тестирования базовых манипуляций с массивом файлов (CRUD-логика) */
  describe('Data Synchronization Core', () => {
    /** Группа тестов для метода синхронизации/вставки */
    describe('performSync', () => {
      it('should update existing file data and NOT increment totalCount', () => {
        const stateWithFile = createDirtyState();
        const updatedFile = { ...mockFile, original_name: 'new-name.txt' };
        const action = storageSlice.actions.performSync(updatedFile);
        const state = storageReducer(stateWithFile, action);
        const updated = state.files.find((f) => f.id === mockFile.id);
        expect(updated?.original_name).toBe('new-name.txt');
        expect(state.totalCount).toBe(1);
      });

      it('should add new file to the start of the list if on page 1 without filters', () => {
        const action = storageSlice.actions.performSync(mockFile);
        const state = storageReducer(initialState, action);
        expect(state.files).toHaveLength(1);
        expect(state.files[0].id).toBe(mockFile.id);
        expect(state.totalCount).toBe(1);
      });

      it('should ONLY increment totalCount if search filter is active', () => {
        const stateWithFilters = { ...initialState, totalCount: 10, search: 'test', page: 1 };
        const action = storageSlice.actions.performSync(mockFile);
        const state = storageReducer(stateWithFilters, action);
        expect(state.files).toHaveLength(0);
        expect(state.totalCount).toBe(11);
      });

      it('should pop the last file if list exceeds PAGE_SIZE', () => {
        const fullFiles = createMockFiles(PAGE_SIZE);
        const stateFull = { ...initialState, files: fullFiles, totalCount: PAGE_SIZE, page: 1 };
        const action = storageSlice.actions.performSync({ ...mockFile, id: 'new-file' });
        const state = storageReducer(stateFull, action);
        expect(state.files).toHaveLength(PAGE_SIZE);
        expect(state.files[0].id).toBe('new-file');
        expect(state.files[PAGE_SIZE - 1].id).toBe(`old-${PAGE_SIZE - 2}`);
      });
    });

    /** Группа тестов для метода удаления пользователей из списка */
    describe('performDelete', () => {
      it('should remove file from list and decrement totalCount', () => {
        const stateWithFiles = createDirtyState({ totalCount: 10 });
        const action = storageSlice.actions.performDelete(mockFile.id);
        const state = storageReducer(stateWithFiles, action);
        expect(state.files).toHaveLength(0);
        expect(state.totalCount).toBe(9);
      });

      it('should NOT decrement totalCount if file is not in the current list', () => {
        const stateWithOtherFiles = {
          ...initialState,
          files: [{ ...mockFile, id: 'other-id' }],
          totalCount: 10,
        };
        const action = storageSlice.actions.performDelete('missing-id');
        const state = storageReducer(stateWithOtherFiles, action);
        expect(state.files).toHaveLength(1);
        expect(state.totalCount).toBe(10);
      });

      it('should never set totalCount below zero', () => {
        const stateZero = createDirtyState({ totalCount: 0 });
        const action = storageSlice.actions.performDelete(mockFile.id);
        const state = storageReducer(stateZero, action);
        expect(state.totalCount).toBe(0);
      });
    });
  });

  /** Блок тестирования фильтрации WebSocket-событий (Access Control) */
  describe('WebSocket Real-time Sync (Security)', () => {
    /** Группа тестов для метода синхронизации или добавления файлов через сокеты */
    describe('syncFile', () => {
      it('should add new file via syncFile if admin is viewing target user', () => {
        const stateAdminViewingUser = { ...initialState, userId: 'user-123' };
        const action = storageSlice.actions.syncFile({
          file: { ...mockFile, id: 'new-999', owner_id: 'user-123' },
          user: mockAdmin,
        });
        const state = storageReducer(stateAdminViewingUser, action);
        expect(state.totalCount).toBe(1);
        expect(state.files[0].id).toBe('new-999');
      });

      it('should update metadata via syncFile for staff users', () => {
        const stateAdminViewingUser = createDirtyState({ userId: 'user-123' });
        const action = storageSlice.actions.syncFile({
          file: { ...mockFile, owner_id: 'user-123', original_name: 'renamed.txt' },
          user: mockAdmin,
        });
        const state = storageReducer(stateAdminViewingUser, action);
        expect(state.totalCount).toBe(1);
        expect(state.files[0].original_name).toBe('renamed.txt');
      });

      it('should add file via syncFile in personal cabinet', () => {
        const statePersonalCabinet = createDirtyState({ userId: null });
        const action = storageSlice.actions.syncFile({
          file: { ...mockFile, id: 'new-id', owner_id: 'user-123' },
          user: mockUser,
        });
        const state = storageReducer(statePersonalCabinet, action);
        expect(state.totalCount).toBe(2);
        const createdFile = state.files.find((f) => f.id === 'new-id');
        expect(createdFile).toBeDefined();
        expect(state.files[0].id).toBe('new-id');
      });

      it('should ignore syncFile if admin is viewing different context', () => {
        const stateAdminViewingUserA = { ...initialState, userId: 'user-A' };
        const action = storageSlice.actions.syncFile({
          file: { ...mockFile, owner_id: 'user-B' },
          user: mockAdmin,
        });
        const state = storageReducer(stateAdminViewingUserA, action);
        expect(state.totalCount).toBe(0);
        expect(state.files).toHaveLength(0);
      });

      it('should ignore syncFile if file belongs to stranger', () => {
        const statePersonal = { ...initialState, userId: null };
        const action = storageSlice.actions.syncFile({
          file: { ...mockFile, owner_id: 'stranger-id' },
          user: mockUser,
        });
        const state = storageReducer(statePersonal, action);
        expect(state.totalCount).toBe(0);
        expect(state.files).toHaveLength(0);
      });

      it('should ignore syncFile if user is null (fallback to empty string)', () => {
        const statePersonal = { ...initialState, userId: null };
        const action = storageSlice.actions.syncFile({ file: mockFile, user: null });
        const state = storageReducer(statePersonal, action);
        expect(state.totalCount).toBe(0);
        expect(state.files).toHaveLength(0);
      });
    });

    /** Группа тестов для метода удаления файлов на основе входящих сокет-событий */
    describe('removeFile', () => {
      it('should remove file in personal cabinet', () => {
        const state = createDirtyState({ userId: null });
        const action = storageSlice.actions.removeFile({
          fileId: mockFile.id,
          ownerId: mockUser.id,
          user: mockUser,
        });
        const nextState = storageReducer(state, action);
        expect(nextState.totalCount).toBe(0);
      });

      it('should remove file if admin is viewing owner', () => {
        const stateAdminViewing = createDirtyState({ userId: 'user-123' });
        const action = storageSlice.actions.removeFile({
          fileId: mockFile.id,
          ownerId: 'user-123',
          user: mockAdmin,
        });
        const state = storageReducer(stateAdminViewing, action);
        expect(state.totalCount).toBe(0);
        expect(state.files).toHaveLength(0);
      });

      it('should ignore removeFile if ownerId does not match context', () => {
        const statePersonal = createDirtyState({ userId: null });
        const action = storageSlice.actions.removeFile({
          fileId: mockFile.id,
          ownerId: 'stranger-id',
          user: mockUser,
        });
        const state = storageReducer(statePersonal, action);
        expect(state.totalCount).toBe(1);
        const fileStillExists = state.files.find((f) => f.id === mockFile.id);
        expect(fileStillExists).toBeDefined();
      });

      it('should ignore removeFile if user is null (fallback to empty string)', () => {
        const statePersonal = createDirtyState({ userId: null });
        const action = storageSlice.actions.removeFile({
          fileId: mockFile.id,
          ownerId: 'stranger-id',
          user: null,
        });
        const state = storageReducer(statePersonal, action);
        expect(state.totalCount).toBe(1);
        expect(state.files).toHaveLength(1);
        const fileStillExists = state.files.find((f) => f.id === mockFile.id);
        expect(fileStillExists).toBeDefined();
      });
    });
  });
});

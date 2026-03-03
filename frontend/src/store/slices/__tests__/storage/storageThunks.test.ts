import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { fileService } from '../../../../api/services/fileService';
import storageReducer, { storageSlice } from '../../storageSlice';
import {
  createDirtyState,
  initialState,
  mockFile,
  mockFileListResponse,
  mockFileObj,
} from './storage.fixtures';

vi.mock('../../../../api/services/fileService');

/**
 * Тестирование асинхронных операций (Thunks) хранилища.
 * Проверка жизненного цикла запросов и корректности взаимодействия с API-сервисом.
 */
describe('storageSlice - Async Thunks', () => {
  const dispatch = vi.fn();
  const getState = () => ({ storage: initialState });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  /** Тестирование процесса загрузки файлов на сервер */
  describe('uploadFile', () => {
    /** Проверка реакции стейта на стадии выполнения запроса */
    describe('lifecycle (reducers)', () => {
      it('should set uploadProgress to 0 when uploadFile is pending', () => {
        const action = { type: storageSlice.actions.uploadFile.pending.type };
        const state = storageReducer(initialState, action);
        expect(state.uploadProgress).toBe(0);
      });

      it('should reset uploadProgress and add file via performSync on fulfilled', () => {
        const stateWithProgress = { ...initialState, uploadProgress: 80 };
        const action = {
          type: storageSlice.actions.uploadFile.fulfilled.type,
          payload: mockFile,
        };
        const state = storageReducer(stateWithProgress, action);
        expect(state.uploadProgress).toBeNull();
        expect(state.files).toHaveLength(1);
        expect(state.totalCount).toBe(1);
      });

      it('should reset uploadProgress on rejected', () => {
        const stateWithProgress = { ...initialState, uploadProgress: 50 };
        const action = { type: storageSlice.actions.uploadFile.rejected.type };
        const state = storageReducer(stateWithProgress, action);
        expect(state.uploadProgress).toBeNull();
      });
    });

    /** Проверка логики вызова сервиса и обработки ошибок */
    describe('execution (thunk logic)', () => {
      it('should catch error and call rejectWithValue', async () => {
        vi.mocked(fileService.uploadFile).mockRejectedValue(new Error('Upload failed'));
        const thunk = storageSlice.actions.uploadFile({ file: mockFileObj });
        await thunk(dispatch, getState, undefined);
        const rejectedAction = dispatch.mock.calls.find(
          (call) => call[0].type === storageSlice.actions.uploadFile.rejected.type,
        );
        expect(rejectedAction).toBeDefined();
        expect(fileService.uploadFile).toHaveBeenCalled();
      });

      it('should call fileService and dispatch progress updates', async () => {
        vi.mocked(fileService.uploadFile).mockImplementation(async (_f, _c, onProgress) => {
          if (onProgress) onProgress(50);
          return mockFile;
        });
        const thunk = storageSlice.actions.uploadFile({ file: mockFileObj });
        await thunk(dispatch, getState, undefined);
        expect(fileService.uploadFile).toHaveBeenCalled();
        expect(dispatch).toHaveBeenCalledWith(storageSlice.actions.setUploadProgress(50));
      });

      it('should handle successful upload with default mock', async () => {
        vi.mocked(fileService.uploadFile).mockResolvedValue(mockFile);
        const thunk = storageSlice.actions.uploadFile({ file: mockFileObj });
        await thunk(dispatch, getState, undefined);
        expect(fileService.uploadFile).toHaveBeenCalled();
      });
    });
  });

  /** Тестирование процесса скачивания файлов и управления индикаторами прогресса */
  describe('downloadFile', () => {
    /** Проверка реакции состояния на этапы жизненного цикла скачивания */
    describe('lifecycle (reducers)', () => {
      const fileId = 'download-123';

      it('should initialize progress at 0 in downloadingFiles on pending', () => {
        const action = {
          type: storageSlice.actions.downloadFile.pending.type,
          meta: { arg: { id: fileId } },
        };
        const state = storageReducer(initialState, action);
        expect(state.downloadingFiles[fileId]).toBe(0);
      });

      it('should remove file from downloadingFiles on fulfilled', () => {
        const stateWithDownload = {
          ...initialState,
          downloadingFiles: { [fileId]: 99 },
        };
        const action = {
          type: storageSlice.actions.downloadFile.fulfilled.type,
          meta: { arg: { id: fileId } },
          payload: undefined,
        };
        const state = storageReducer(stateWithDownload, action);
        expect(state.downloadingFiles[fileId]).toBeUndefined();
      });
    });

    /** Проверка асинхронного взаимодействия с сервисом скачивания и таймерами UX */
    describe('execution (thunk logic)', () => {
      beforeEach(() => {
        vi.useFakeTimers();
      });

      afterEach(() => {
        vi.useRealTimers();
      });

      it('should call downloadFile and dispatch progress updates', async () => {
        vi.mocked(fileService.downloadFile).mockImplementation(async (_id, _name, onProgress) => {
          if (onProgress) onProgress(50);
        });
        const thunk = storageSlice.actions.downloadFile(mockFile);
        const promise = thunk(dispatch, getState, undefined);
        await vi.runAllTimersAsync();
        await promise;
        expect(fileService.downloadFile).toHaveBeenCalledWith(
          mockFile.id,
          mockFile.original_name,
          expect.any(Function),
          expect.any(Object),
        );
        expect(dispatch).toHaveBeenCalledWith(
          storageSlice.actions.setDownloadProgress({
            id: mockFile.id,
            progress: 50,
            type: 'download',
          }),
        );
      });

      it('should handle download error via rejectWithValue', async () => {
        vi.mocked(fileService.downloadFile).mockRejectedValue(new Error('Network error'));
        const thunk = storageSlice.actions.downloadFile(mockFile);
        await thunk(dispatch, getState, undefined);
        const rejectedCall = dispatch.mock.calls.find(
          (call) => call[0].type === storageSlice.actions.downloadFile.rejected.type,
        );
        expect(rejectedCall).toBeDefined();
        expect(fileService.downloadFile).toHaveBeenCalled();
      });
    });
  });

  /** Тестирование асинхронной загрузки Blob-превью для изображений */
  describe('loadPreview', () => {
    const fileId = 'preview-id';

    /** Проверка управления состоянием индикаторов превью в мапе previewingFiles */
    describe('lifecycle (reducers)', () => {
      it('should initialize progress in previewingFiles on pending', () => {
        const action = {
          type: storageSlice.actions.loadPreview.pending.type,
          meta: { arg: fileId },
        };
        const state = storageReducer(initialState, action);
        expect(state.previewingFiles[fileId]).toBe(0);
      });

      it('should remove file from previewingFiles on fulfilled (triggers settled)', () => {
        const stateWithPreview = { ...initialState, previewingFiles: { [fileId]: 50 } };
        const action = {
          type: storageSlice.actions.loadPreview.fulfilled.type,
          meta: { arg: fileId },
          payload: { url: 'blob:url' },
        };
        const state = storageReducer(stateWithPreview, action);
        expect(state.previewingFiles[fileId]).toBeUndefined();
      });
    });

    /** Проверка взаимодействия с API-сервисом и управления UX-таймерами */
    describe('execution (thunk logic)', () => {
      const mockUrl = 'blob:http://localhost/123';

      beforeEach(() => {
        vi.useFakeTimers();
      });

      afterEach(() => {
        vi.useRealTimers();
      });

      it('should load preview, dispatch progress and return url', async () => {
        vi.mocked(fileService.getPreview).mockImplementation(async (_id, onProgress) => {
          if (onProgress) onProgress(50);
          return mockUrl;
        });
        const thunk = storageSlice.actions.loadPreview(fileId);
        const promise = thunk(dispatch, getState, undefined);
        await vi.runAllTimersAsync();
        const result = await promise;
        expect(fileService.getPreview).toHaveBeenCalledWith(
          fileId,
          expect.any(Function),
          expect.any(Object),
        );
        expect(result.payload).toEqual({ url: mockUrl });
        expect(dispatch).toHaveBeenCalledWith(
          storageSlice.actions.setDownloadProgress({ id: fileId, progress: 50, type: 'preview' }),
        );
        expect(dispatch).toHaveBeenCalledWith(
          storageSlice.actions.setDownloadProgress({ id: fileId, progress: 100, type: 'preview' }),
        );
      });

      it('should handle preview loading error via rejectWithValue', async () => {
        vi.mocked(fileService.getPreview).mockRejectedValue(new Error('Preview fail'));
        const thunk = storageSlice.actions.loadPreview(fileId);
        await thunk(dispatch, getState, undefined);
        const rejectedCall = dispatch.mock.calls.find(
          (call) => call[0].type === storageSlice.actions.loadPreview.rejected.type,
        );
        expect(rejectedCall).toBeDefined();
      });
    });
  });

  /** Тестирование генерации публичных токенов для совместного доступа к файлам */
  describe('generateShareLink', () => {
    const fileId = 'file-to-share';
    const mockToken = 'secret-token-123';

    /** Проверка обновления поля special_link_token в объекте файла после получения ответа */
    describe('lifecycle (reducers)', () => {
      it('should update special_link_token for target file on fulfilled', () => {
        const stateWithFile = {
          ...initialState,
          files: [{ ...mockFile, id: fileId, special_link_token: null }],
        };
        const action = {
          type: storageSlice.actions.generateShareLink.fulfilled.type,
          payload: mockToken,
          meta: { arg: fileId },
        };
        const state = storageReducer(stateWithFile, action);
        const updatedFile = state.files.find((f) => f.id === fileId);
        expect(updatedFile?.special_link_token).toBe(mockToken);
      });

      it('should not modify state if target file is missing on fulfilled', () => {
        const stateWithOtherFile = {
          ...initialState,
          files: [{ ...mockFile, id: 'other-id' }],
        };
        const action = {
          type: storageSlice.actions.generateShareLink.fulfilled.type,
          payload: mockToken,
          meta: { arg: 'missing-id' },
        };
        const state = storageReducer(stateWithOtherFile, action);
        const file = state.files.find((f) => f.id === 'other-id');
        expect(file?.special_link_token).toBeNull();
      });
    });

    /** Проверка корректности вызова API и извлечения токена из ответа сервера */
    describe('execution (thunk logic)', () => {
      it('should call generateShareLink and return token in payload', async () => {
        vi.mocked(fileService.generateShareLink).mockResolvedValue({ token: mockToken });
        const thunk = storageSlice.actions.generateShareLink(fileId);
        const result = await thunk(dispatch, getState, undefined);
        expect(fileService.generateShareLink).toHaveBeenCalledWith(fileId);
        expect(result.payload).toBe(mockToken);
        const fulfilledAction = dispatch.mock.calls.find(
          (call) => call[0].type === storageSlice.actions.generateShareLink.fulfilled.type,
        );
        expect(fulfilledAction).toBeDefined();
      });

      it('should handle API errors via rejectWithValue', async () => {
        vi.mocked(fileService.generateShareLink).mockRejectedValue(new Error('API Error'));
        const thunk = storageSlice.actions.generateShareLink(fileId);
        await thunk(dispatch, getState, undefined);
        const rejectedCall = dispatch.mock.calls.find(
          (call) => call[0].type === storageSlice.actions.generateShareLink.rejected.type,
        );
        expect(rejectedCall).toBeDefined();
      });
    });
  });

  /** Тестирование процесса отзыва (сброса) публичного доступа к файлам */
  describe('revokeShareLink', () => {
    const fileId = 'shared-file-id';

    /** Проверка сброса токена доступа в состоянии после подтверждения сервером */
    describe('lifecycle (reducers)', () => {
      it('should clear special_link_token for target file on fulfilled', () => {
        const stateWithSharedFile = {
          ...initialState,
          files: [{ ...mockFile, id: fileId, special_link_token: 'some-token' }],
        };
        const action = {
          type: storageSlice.actions.revokeShareLink.fulfilled.type,
          meta: { arg: fileId },
        };
        const state = storageReducer(stateWithSharedFile, action);
        const updatedFile = state.files.find((f) => f.id === fileId);
        expect(updatedFile?.special_link_token).toBeNull();
      });

      it('should not modify state if target file is missing on fulfilled', () => {
        const stateWithOtherFile = {
          ...initialState,
          files: [{ ...mockFile, id: 'other-id', special_link_token: 'token' }],
        };
        const action = {
          type: storageSlice.actions.revokeShareLink.fulfilled.type,
          meta: { arg: 'missing-id' },
        };
        const state = storageReducer(stateWithOtherFile, action);
        expect(state.files[0].special_link_token).toBe('token');
      });
    });

    /** Проверка вызова API-сервиса и корректности обработки ответов */
    describe('execution (thunk logic)', () => {
      it('should call revokeShareLink and handle success', async () => {
        vi.mocked(fileService.revokeShareLink).mockResolvedValue(undefined);
        const thunk = storageSlice.actions.revokeShareLink(fileId);
        await thunk(dispatch, getState, undefined);
        expect(fileService.revokeShareLink).toHaveBeenCalledWith(fileId);
        const fulfilledAction = dispatch.mock.calls.find(
          (call) => call[0].type === storageSlice.actions.revokeShareLink.fulfilled.type,
        );
        expect(fulfilledAction).toBeDefined();
      });

      it('should handle API errors for link revocation', async () => {
        vi.mocked(fileService.revokeShareLink).mockRejectedValue(new Error('Revoke Error'));
        const thunk = storageSlice.actions.revokeShareLink(fileId);
        await thunk(dispatch, getState, undefined);
        const rejectedCall = dispatch.mock.calls.find(
          (call) => call[0].type === storageSlice.actions.revokeShareLink.rejected.type,
        );
        expect(rejectedCall).toBeDefined();
      });
    });
  });

  /** Тестирование получения списка файлов с поддержкой пагинации, поиска и сортировки */
  describe('fetchFiles', () => {
    /** Проверка корректности обновления состояния хранилища на всех этапах запроса */
    describe('lifecycle (reducers)', () => {
      it('should set loading: true and clear previous error on pending', () => {
        const stateWithError = createDirtyState({ error: 'Old error' });
        const action = { type: storageSlice.actions.fetchFiles.pending.type };
        const state = storageReducer(stateWithError, action);
        expect(state.loading).toBe(true);
        expect(state.error).toBeNull();
      });

      it('should save results, count and userId from meta on fulfilled', () => {
        const action = {
          type: storageSlice.actions.fetchFiles.fulfilled.type,
          payload: mockFileListResponse,
          meta: { arg: { userId: 'user-111' } },
        };
        const state = storageReducer(initialState, action);
        expect(state.loading).toBe(false);
        expect(state.files).toEqual(mockFileListResponse.results);
        expect(state.totalCount).toBe(mockFileListResponse.count);
        expect(state.userId).toBe('user-111');
      });

      it('should fallback to default values if payload fields are missing on fulfilled', () => {
        const action = {
          type: storageSlice.actions.fetchFiles.fulfilled.type,
          payload: { results: undefined, count: undefined },
          meta: { arg: {} },
        };
        const state = storageReducer(initialState, action);
        expect(state.loading).toBe(false);
        expect(state.files).toEqual([]);
        expect(state.totalCount).toBe(0);
        expect(state.userId).toBeNull();
      });

      it('should handle missing meta.arg by setting userId to null on fulfilled', () => {
        const action = {
          type: storageSlice.actions.fetchFiles.fulfilled.type,
          payload: mockFileListResponse,
          meta: { arg: undefined },
        };
        const state = storageReducer(initialState, action);
        expect(state.userId).toBeNull();
      });

      it('should save error message from payload on rejected', () => {
        const errorMessage = 'Server error 500';
        const stateWithLoading = { ...initialState, loading: true };
        const action = {
          type: storageSlice.actions.fetchFiles.rejected.type,
          payload: errorMessage,
        };
        const state = storageReducer(stateWithLoading, action);
        expect(state.loading).toBe(false);
        expect(state.error).toBe(errorMessage);
      });

      it('should set error to null if payload is missing on rejected', () => {
        const stateWith = { ...initialState, loading: true, error: 'Old error' };
        const action = {
          type: storageSlice.actions.fetchFiles.rejected.type,
          payload: undefined,
        };
        const state = storageReducer(stateWith, action);
        expect(state.loading).toBe(false);
        expect(state.error).toBeNull();
      });
    });

    /** Проверка логики формирования запроса на основе текущих фильтров в стейте */
    describe('execution (thunk logic)', () => {
      it('should call getFiles with current state params and handle success', async () => {
        const customState = createDirtyState({
          page: 5,
          search: 'report',
          ordering: '-created_at',
        });
        const customGetState = () => ({ storage: customState });
        vi.mocked(fileService.getFiles).mockResolvedValue(mockFileListResponse);
        const thunk = storageSlice.actions.fetchFiles({ userId: 'user-777' });
        const result = await thunk(dispatch, customGetState, undefined);
        expect(fileService.getFiles).toHaveBeenCalledWith(
          'user-777',
          5,
          '-created_at',
          'report',
          expect.any(Object),
        );
        expect(result.payload).toEqual(mockFileListResponse);
      });

      it('should handle API errors via rejectWithValue', async () => {
        vi.mocked(fileService.getFiles).mockRejectedValue(new Error('API Error'));
        const thunk = storageSlice.actions.fetchFiles();
        await thunk(dispatch, getState, undefined);
        const rejectedCall = dispatch.mock.calls.find(
          (call) => call[0].type === storageSlice.actions.fetchFiles.rejected.type,
        );
        expect(rejectedCall).toBeDefined();
      });
    });
  });

  /** Тестирование обновления метаданных файлов (переименование и комментарии) */
  describe('updateFile', () => {
    const fileId = 'file-to-update';
    const updatePayload = {
      id: fileId,
      original_name: 'updated-name.txt',
      comment: 'New description',
    };

    /** Проверка корректности патчинга объекта файла в общем списке (Data Integrity) */
    describe('lifecycle (reducers)', () => {
      it('should update file details in the list on fulfilled', () => {
        const stateWithFile = {
          ...initialState,
          files: [{ ...mockFile, id: fileId, original_name: 'old.txt', comment: null }],
        };
        const action = {
          type: storageSlice.actions.updateFile.fulfilled.type,
          payload: { ...mockFile, ...updatePayload },
        };
        const state = storageReducer(stateWithFile, action);
        const updatedFile = state.files.find((f) => f.id === fileId);
        expect(updatedFile?.original_name).toBe('updated-name.txt');
        expect(updatedFile?.comment).toBe('New description');
      });
    });

    /** Проверка корректности передачи параметров в API и обработки ответов сервера */
    describe('execution (thunk logic)', () => {
      it('should call updateFile service with correct arguments', async () => {
        const mockUpdateResponse = { ...mockFile, ...updatePayload };
        vi.mocked(fileService.updateFile).mockResolvedValue(mockUpdateResponse);
        const thunk = storageSlice.actions.updateFile(updatePayload);
        const result = await thunk(dispatch, getState, undefined);
        expect(fileService.updateFile).toHaveBeenCalledWith(fileId, {
          original_name: 'updated-name.txt',
          comment: 'New description',
        });
        expect(result.payload).toEqual(mockUpdateResponse);
      });

      it('should handle update errors via rejectWithValue', async () => {
        vi.mocked(fileService.updateFile).mockRejectedValue(new Error('Update failed'));
        const thunk = storageSlice.actions.updateFile(updatePayload);
        await thunk(dispatch, getState, undefined);
        const rejectedCall = dispatch.mock.calls.find(
          (call) => call[0].type === storageSlice.actions.updateFile.rejected.type,
        );
        expect(rejectedCall).toBeDefined();
      });
    });
  });

  /** Тестирование окончательного удаления файлов из хранилища */
  describe('deleteFile', () => {
    const fileId = 'file-to-delete';

    /** Проверка корректности удаления объекта из массива и обновления счетчика */
    describe('lifecycle (reducers)', () => {
      it('should remove file and decrement totalCount on fulfilled', () => {
        const stateWithFile = {
          ...initialState,
          files: [{ ...mockFile, id: fileId }],
          totalCount: 1,
        };
        const action = {
          type: storageSlice.actions.deleteFile.fulfilled.type,
          meta: { arg: fileId },
        };
        const state = storageReducer(stateWithFile, action);
        expect(state.files).toHaveLength(0);
        expect(state.totalCount).toBe(0);
      });
    });

    /** Проверка вызова API-сервиса и обработки сетевых ошибок */
    describe('execution (thunk logic)', () => {
      it('should call deleteFile service with correct ID', async () => {
        vi.mocked(fileService.deleteFile).mockResolvedValue(undefined);
        const thunk = storageSlice.actions.deleteFile(fileId);
        await thunk(dispatch, getState, undefined);
        expect(fileService.deleteFile).toHaveBeenCalledWith(fileId);
        const fulfilledCall = dispatch.mock.calls.find(
          (call) => call[0].type === storageSlice.actions.deleteFile.fulfilled.type,
        );
        expect(fulfilledCall).toBeDefined();
      });

      it('should handle deletion error via rejectWithValue', async () => {
        vi.mocked(fileService.deleteFile).mockRejectedValue(new Error('Delete failed'));
        const thunk = storageSlice.actions.deleteFile(fileId);
        await thunk(dispatch, getState, undefined);
        const rejectedCall = dispatch.mock.calls.find(
          (call) => call[0].type === storageSlice.actions.deleteFile.rejected.type,
        );
        expect(rejectedCall).toBeDefined();
      });
    });
  });
});

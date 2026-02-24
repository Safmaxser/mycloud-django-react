import type { PayloadAction } from '@reduxjs/toolkit';
import { createAppSlice } from '../createAppSlice';

import { fileService } from '../../api/services/fileService';
import { deleteMe, logoutUser } from './authSlice';
import { unauthorizedError } from '../actions';

import { parseError } from '../../utils/errors';
import { calculateUXDelay } from '../../utils/ui';
import { PAGE_SIZE } from '../../constants/config';
import type { FileListResponse, FileItem } from '../../types/storage';
import type { User } from '../../types/user';
import type { ThunkConfig } from '../../types/common';

/** Состояние хранилища файлов и процессов загрузки. */
export interface StorageState {
  files: FileItem[];
  totalCount: number;
  userId: string | null; // ID просматриваемого пользователя (null для личного кабинета)
  loading: boolean;
  error: string | null;
  uploadProgress: number | null; // Прогресс загрузки на сервер (0-100)
  previewingFiles: Record<string, number>; // Прогресс чтения в RAM для превью
  downloadingFiles: Record<string, number>; // Прогресс скачивания на диск (Blob)
  page: number;
  ordering: string;
  search: string;
}

const initialState: StorageState = {
  files: [],
  totalCount: 0,
  userId: null,
  loading: false,
  error: null,
  uploadProgress: null,
  previewingFiles: {},
  downloadingFiles: {},
  page: 1,
  ordering: '',
  search: '',
};

type ProgressType = 'download' | 'preview';

/** Слайс для управления файловыми операциями и прогрессом загрузки. */
export const storageSlice = createAppSlice({
  name: 'storage',
  initialState,
  reducers: (create) => ({
    /** Сброс состояния до начальных значений. */
    resetState: create.reducer((state) => {
      Object.assign(state, initialState);
    }),

    /** Очистка списка файлов с сохранением текущих фильтров. */
    clearItems: create.reducer((state) => {
      const filters = {
        page: state.page,
        ordering: state.ordering,
        search: state.search,
      };
      Object.assign(state, { ...initialState, ...filters });
    }),

    /** Установка сортировки и сброс на первую страницу. */
    setOrdering: create.reducer((state, action: PayloadAction<string>) => {
      state.ordering = action.payload;
      state.page = 1;
    }),

    /** Установка поиска и сброс на первую страницу. */
    setSearch: create.reducer((state, action: PayloadAction<string>) => {
      state.search = action.payload;
      state.page = 1;
    }),

    /** Переход на указанную страницу пагинации. */
    setPage: create.reducer((state, action: PayloadAction<number>) => {
      state.page = action.payload;
    }),

    /** Внутренняя логика обновления или добавления файла в массив состояния. */
    performSync: create.reducer((state, action: PayloadAction<FileItem>) => {
      const file = action.payload;
      const index = state.files.findIndex((f) => f.id === file.id);
      if (index !== -1) {
        state.files[index] = { ...state.files[index], ...file };
      } else {
        // Добавляем файл в начало списка только если пользователь на 1-й странице без фильтров
        if (state.page === 1 && !state.search && !state.ordering) {
          state.files.unshift(file);
          state.totalCount += 1;
          if (state.files.length > PAGE_SIZE) state.files.pop();
        } else {
          state.totalCount += 1;
        }
      }
    }),

    /** Внутренняя логика исключения файла из массива и декремента счетчика. */
    performDelete: create.reducer((state, action: PayloadAction<string>) => {
      const fileId = action.payload;
      const initialLength = state.files.length;
      state.files = state.files.filter((f) => f.id !== fileId);
      if (state.files.length < initialLength) {
        state.totalCount = Math.max(0, state.totalCount - 1);
      }
    }),

    /**
     * Обработчик WebSocket-события: создание или обновление файла.
     * Синхронизирует интерфейс в реальном времени с учетом текущего контекста.
     */
    syncFile: create.reducer(
      (
        state,
        action: PayloadAction<{
          file: FileItem;
          user: User | null;
        }>,
      ) => {
        const { file, user } = action.payload;
        const isStaff = user?.is_staff || false;
        const currentUserId = user?.id || '';
        const isTargetAdmin = isStaff && state.userId === file.owner_id;
        const isMyOwn = state.userId === null && file.owner_id === currentUserId;
        if (!isTargetAdmin && !isMyOwn) return;
        storageSlice.caseReducers.performSync(state, {
          payload: file,
          type: 'storage/performSync',
        });
      },
    ),

    /**
     * Обработчик WebSocket-события: удаление файла из системы.
     * Гарантирует актуальность списка без необходимости перезагрузки страницы.
     */
    removeFile: create.reducer(
      (
        state,
        action: PayloadAction<{
          fileId: string;
          ownerId: string;
          user: User | null;
        }>,
      ) => {
        const { fileId, ownerId, user } = action.payload;
        const isStaff = user?.is_staff || false;
        const currentUserId = user?.id || '';
        const isTargetAdmin = isStaff && state.userId === ownerId;
        const isMyOwn = state.userId === null && ownerId === currentUserId;
        if (!isTargetAdmin && !isMyOwn) return;
        storageSlice.caseReducers.performDelete(state, {
          payload: fileId,
          type: 'storage/performDelete',
        });
      },
    ),

    /** Обновление прогресса отправки файла на сервер. */
    setUploadProgress: create.reducer((state, action: PayloadAction<number | null>) => {
      state.uploadProgress = action.payload;
    }),

    /** Универсальный редьюсер для управления словарями прогресса (Download/Preview). */
    setDownloadProgress: create.reducer(
      (
        state,
        action: PayloadAction<{ id: string; progress: number | null; type: ProgressType }>,
      ) => {
        const { id, progress, type } = action.payload;
        const targetMap = type === 'download' ? state.downloadingFiles : state.previewingFiles;
        if (progress !== null && targetMap[id] === undefined && progress !== 0) {
          return;
        }
        if (progress === null) {
          delete targetMap[id];
        } else {
          targetMap[id] = progress;
        }
      },
    ),

    /** Загрузка файла на сервер с обновлением прогресса и данных профиля. */
    uploadFile: create.asyncThunk<FileItem, { file: File; comment?: string }>(
      async ({ file, comment }, { dispatch, rejectWithValue }) => {
        try {
          return await fileService.uploadFile(file, comment, (percent) => {
            dispatch(storageSlice.actions.setUploadProgress(percent));
          });
        } catch (error) {
          return rejectWithValue(parseError(error, 'Ошибка при передаче файла.'));
        }
      },
      {
        pending: (state) => {
          state.uploadProgress = 0;
        },
        fulfilled: (state, action) => {
          state.uploadProgress = null;
          storageSlice.caseReducers.performSync(state, {
            payload: action.payload,
            type: 'storage/performSync',
          });
        },
        rejected: (state) => {
          state.uploadProgress = null;
        },
      },
    ),

    /** Скачивание файла на диск с искусственной задержкой для плавности UX. */
    downloadFile: create.asyncThunk<void, FileItem>(
      async (file, { dispatch, signal, rejectWithValue }) => {
        try {
          await fileService.downloadFile(
            file.id,
            file.original_name,
            (percent) => {
              dispatch(
                storageSlice.actions.setDownloadProgress({
                  id: file.id,
                  progress: percent,
                  type: 'download',
                }),
              );
            },
            { signal },
          );
          // Задержка, чтобы индикатор 100% не исчезал мгновенно
          await new Promise((resolve) => setTimeout(resolve, calculateUXDelay(file.size)));
        } catch (error) {
          return rejectWithValue(parseError(error, 'Ошибка при скачивании файла.'));
        }
      },
      {
        pending: (state, action) => {
          const { id } = action.meta.arg;
          state.downloadingFiles[id] = 0;
        },
        settled: (state, action) => {
          const { id } = action.meta.arg;
          delete state.downloadingFiles[id];
        },
      },
    ),

    /** Загрузка содержимого файла в память для отображения в модальном окне. */
    loadPreview: create.asyncThunk<{ url: string }, string>(
      async (id, { dispatch, signal, rejectWithValue }) => {
        try {
          const url = await fileService.getPreview(
            id,
            (percent) => {
              dispatch(
                storageSlice.actions.setDownloadProgress({
                  id,
                  progress: percent,
                  type: 'preview',
                }),
              );
            },
            { signal },
          );
          dispatch(
            storageSlice.actions.setDownloadProgress({ id, progress: 100, type: 'preview' }),
          );
          await new Promise((resolve) => setTimeout(resolve, 100));
          return { url };
        } catch (error) {
          return rejectWithValue(parseError(error, 'Не удалось загрузить превью.'));
        }
      },
      {
        pending: (state, action) => {
          const fileId = action.meta.arg;
          state.previewingFiles[fileId] = 0;
        },
        settled: (state, action) => {
          const fileId = action.meta.arg;
          delete state.previewingFiles[fileId];
        },
      },
    ),

    /** Создание ссылки для публичного доступа. */
    generateShareLink: create.asyncThunk<string, string>(
      async (id) => {
        const response = await fileService.generateShareLink(id);
        return response.token;
      },
      {
        fulfilled: (state, action) => {
          const fileId = action.meta.arg;
          const file = state.files.find((f) => f.id === fileId);
          if (file) file.special_link_token = action.payload;
        },
      },
    ),

    /** Удаление ссылки публичного доступа. */
    revokeShareLink: create.asyncThunk<void, string>(
      async (id) => {
        await fileService.revokeShareLink(id);
      },
      {
        fulfilled: (state, action) => {
          const fileId = action.meta.arg;
          const file = state.files.find((f) => f.id === fileId);
          if (file) file.special_link_token = null;
        },
      },
    ),

    /** Получения списка файлов текущего пользователя или выбранного (для админ-панели) с учетом фильтров. */
    fetchFiles: create.asyncThunk<FileListResponse, { userId?: string } | void, ThunkConfig>(
      async (params, { getState, rejectWithValue, signal }) => {
        const state = getState() as { storage: StorageState };
        const { page, ordering, search } = state.storage;
        try {
          return await fileService.getFiles(params?.userId, page, ordering, search, { signal });
        } catch (error) {
          return rejectWithValue(parseError(error, 'Не удалось загрузить список файлов.'));
        }
      },
      {
        pending: (state) => {
          state.loading = true;
          state.error = null;
        },
        fulfilled: (state, action) => {
          state.loading = false;
          state.files = action.payload.results || [];
          state.totalCount = action.payload.count;
          state.userId = action.meta.arg?.userId || null;
        },
        rejected: (state, action) => {
          state.loading = false;
          state.error = action.payload ?? null;
        },
      },
    ),

    /** Частичное обновление метаданных файла (имя и комментарий) */
    updateFile: create.asyncThunk<FileItem, { id: string; original_name: string; comment: string }>(
      async ({ id, original_name, comment }, { rejectWithValue }) => {
        try {
          return await fileService.updateFile(id, {
            original_name,
            comment,
          });
        } catch (error) {
          return rejectWithValue(parseError(error, 'Не удалось сохранить изменения.'));
        }
      },
      {
        fulfilled: (state, action) => {
          storageSlice.caseReducers.performSync(state, {
            payload: action.payload,
            type: 'storage/performSync',
          });
        },
      },
    ),

    /** Безвозвратное удаление записи из базы данных и физического файла из хранилища. */
    deleteFile: create.asyncThunk<void, string>(
      async (id, { rejectWithValue }) => {
        try {
          await fileService.deleteFile(id);
        } catch (error) {
          return rejectWithValue(parseError(error, 'Не удалось удалить файл.'));
        }
      },
      {
        fulfilled: (state, action) => {
          const fileId = action.meta.arg;
          storageSlice.caseReducers.performDelete(state, {
            payload: fileId,
            type: 'storage/performDelete',
          });
        },
      },
    ),
  }),

  extraReducers: (builder) => {
    // Сброс данных при выходе или потере авторизации
    [logoutUser.fulfilled, deleteMe.fulfilled, unauthorizedError].forEach((action) => {
      builder.addCase(action, (state) => Object.assign(state, initialState));
    });
  },
});

export const {
  resetState,
  clearItems,
  setOrdering,
  setSearch,
  setPage,
  setUploadProgress,
  setDownloadProgress,
  uploadFile,
  downloadFile,
  loadPreview,
  generateShareLink,
  revokeShareLink,
  fetchFiles,
  updateFile,
  deleteFile,
} = storageSlice.actions;
export default storageSlice.reducer;

import type { PayloadAction } from '@reduxjs/toolkit';
import { createAppSlice } from '../createAppSlice';

import { adminService } from '../../api/services/adminService';
import { unauthorizedError } from '../actions';
import { parseError } from '../../utils/errors';
import { PAGE_SIZE } from '../../constants/config';
import type { User, UserListResponse } from '../../types/user';
import type { ThunkConfig } from '../../types/common';

/** Состояние модуля административного управления пользователями. */
export interface AdminState {
  users: User[];
  totalCount: number;
  loading: boolean;
  error: string | null;
  page: number;
  ordering: string;
  search: string;
}

const initialState: AdminState = {
  users: [],
  totalCount: 0,
  loading: false,
  error: null,
  page: 1,
  ordering: '',
  search: '',
};

/** Слайс для управления пользователями (только для администраторов). */
export const adminSlice = createAppSlice({
  name: 'admin',
  initialState,
  reducers: (create) => ({
    /** Сброс состояния до начальных значений. */
    resetState: create.reducer((state) => {
      Object.assign(state, initialState);
    }),

    /** Очистка списка пользователей с сохранением текущих фильтров. */
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
    performSync: create.reducer((state, action: PayloadAction<User>) => {
      const user = action.payload;
      const index = state.users.findIndex((u) => u.id === user.id);
      if (index !== -1) {
        state.users[index] = { ...state.users[index], ...user };
      } else {
        // Добавляем файл в начало списка только если пользователь на 1-й странице без фильтров
        if (state.page === 1 && !state.search && !state.ordering) {
          state.users.unshift(user);
          state.totalCount += 1;
          if (state.users.length > PAGE_SIZE) {
            state.users.pop();
          }
        } else {
          state.totalCount += 1;
        }
      }
    }),

    /**
     * Обработчик WebSocket-события: создание или обновление данных пользователя.
     * Синхронизирует список администратора при регистрации или изменении профилей.
     */
    syncUser: create.reducer(
      (
        state,
        action: PayloadAction<{
          updatedUser: User;
          currentUser: User;
        }>,
      ) => {
        const { updatedUser, currentUser } = action.payload;
        if (updatedUser.id === currentUser.id) return;
        adminSlice.caseReducers.performSync(state, {
          payload: updatedUser,
          type: 'admin/performSync',
        });
      },
    ),

    /**
     * Универсальный метод удаления пользователя из локального состояния.
     * Применяется при подтверждении удаления через API или получении события по WebSocket.
     */
    removeUser: create.reducer((state, action: PayloadAction<string>) => {
      const userId = action.payload;
      const initialLength = state.users.length;
      state.users = state.users.filter((u) => u.id !== userId);
      if (state.users.length < initialLength) {
        state.totalCount = Math.max(0, state.totalCount - 1);
      }
    }),

    /** Получения списка пользователей с учетом фильтров. */
    fetchUsers: create.asyncThunk<UserListResponse, void, ThunkConfig>(
      async (_, { getState, rejectWithValue, signal }) => {
        const state = getState() as { admin: AdminState };
        const { page, ordering, search } = state.admin;
        try {
          return await adminService.getUsers(page, ordering, search, { signal });
        } catch (error) {
          return rejectWithValue(parseError(error, 'Не удалось загрузить список пользователей.'));
        }
      },
      {
        pending: (state) => {
          state.loading = true;
          state.error = null;
        },
        fulfilled: (state, action) => {
          state.loading = false;
          state.users = action.payload.results || [];
          state.totalCount = action.payload.count || 0;
        },
        rejected: (state, action) => {
          state.loading = false;
          state.error = action.payload ?? null;
        },
      },
    ),

    /** Обновление данных пользователя с предварительной очисткой пустых полей. */
    updateUser: create.asyncThunk<User, { id: string; userData: Partial<User> }>(
      async ({ id, userData }, { rejectWithValue }) => {
        try {
          const cleanData = Object.fromEntries(
            Object.entries(userData).filter(([k, v]) => {
              if (k === 'password') return false;
              const isRequired = ['email', 'username'].includes(k);
              return isRequired ? v !== '' && v != null : v != null;
            }),
          );
          return await adminService.updateUser(id, cleanData);
        } catch (error) {
          return rejectWithValue(parseError(error, 'Не удалось обновить пользователя.'));
        }
      },
      {
        fulfilled: (state, action) => {
          adminSlice.caseReducers.performSync(state, {
            payload: action.payload,
            type: 'admin/performSync',
          });
        },
      },
    ),

    /** Удаление пользователя из системы и обновление счетчика. */
    deleteUser: create.asyncThunk<void, string>(
      async (id, { rejectWithValue }) => {
        try {
          await adminService.deleteUser(id);
        } catch (error) {
          return rejectWithValue(parseError(error, 'Не удалось удалить пользователя.'));
        }
      },
      {
        fulfilled: (state, action) => {
          const userId = action.meta.arg;
          adminSlice.caseReducers.removeUser(state, {
            payload: userId,
            type: 'admin/removeUser',
          });
        },
      },
    ),
  }),

  extraReducers: (builder) => {
    // Сброс данных при выходе или потере авторизации
    const resetActions = [
      'auth/logout/fulfilled',
      'auth/deleteMe/fulfilled',
      unauthorizedError.type,
    ];
    resetActions.forEach((action) => {
      builder.addCase(action, (state) => {
        Object.assign(state, initialState);
      });
    });
  },
});

export const {
  resetState,
  clearItems,
  setOrdering,
  setSearch,
  setPage,
  fetchUsers,
  updateUser,
  deleteUser,
} = adminSlice.actions;
export default adminSlice.reducer;

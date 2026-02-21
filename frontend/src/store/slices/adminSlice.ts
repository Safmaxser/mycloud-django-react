import type { PayloadAction } from '@reduxjs/toolkit';
import { createAppSlice } from '../createAppSlice';

import { adminService } from '../../api/services/adminService';
import { deleteMe, logoutUser } from './authSlice';
import { unauthorizedError } from '../actions';
import { parseError } from '../../utils/errors';
import type { User, UserListResponse } from '../../types/user';

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

    /** Получения списка пользователей с учетом фильтров. */
    fetchUsers: create.asyncThunk<UserListResponse, void>(
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
          state.totalCount = action.payload.count;
        },
        rejected: (state, action) => {
          state.loading = false;
          state.error = action.payload as string;
        },
      },
    ),

    /** Обновление данных пользователя с предварительной очисткой пустых полей. */
    updateUser: create.asyncThunk<User, { id: string; userData: Partial<User> }>(
      async ({ id, userData }, { rejectWithValue }) => {
        try {
          const cleanData = Object.fromEntries(
            Object.entries(userData).filter(([k, v]) => v !== '' && v !== null && k !== 'password'),
          );
          return await adminService.updateUser(id, cleanData);
        } catch (error) {
          return rejectWithValue(parseError(error, 'Не удалось обновить пользователя.'));
        }
      },
      {
        fulfilled: (state, action) => {
          const index = state.users.findIndex((u) => u.id === action.payload.id);
          if (index !== -1) {
            state.users[index] = action.payload;
          }
        },
      },
    ),

    /** Удаление пользователя из системы и обновление счетчика. */
    deleteUser: create.asyncThunk<string, string>(
      async (id, { rejectWithValue }) => {
        try {
          await adminService.deleteUser(id);
          return id;
        } catch (error) {
          return rejectWithValue(parseError(error, 'Не удалось удалить пользователя.'));
        }
      },
      {
        fulfilled: (state, action) => {
          state.users = state.users.filter((u) => u.id !== action.payload);
          state.totalCount -= 1;
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
  fetchUsers,
  updateUser,
  deleteUser,
} = adminSlice.actions;
export default adminSlice.reducer;

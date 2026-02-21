import { createAppSlice } from '../createAppSlice';

import { authService } from '../../api/services/authService';
import { parseError } from '../../utils/errors';
import { unauthorizedError } from '../actions';
import type { User, LoginResponse, RegisterRequest } from '../../types/user';

/** Состояние аутентификации и профиля пользователя. */
export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isInitializing: boolean; // Флаг первичного восстановления сессии
  isSubmitting: boolean; // Загрузка для форм (Login/Register)
  isUpdating: boolean; // Загрузка для настроек профиля
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isInitializing: false,
  isSubmitting: false,
  isUpdating: false,
  error: null,
};

/** Слайс для управления аутентификацией и данными сессии. */
export const authSlice = createAppSlice({
  name: 'auth',
  initialState,
  reducers: (create) => ({
    /** Сброс состояния до начальных значений. */
    resetState: create.reducer((state) => {
      Object.assign(state, initialState);
    }),

    /** Сброс ошибок валидации и сервера. */
    clearAuthError: create.reducer((state) => {
      state.error = null;
    }),

    /** Регистрация нового аккаунта. */
    registerUser: create.asyncThunk<User, RegisterRequest>(
      async (data, { rejectWithValue, signal }) => {
        try {
          return await authService.register(data, { signal });
        } catch (error) {
          return rejectWithValue(parseError(error, 'Ошибка при регистрации.'));
        }
      },
      {
        pending: (state) => {
          state.isSubmitting = true;
          state.error = null;
        },
        fulfilled: (state) => {
          state.isSubmitting = false;
        },
        rejected: (state, action) => {
          state.isSubmitting = false;
          state.error = action.payload as string;
        },
      },
    ),

    /** Авторизация пользователя и сохранение данных в состояние. */
    loginUser: create.asyncThunk<LoginResponse, Record<string, string>>(
      async (credentials, { rejectWithValue, signal }) => {
        try {
          return await authService.login(credentials, { signal });
        } catch (error) {
          return rejectWithValue(parseError(error, 'Ошибка авторизации.'));
        }
      },
      {
        pending: (state) => {
          state.isSubmitting = true;
          state.error = null;
        },
        fulfilled: (state, action) => {
          state.isSubmitting = false;
          state.user = action.payload.user;
          state.isAuthenticated = true;
        },
        rejected: (state, action) => {
          state.isSubmitting = false;
          state.error = action.payload as string;
        },
      },
    ),

    /** Выход из системы с очисткой состояния на фронтенде и сервере. */
    logoutUser: create.asyncThunk<void, void>(
      async (_, { rejectWithValue }) => {
        try {
          await authService.logout();
        } catch (error) {
          return rejectWithValue(parseError(error, 'Ошибка при выходе.'));
        }
      },
      {
        fulfilled: (state) => {
          Object.assign(state, initialState);
        },
      },
    ),

    /** Получение профиля пользователя для восстановления сессии и синхронизации данных хранилища. */
    fetchMe: create.asyncThunk<User, void>(
      async (_, { rejectWithValue, signal }) => {
        try {
          return await authService.getMe({ signal });
        } catch (error) {
          // Подавляем вывод ошибки, чтобы не показывать уведомление при фоновой проверке сессии
          return rejectWithValue(parseError(error, ''));
        }
      },
      {
        pending: (state) => {
          state.isInitializing = true;
        },
        fulfilled: (state, action) => {
          state.isInitializing = false;
          state.user = action.payload;
          state.isAuthenticated = true;
        },
        rejected: (state) => {
          state.isInitializing = false;
          state.user = null;
          state.isAuthenticated = false;
        },
      },
    ),

    /** Частичное обновление профиля (фильтрует пустые поля и защищенные атрибуты). */
    updateMe: create.asyncThunk<User, Partial<User & { password?: string }>>(
      async (userData, { rejectWithValue, signal }) => {
        try {
          const cleanData = Object.fromEntries(
            Object.entries(userData).filter(([k, v]) => v !== '' && v !== null && k !== 'is_staff'),
          );
          return await authService.updateMe(cleanData, { signal });
        } catch (error) {
          return rejectWithValue(parseError(error, 'Не удалось обновить профиль.'));
        }
      },
      {
        pending: (state) => {
          state.isUpdating = true;
        },
        fulfilled: (state, action) => {
          state.isUpdating = false;
          state.user = action.payload;
        },
        rejected: (state) => {
          state.isUpdating = false;
        },
      },
    ),

    /** Удаление собственного аккаунта. */
    deleteMe: create.asyncThunk(
      async (_, { rejectWithValue }) => {
        try {
          await authService.deleteMe();
        } catch (error) {
          return rejectWithValue(parseError(error, 'Ошибка при удалении профиля.'));
        }
      },
      {
        pending: (state) => {
          state.isUpdating = true;
        },
        fulfilled: (state) => {
          Object.assign(state, initialState);
        },
        rejected: (state) => {
          state.isUpdating = false;
        },
      },
    ),
  }),

  extraReducers: (builder) => {
    // Сброс данных при потере авторизации
    builder.addCase(unauthorizedError, (state) => {
      Object.assign(state, initialState);
    });
  },
});

export const {
  resetState,
  clearAuthError,
  registerUser,
  loginUser,
  logoutUser,
  fetchMe,
  updateMe,
  deleteMe,
} = authSlice.actions;
export default authSlice.reducer;

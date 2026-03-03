import type { AdminState } from '../../adminSlice';
import type { User, UserListResponse } from '../../../../types/user';
import { mockUser } from '../fixtures';

/** Начальное состояние панели администратора (эталон для сбросов) */
export const initialState: AdminState = {
  users: [],
  totalCount: 0,
  loading: false,
  error: null,
  page: 1,
  ordering: '',
  search: '',
};

/** Фабрика для создания "грязного" состояния панели (содержит данные и ошибки по умолчанию) */
export const createDirtyState = (overrides: Partial<AdminState> = {}): AdminState => ({
  ...initialState,
  users: [mockUser],
  totalCount: 1,
  loading: true,
  error: 'Some error',
  ...overrides,
});

/** Генератор списка пользователей для тестирования пагинации и больших массивов данных */
export const createMockUsers = (count: number, baseId = 'old'): User[] => {
  return Array.from({ length: count }, (_, i) => ({
    ...mockUser,
    id: `${baseId}-${i}`,
    username: `login-${i}`,
  }));
};

/** Имитация успешного ответа API со списком пользователей и метаданными пагинации */
export const mockUserListResponse: UserListResponse = {
  results: [mockUser],
  count: 1,
  next: null,
  previous: null,
};

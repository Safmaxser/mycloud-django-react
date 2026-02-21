import type { RegisterFormValues } from '../utils/validation';

/** Полная информация о профиле пользователя и его квотах в хранилище. */
export interface User {
  id: string;
  username: string;
  email: string;
  full_name: string;
  is_staff: boolean;
  files_count: number;
  files_total_size: number;
  storage_quota: number;
  max_file_size: number;
  date_joined: string;
  updated_at: string;
}

/** Данные для регистрации (исключая повторный ввод пароля). */
export type RegisterRequest = Omit<RegisterFormValues, 'confirmPassword'>;

/** Ответ сервера при успешном входе в систему. */
export interface LoginResponse {
  detail: string;
  user: User;
}

/** Ответ API со списком пользователей и данными пагинации. */
export interface UserListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: User[];
}

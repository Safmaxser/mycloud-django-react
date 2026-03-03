import type { User } from '../../../types/user';

/** Стандартный профиль пользователя (is_staff: false) */
export const mockUser: User = {
  id: 'user-123',
  username: 'testuser',
  email: 'test@example.com',
  full_name: 'Test User',
  is_staff: false,
  files_count: 5,
  files_total_size: 1024 * 1024 * 50, // 50 MB
  storage_quota: 1024 * 1024 * 100, // 100 MB
  max_file_size: 1024 * 1024 * 20, // 20 MB
  date_joined: '2026-01-01T12:00:00Z',
  updated_at: '2026-02-24T12:00:00Z',
};

/** Профиль администратора (is_staff: true) */
export const mockAdmin: User = {
  ...mockUser,
  id: 'admin-999',
  username: 'admin',
  email: 'admin@cloud.com',
  full_name: 'System Administrator',
  is_staff: true,
};

import { generatePath } from 'react-router-dom';

/** Константы маршрутов и утилиты для генерации динамических путей приложения. */
export const ROUTES = {
  HOME: '/' as const,
  LOGIN: '/login' as const,
  REGISTER: '/register' as const,
  ADMIN: '/administration' as const,
  ADMIN_USER_FILES: '/administration/users/:userId/files' as const,
  NOT_FOUND: '*' as const,
};

/** Генерирует URL для просмотра файлов пользователя по его ID. */
export const getAdminFilesPath = (userId: string) =>
  generatePath(ROUTES.ADMIN_USER_FILES, { userId });

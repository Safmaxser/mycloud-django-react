import { NavLink } from 'react-router-dom';
import { HardDrive, Users, LogOut, Cloud } from 'lucide-react';

import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { logoutUser } from '../../../store/slices/authSlice';
import { ROUTES } from '../../../routes/paths';

import { SidebarButton } from './SidebarButton';
import { StorageUsage } from './StorageUsage';

/**
 * Боковая панель навигации приложения.
 * Отображает логотип, ссылки на разделы (с учетом прав администратора),
 * индикатор использования хранилища и кнопку выхода.
 */
export function Sidebar() {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);

  const isAdmin = user?.is_staff || false;

  /** Инициирует процесс выхода пользователя из системы. */
  const handleLogout = () => {
    dispatch(logoutUser());
  };

  return (
    <aside className="flex w-20 flex-col border-r border-gray-200 bg-white shadow-sm lg:w-64">
      <div className="flex flex-col items-center gap-1 border-b border-gray-100 p-6 lg:flex-row lg:gap-3">
        <div className="rounded-lg bg-blue-600 p-2 shadow-md shadow-blue-200">
          <Cloud className="h-6 w-6 text-white" />
        </div>
        <span className="text-xs font-bold tracking-tight text-gray-800 lg:text-xl">MyCloud</span>
      </div>
      <nav className="flex-1 space-y-1 p-1 lg:p-4">
        <SidebarButton as={NavLink} to={ROUTES.HOME} icon={HardDrive} label="Мои файлы" />
        {isAdmin && (
          <SidebarButton as={NavLink} to={ROUTES.ADMIN} icon={Users} label="Пользователи" />
        )}
      </nav>
      <StorageUsage user={user} />
      <div className="border-t border-gray-100 p-1 lg:p-4">
        <SidebarButton onClick={handleLogout} icon={LogOut} label="Выйти" />
      </div>
    </aside>
  );
}

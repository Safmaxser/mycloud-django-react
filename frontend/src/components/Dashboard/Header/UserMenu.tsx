import { useState } from 'react';

import { useAppSelector } from '../../../store/hooks';
import { ProfileEditModal } from '../../Modals/ProfileEditModal';
import { UserAvatar } from '../../UI/UserAvatar';

/** Компонент меню пользователя для отображения статуса профиля и вызова окна настроек. */
export function UserMenu() {
  const { user } = useAppSelector((state) => state.auth);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Приоритет отображения: полное имя -> логин -> заглушка
  const userName = user?.full_name || user?.username || 'U';

  return (
    <div className="flex items-center gap-4">
      <button
        onClick={() => setIsProfileOpen(true)}
        className="group flex cursor-pointer items-center gap-2 rounded-xl border border-none px-1 py-1 transition-all hover:shadow-sm hover:shadow-blue-500/50 lg:bg-blue-50 lg:px-4 lg:hover:bg-blue-100"
      >
        <div className="flex items-center gap-2">
          <div className="hidden flex-col gap-1 text-right lg:flex">
            <p className="whitespace-nowrap text-sm font-bold leading-none text-gray-900">
              {userName}
            </p>
            <p className="text-xs font-medium text-gray-500">
              {user?.is_staff ? 'Администратор' : 'Пользователь'}
            </p>
          </div>
          <UserAvatar user={user} />
        </div>
      </button>
      {isProfileOpen && <ProfileEditModal onClose={() => setIsProfileOpen(false)} />}
    </div>
  );
}

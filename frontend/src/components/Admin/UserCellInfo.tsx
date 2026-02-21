import type { User } from '../../types/user';
import { UserAvatar } from '../UI/UserAvatar';

interface UserCellInfoProps {
  user: User;
}

/** Ячейка таблицы для отображения основной информации о пользователе (аватар, имя и логин). */
export function UserCellInfo({ user }: UserCellInfoProps) {
  return (
    <div className="col-table justify-start">
      <div className="flex w-full items-center gap-3">
        <UserAvatar user={user} />
        <div className="flex min-w-0 flex-col">
          <span className="max-w-40 truncate text-base font-bold text-gray-900">
            {user.full_name || 'Без имени'}
          </span>
          <span className="max-w-40 truncate text-sm text-gray-500">{user.username}</span>
        </div>
      </div>
    </div>
  );
}

import type { User } from '../../types/user';
import { UserCellInfo } from './UserCellInfo';
import { UserCellContacts } from './UserCellContacts';
import { UserCellStorage } from './UserCellStorage';
import { UserCellDate } from './UserCellDate';
import { UserCellStats } from './UserCellStats';
import { UserCellActions } from './UserCellActions';

interface UserRowProps {
  user: User;
}

/** Компонент строки таблицы для отображения метаданных и действий с конкретным пользователем. */
export function UserRow({ user }: UserRowProps) {
  return (
    <div className="row-users-table items-star group border-gray-50 bg-white transition-colors last:border-0 hover:bg-blue-50/30">
      <UserCellInfo user={user} />
      <UserCellContacts user={user} />
      <UserCellStorage user={user} />
      <UserCellDate user={user} />
      <UserCellStats user={user} />
      <UserCellActions user={user} />
    </div>
  );
}

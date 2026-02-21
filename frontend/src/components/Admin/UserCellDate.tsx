import { formatDate, formatRelativeTime } from '../../utils/formatters';
import type { User } from '../../types/user';

interface UserCellDateProps {
  user: User;
}

/** Ячейка таблицы для отображения даты регистрации пользователя в абсолютном и относительном форматах. */
export function UserCellDate({ user }: UserCellDateProps) {
  return (
    <div className="col-table">
      <div className="inline-flex flex-col items-start">
        <span className="text-sm text-gray-900">{formatDate(user.date_joined)}</span>
        <span className="text-sm text-gray-500">{formatRelativeTime(user.date_joined)}</span>
      </div>
    </div>
  );
}

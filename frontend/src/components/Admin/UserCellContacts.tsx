import type { User } from '../../types/user';

interface UserCellContactsProps {
  user: User;
}

/** Ячейка таблицы для отображения контактных данных пользователя (email). */
export function UserCellContacts({ user }: UserCellContactsProps) {
  return (
    <div className="col-table">
      <div className="truncate text-base font-medium text-gray-700">{user.email}</div>
    </div>
  );
}

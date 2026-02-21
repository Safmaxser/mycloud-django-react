import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { setOrdering } from '../../store/slices/adminSlice';

import type { User } from '../../types/user';
import { UserRow } from './UserRow';
import { SortHeader } from '../UI/SortHeader';


export interface TableColumn {
  label: string;
  field: string | null;
  className?: string;
}

export const USER_TABLE_COLUMNS: readonly TableColumn[] = [
  { label: 'Пользователь', field: 'username', className: 'justify-start' },
  { label: 'Контакты', field: 'email' },
  { label: 'Хранилище', field: 'files_total_size' },
  { label: 'Регистрация', field: 'date_joined' },
  { label: 'Статус', field: 'is_staff' },
  { label: 'Действия', field: null },
] as const;

interface UserTableProps {
  users: User[];
}

/**
 * Таблица для отображения списка пользователей.
 * Поддерживает интерактивную сортировку через заголовки колонок.
 */
export function UserTable({ users }: UserTableProps) {
  const dispatch = useAppDispatch();
  const ordering = useAppSelector((state) => state.admin.ordering);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white font-sans text-gray-900 shadow-sm">
      <div className="row-users-table sticky top-0 z-10 rounded-2xl border-b border-gray-100 bg-gray-50/80 backdrop-blur-md">
        {USER_TABLE_COLUMNS.map((col) => (
          <SortHeader
            key={col.label}
            label={col.label}
            field={col.field}
            currentOrdering={ordering}
            onSort={(nextValue) => dispatch(setOrdering(nextValue))}
            className={col.className}
          />
        ))}
      </div>
      {users.map((u) => (
        <UserRow key={u.id} user={u} />
      ))}
    </div>
  );
}

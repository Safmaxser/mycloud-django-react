import { ShieldCheck } from 'lucide-react';
import type { User } from '../../types/user';

interface UserCellStatsProps {
  user: User;
}

/** Ячейка таблицы для визуального отображения статуса (роли) пользователя в системе. */
export function UserCellStats({ user }: UserCellStatsProps) {
  return (
    <div className="col-table">
      {user.is_staff ? (
        <span className="flex items-center gap-1 rounded-2xl bg-orange-50 px-3 py-2 text-xs font-medium uppercase tracking-wide text-orange-600 ring-1 ring-orange-100">
          <ShieldCheck className="h-4 w-4" /> Администратор
        </span>
      ) : (
        <span className="rounded-2xl bg-gray-100 px-3 py-2 text-xs font-medium uppercase tracking-wide text-gray-500">
          Пользователь
        </span>
      )}
    </div>
  );
}

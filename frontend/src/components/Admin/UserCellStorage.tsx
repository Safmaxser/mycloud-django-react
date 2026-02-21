import { HardDrive } from 'lucide-react';

import { formatBytes } from '../../utils/formatters';
import { cn } from '../../utils/ui';
import type { User } from '../../types/user';
import { DEFAULT_STORAGE_QUOTA } from '../../constants/config';

interface UserCellStorageProps {
  user: User;
}

/** Ячейка таблицы для визуализации занятого места и квоты пользователя с индикатором заполнения. */
export function UserCellStorage({ user }: UserCellStorageProps) {
  const quotaBytes = user?.storage_quota || DEFAULT_STORAGE_QUOTA;
  const usedSpace = user?.files_total_size || 0;
  const usagePercent = Math.min((usedSpace / quotaBytes) * 100, 100);

  return (
    <div className="col-table">
      <div className="flex w-3/4 flex-col">
        <div className={`flex items-center gap-1.5 text-sm font-bold text-gray-700`}>
          <HardDrive className="h-3 w-3" />
          {formatBytes(user.files_total_size)}
        </div>
        <span className="text-xs font-medium text-gray-700">Файлов: {user.files_count}</span>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
          <div
            className={cn(
              'h-full w-full transition-all duration-500',
              usagePercent > 80 ? 'bg-red-500' : 'bg-blue-500',
            )}
            style={{ width: `${usagePercent}%` }}
          />
        </div>
      </div>
    </div>
  );
}

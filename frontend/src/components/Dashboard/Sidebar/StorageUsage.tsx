import { Database } from 'lucide-react';

import { formatBytes } from '../../../utils/formatters';
import type { User } from '../../../types/user';
import { DEFAULT_STORAGE_QUOTA } from '../../../constants/config';

export interface StorageUsageProps {
  user: User | null;
}

/** Компонент отображения заполненности хранилища на основе квот пользователя. */
export function StorageUsage({ user }: StorageUsageProps) {
  const quotaBytes = user?.storage_quota || DEFAULT_STORAGE_QUOTA;
  const usedSpace = user?.files_total_size || 0;
  const usagePercent = Math.min((usedSpace / quotaBytes) * 100, 100);

  return (
    <div className="border-t border-gray-100 p-4">
      <div className="rounded-xl bg-gray-50 p-4">
        <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase text-gray-600">
          <Database className="h-4 w-4" />
          Хранилище
        </div>
        <div className="text-sm font-bold text-gray-800">{formatBytes(user?.files_total_size)}</div>
        <div className="mt-1 text-xs text-gray-500">из {formatBytes(quotaBytes)} доступных</div>

        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
          <div
            className="bg-linear-to-r h-full from-blue-600 to-blue-400 transition-all duration-500"
            style={{ width: `${usagePercent}%` }}
          />
        </div>
        <span className="text-xs font-medium text-gray-700">Файлов: {user?.files_count || ''}</span>
      </div>
    </div>
  );
}

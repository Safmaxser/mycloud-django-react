import { FileDown, History } from 'lucide-react';

import { formatDate } from '../../../utils/formatters';
import type { FileItem } from '../../../types/storage';

interface FileCellStatsProps {
  file: FileItem;
}

/** Ячейка таблицы для отображения статистики скачиваний и даты последнего обращения к файлу. */
export function FileCellStats({ file }: FileCellStatsProps) {
  return (
    <div className="col-table">
      <div className="inline-flex flex-col items-start">
        <div className="flex items-center gap-1.5 text-sm font-bold text-gray-700">
          <FileDown className="h-3.5 w-3.5 text-blue-300" />
          <span>{file.download_count}</span>
        </div>

        <div className="text-tiny flex items-center gap-1.5 text-sm font-medium text-gray-500">
          {file.last_download_at ? (
            <>
              <History className="h-3 w-3 text-gray-400" />
              <span>{formatDate(file.last_download_at)}</span>
            </>
          ) : (
            'Не скачивался'
          )}
        </div>
      </div>
    </div>
  );
}

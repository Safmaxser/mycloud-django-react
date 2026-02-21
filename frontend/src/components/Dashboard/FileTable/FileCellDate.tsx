import { formatDate, formatRelativeTime } from '../../../utils/formatters';
import type { FileItem } from '../../../types/storage';

interface FileCellDateProps {
  file: FileItem;
}

/** Ячейка таблицы для отображения даты создания файла в абсолютном и относительном форматах. */
export function FileCellDate({ file }: FileCellDateProps) {
  return (
    <div className="col-table">
      <div className="inline-flex flex-col items-start">
        <span className="text-sm text-gray-900">{formatDate(file.created_at)}</span>
        <span className="text-sm text-gray-500">{formatRelativeTime(file.created_at)}</span>
      </div>
    </div>
  );
}

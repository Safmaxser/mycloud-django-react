import { formatBytes } from '../../../utils/formatters';
import type { FileItem } from '../../../types/storage';

interface FileCellSizeProps {
  file: FileItem;
}

/** Ячейка таблицы для отображения размера файла в человекочитаемом формате. */
export function FileCellSize({ file }: FileCellSizeProps) {
  return (
    <div className="col-table">
      <span className="text-sm font-medium text-gray-600">{formatBytes(file.size)}</span>
    </div>
  );
}

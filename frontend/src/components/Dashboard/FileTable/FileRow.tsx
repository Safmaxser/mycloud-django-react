import type { FileItem } from '../../../types/storage';
import { FileCellInfo } from './FileCellInfo';
import { FileCellSize } from './FileCellSize';
import { FileCellDate } from './FileCellDate';
import { FileCellStats } from './FileCellStats';
import { FileCellSharing } from './FileCellSharing';
import { FileCellActions } from './FileCellActions';

interface FileRowProps {
  file: FileItem;
}

/** Компонент строки таблицы для отображения метаданных и действий с конкретным файлом. */
export function FileRow({ file }: FileRowProps) {
  return (
    <div className="row-files-table items-star group border-gray-50 bg-white transition-colors last:border-0 hover:bg-blue-50/30">
      <FileCellInfo file={file} />
      <FileCellSize file={file} />
      <FileCellDate file={file} />
      <FileCellStats file={file} />
      <FileCellSharing file={file} />
      <FileCellActions file={file} />
    </div>
  );
}

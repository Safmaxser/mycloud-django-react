import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { setOrdering } from '../../../store/slices/storageSlice';

import type { FileItem } from '../../../types/storage';
import { FileRow } from './FileRow';
import { SortHeader } from '../../UI/SortHeader';

export interface TableColumn {
  label: string;
  field: string | null;
  className?: string;
}

export const FILE_TABLE_COLUMNS: readonly TableColumn[] = [
  { label: 'Название', field: 'original_name', className: 'justify-start' },
  { label: 'Размер', field: 'size' },
  { label: 'Дата', field: 'created_at' },
  { label: 'Скачивания', field: 'download_count' },
  { label: 'Ссылки', field: 'special_link_token' },
  { label: 'Действия', field: null },
] as const;

interface FileTableProps {
  files: FileItem[];
}

/**
 * Таблица для отображения списка файлов.
 * Поддерживает интерактивную сортировку через заголовки колонок.
 */
export function FileTable({ files }: FileTableProps) {
  const dispatch = useAppDispatch();
  const ordering = useAppSelector((state) => state.storage.ordering);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white font-sans text-gray-900 shadow-sm">
      <div className="row-files-table sticky top-0 z-10 rounded-2xl border-b border-gray-100 bg-gray-50/80 backdrop-blur-md">
        {FILE_TABLE_COLUMNS.map((col) => (
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
      {files.map((file) => (
        <FileRow key={file.id} file={file} />
      ))}
    </div>
  );
}

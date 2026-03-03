import type { StorageState } from '../../storageSlice';
import type { FileItem, FileListResponse } from '../../../../types/storage';

/** Начальное состояние хранилища (эталон для сбросов) */
export const initialState: StorageState = {
  files: [],
  totalCount: 0,
  userId: null,
  loading: false,
  error: null,
  uploadProgress: null,
  previewingFiles: {},
  downloadingFiles: {},
  page: 1,
  ordering: '',
  search: '',
};

/** Типовой объект файла для тестов манипуляций с данными */
export const mockFile: FileItem = {
  id: '1',
  original_name: 'test.txt',
  size: 1024,
  comment: null,
  owner_id: 'user_1',
  special_link_token: null,
  download_count: 0,
  created_at: '2026-02-24T12:00:00Z',
  last_download_at: null,
  updated_at: '2026-02-24T12:00:00Z',
  mimetype: 'text/plain',
};

/** Фабрика для создания "грязного" состояния (содержит файлы и ошибки по умолчанию) */
export const createDirtyState = (overrides: Partial<StorageState> = {}): StorageState => ({
  ...initialState,
  files: [mockFile],
  totalCount: 1,
  loading: true,
  error: 'Some error',
  ...overrides,
});

/** Генератор списка файлов для тестирования пагинации и переполнения страниц */
export const createMockFiles = (count: number, baseId = 'old'): FileItem[] => {
  return Array.from({ length: count }, (_, i) => ({
    ...mockFile,
    id: `${baseId}-${i}`,
    original_name: `file-${i}.txt`,
  }));
};

/** Имитация успешного ответа API со списком файлов и метаданными пагинации */
export const mockFileListResponse: FileListResponse = {
  results: [mockFile],
  count: 1,
  next: null,
  previous: null,
};

/** Объект File для тестирования процессов загрузки в Thunks */
export const mockFileObj = new File(['hello content'], 'hello.txt', {
  type: 'text/plain',
});

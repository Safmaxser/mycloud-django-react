/** Метаданные файла, включая статистику скачиваний и статус публичного доступа. */
export interface FileItem {
  id: string;
  original_name: string;
  size: number;
  comment: string | null;
  owner_username: string;
  special_link_token: string | null;
  download_count: number;
  created_at: string;
  last_download_at: string | null;
  updated_at: string;
  mimetype: string;
}

/** Ответ API со списком файлов и данными пагинации. */
export interface FileListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: FileItem[];
}

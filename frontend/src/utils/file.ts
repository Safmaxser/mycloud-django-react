import type { FileItem } from '../types/storage';

/**
 * Определяет категорию файла на основе его MIME-типа и расширения.
 * Используется для выбора иконки в таблице или способа предпросмотра в модальном окне.
 */
export const getFileType = (file: FileItem): string => {
  const mime = file.mimetype?.toLowerCase() || '';
  const ext = file.original_name.split('.').pop()?.toLowerCase() || '';

  // Изображения
  if (
    mime.startsWith('image/') ||
    ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(ext)
  ) {
    return 'image';
  }

  // Видео
  if (mime.startsWith('video/') || ['mp4', 'webm', 'ogg', 'mov', 'avif'].includes(ext)) {
    return 'video';
  }

  // Аудио
  if (mime.startsWith('audio/') || ['mp3', 'wav', 'ogg', 'aac', 'm4a'].includes(ext)) {
    return 'audio';
  }

  // PDF документы
  if (mime === 'application/pdf' || ext === 'pdf') {
    return 'pdf';
  }

  // Текстовые документы и Office
  if (
    mime.includes('word') ||
    mime.includes('officedocument') ||
    mime.includes('text/plain') ||
    ['doc', 'docx', 'txt', 'rtf'].includes(ext)
  ) {
    return 'document';
  }

  // Архивы
  if (
    mime.includes('zip') ||
    mime.includes('compressed') ||
    mime.includes('tar') ||
    ['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)
  ) {
    return 'archive';
  }

  return 'file';
};

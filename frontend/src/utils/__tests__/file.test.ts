import { describe, expect, it } from 'vitest';

import { getFileType } from '../file';
import type { FileItem } from '../../types/storage';

/**
 * Тестирование логики классификации файлов в облачном хранилище.
 * Проверка корректности определения категорий (иконок) на основе MIME-типов и расширений.
 */
describe('file - getFileType', () => {
  const createMockFile = (name: string, mime?: string): FileItem =>
    ({
      original_name: name,
      mimetype: mime || '',
    }) as FileItem;

  /** Блок тестирования стандартного распределения по категориям */
  describe('Categorization Logic', () => {
    it('should identify images by MIME type or extension', () => {
      expect(getFileType(createMockFile('photo.JPG'))).toBe('image');
      expect(getFileType(createMockFile('unknown', 'image/webp'))).toBe('image');
    });

    it('should identify videos by extension or video/* mime type', () => {
      expect(getFileType(createMockFile('movie.mp4'))).toBe('video');
      expect(getFileType(createMockFile('clip', 'video/quicktime'))).toBe('video');
    });

    it('should identify audio files and streaming formats', () => {
      expect(getFileType(createMockFile('song.mp3'))).toBe('audio');
      expect(getFileType(createMockFile('voice', 'audio/wav'))).toBe('audio');
    });

    it('should identify PDF documents as a standalone category', () => {
      expect(getFileType(createMockFile('doc.pdf'))).toBe('pdf');
      expect(getFileType(createMockFile('paper', 'application/pdf'))).toBe('pdf');
    });

    it('should identify MS Office and plain text documents', () => {
      expect(getFileType(createMockFile('report.docx'))).toBe('document');
      expect(getFileType(createMockFile('notes.txt'))).toBe('document');
      expect(getFileType(createMockFile('contract', 'application/msword'))).toBe('document');
    });

    it('should identify compressed archives', () => {
      expect(getFileType(createMockFile('backup.zip'))).toBe('archive');
      expect(getFileType(createMockFile('data', 'application/x-tar'))).toBe('archive');
    });

    it('should return "file" for unknown types (Default fallback)', () => {
      expect(getFileType(createMockFile('mystery.xyz', 'application/octet-stream'))).toBe('file');
    });
  });

  /** Блок тестирования устойчивости к некорректным или неполным данным */
  describe('Edge Cases & Safety', () => {
    it('should work correctly if mimetype is missing or null', () => {
      const fileWithoutMime = { original_name: 'test.png' } as FileItem;
      expect(getFileType(fileWithoutMime)).toBe('image');
    });

    it('should work correctly if filename has no dot/extension', () => {
      expect(getFileType(createMockFile('README', 'text/plain'))).toBe('document');
    });

    it('should be case-insensitive for both extensions and mime types', () => {
      expect(getFileType(createMockFile('IMAGE.PNG', 'IMAGE/PNG'))).toBe('image');
    });

    it('should handle filename without extension correctly', () => {
      const fileNoDot = { original_name: 'README', mimetype: '' } as FileItem;
      expect(getFileType(fileNoDot)).toBe('file');
    });

    it('should handle empty filename string without throwing errors', () => {
      const emptyFile = { original_name: '', mimetype: '' } as FileItem;
      expect(getFileType(emptyFile)).toBe('file');
    });
  });
});

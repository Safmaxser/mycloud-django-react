import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { formatBytes, formatDate, formatRelativeTime } from '../formatters';

/**
 * Тестирование утилит преобразования данных в человекочитаемый вид.
 * Проверка корректности локализации дат, точности округления байтов и работы с временными интервалами.
 */
describe('formatters', () => {
  /** Проверка форматирования размеров файлов (КБ, МБ, ГБ) */
  describe('formatBytes', () => {
    it('should return placeholder for null or undefined', () => {
      expect(formatBytes(null)).toBe('—');
      expect(formatBytes(undefined)).toBe('—');
    });

    it('should format zero or negative bytes', () => {
      expect(formatBytes(0)).toBe('0 Байт');
      expect(formatBytes(-5)).toBe('0 Байт');
    });

    it('should format different sizes correctly', () => {
      expect(formatBytes(500)).toBe('500 Байт');
      expect(formatBytes(1024)).toBe('1 КБ');
      expect(formatBytes(1024 * 1024 * 1.5)).toBe('1.5 МБ');
      expect(formatBytes(1024 * 1024 * 1024)).toBe('1 ГБ');
    });

    it('should handle decimals parameter', () => {
      const size = 1024 * 1.2345;
      expect(formatBytes(size, 3)).toBe('1.235 КБ');
      expect(formatBytes(size, 0)).toBe('1 КБ');
    });

    it('should handle negative decimals by defaulting to 0', () => {
      const size = 1024 * 1.5;
      expect(formatBytes(size, -1)).toBe('2 КБ');
    });
  });

  /** Проверка локализации дат согласно стандарту ru-RU */
  describe('formatDate', () => {
    it('should return placeholder for missing date', () => {
      expect(formatDate(null)).toBe('—');
      expect(formatDate('')).toBe('—');
    });

    it('should format ISO string to Russian locale format', () => {
      const isoDate = '2026-05-20T15:30:00Z';
      expect(formatDate(isoDate)).toMatch(/\d{2}\.\d{2}\.\d{4}, \d{2}:\d{2}/);
    });
  });

  /** Проверка генерации относительных интервалов (X минут назад и т.д.) */
  describe('formatRelativeTime', () => {
    const mockNow = new Date('2026-06-01T12:00:00Z');

    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(mockNow);
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should return "только что" for very recent events', () => {
      const justNow = new Date(mockNow.getTime() - 30 * 1000).toISOString();
      expect(formatRelativeTime(justNow)).toBe('только что');
    });

    it('should format minutes, hours and days correctly', () => {
      const tenMinsAgo = new Date(mockNow.getTime() - 10 * 60 * 1000).toISOString();
      const twoHoursAgo = new Date(mockNow.getTime() - 2 * 60 * 60 * 1000).toISOString();
      const fiveDaysAgo = new Date(mockNow.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString();
      expect(formatRelativeTime(tenMinsAgo)).toBe('10 минут назад');
      expect(formatRelativeTime(twoHoursAgo)).toBe('2 часа назад');
      expect(formatRelativeTime(fiveDaysAgo)).toBe('5 дней назад');
    });

    it('should format weeks, months and years', () => {
      const twoWeeksAgo = new Date(mockNow.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString();
      const threeMonthsAgo = new Date(mockNow.getTime() - 92 * 24 * 60 * 60 * 1000).toISOString();
      const lastYear = new Date(mockNow.getTime() - 400 * 24 * 60 * 60 * 1000).toISOString();
      expect(formatRelativeTime(twoWeeksAgo)).toBe('2 недели назад');
      expect(formatRelativeTime(threeMonthsAgo)).toBe('3 месяца назад');
      expect(formatRelativeTime(lastYear)).toBe('в прошлом году');
    });
  });
});

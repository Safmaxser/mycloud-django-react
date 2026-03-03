import { describe, it, expect } from 'vitest';
import { cn, calculateUXDelay } from '../ui';

describe('ui', () => {
  describe('cn (Tailwind Merge)', () => {
    it('should merge classes correctly', () => {
      const result = cn('px-2 py-2', 'px-4');
      // twMerge должен оставить px-4, так как он идет позже и конфликтует с px-2
      expect(result).toBe('py-2 px-4');
    });

    it('should handle conditional classes', () => {
      const isActive = true;
      const isError = false;
      const result = cn('base', isActive && 'active', isError && 'error');
      expect(result).toBe('base active');
    });

    it('should return empty string if no arguments', () => {
      expect(cn()).toBe('');
    });
  });

  describe('calculateUXDelay', () => {
    it('should return minimum delay (500ms) for small files', () => {
      const smallFile = 1024;
      expect(calculateUXDelay(smallFile)).toBe(500);
    });

    it('should return maximum delay (3000ms) for very large files', () => {
      const largeFile = 500 * 1024 * 1024;
      expect(calculateUXDelay(largeFile)).toBe(3000);
    });

    it('should calculate proportional delay for medium files', () => {
      const mediumFile = 100 * 1024 * 1024;
      expect(calculateUXDelay(mediumFile)).toBe(1000);
    });

    it('should round the result', () => {
      const file = 75.6 * 1024 * 1024;
      expect(calculateUXDelay(file)).toBe(756);
    });
  });
});

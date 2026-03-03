import { describe, expect, it } from 'vitest';
import { getHashColor, getHashTextColor } from '../colors';

/**
 * Тестирование утилит генерации цветовых схем на основе хеширования строк.
 * Гарантирует визуальную стабильность интерфейса при работе с динамическими данными.
 */
describe('color', () => {
  const mockId = 'user-123';

  /** Проверка генерации пастельного фона (getHashColor) */
  describe('getHashColor', () => {
    it('should return a valid HSL string with specific pastel saturation and lightness', () => {
      const color = getHashColor(mockId);
      // Проверка формата: hsl(число, 45%, 92%)
      expect(color).toMatch(/^hsl\(\d+, 45%, 92%\)$/);
    });

    it('should be deterministic (same input always produces same background color)', () => {
      const color1 = getHashColor(mockId);
      const color2 = getHashColor(mockId);
      expect(color1).toBe(color2);
    });

    it('should produce different colors for different input strings', () => {
      const colorA = getHashColor('id-1');
      const colorB = getHashColor('id-2');
      expect(colorA).not.toBe(colorB);
    });
  });

  /** Проверка генерации контрастного текста (getHashTextColor) */
  describe('getHashTextColor', () => {
    it('should return a valid HSL string with dark contrast parameters', () => {
      const color = getHashTextColor(mockId);
      // Проверка формата: hsl(число, 60%, 40%)
      expect(color).toMatch(/^hsl\(\d+, 60%, 40%\)$/);
    });

    it('should use the same hue (H) as background color for visual harmony', () => {
      const bgColor = getHashColor(mockId);
      const textColor = getHashTextColor(mockId);
      const getHue = (hsl: string) => hsl.match(/\d+/)?.[0];
      expect(getHue(bgColor)).toBe(getHue(textColor));
    });
  });

  /** Проверка граничных случаев (Edge cases) */
  describe('edge cases', () => {
    it('should handle empty strings without crashing', () => {
      expect(() => getHashColor('')).not.toThrow();
      expect(getHashColor('')).toContain('hsl(');
    });

    it('should handle very long strings', () => {
      const longStr = 'a'.repeat(1000);
      expect(getHashColor(longStr)).toMatch(/^hsl\(\d+, 45%, 92%\)$/);
    });
  });
});

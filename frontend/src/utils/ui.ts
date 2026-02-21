import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Утилита для безопасного объединения Tailwind-классов с разрешением конфликтов. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Вычисляет время задержки (ms) перед скрытием индикатора загрузки для плавности интерфейса. */
export const calculateUXDelay = (sizeInBytes: number): number => {
  const fileSizeMb = sizeInBytes / (1024 * 1024);
  // Минимум 500мс, максимум 3с; пропорционально размеру файла
  return Math.min(3000, Math.max(500, Math.round(fileSizeMb * 10)));
};

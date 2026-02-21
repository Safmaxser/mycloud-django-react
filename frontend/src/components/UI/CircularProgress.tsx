import type { PropsWithChildren } from 'react';
import { cn } from '../../utils/ui';

export interface CircularProgressProps {
  progress: number;
  /** Размер в единицах Tailwind (по умолчанию 5) */
  size?: number;
  /** Толщина линии в пикселях */
  strokeWidth?: number;
  /** Tailwind-класс для цвета (например, 'text-blue-600') */
  colorClass?: string;
}

/**
 * Компонент радиального индикатора прогресса.
 * Выполняет динамический расчет параметров SVG-круга (радиус, длина окружности)
 * на основе переданного размера и текущего процента выполнения.
 */
export function CircularProgress({
  progress,
  size = 5,
  strokeWidth = 2,
  colorClass = 'text-blue-600',
  children,
}: PropsWithChildren<CircularProgressProps>) {
  // Расчет физических пикселей на основе rem для корректного отображения SVG
  const rootFontSize =
    typeof window !== 'undefined'
      ? parseFloat(getComputedStyle(document.documentElement).fontSize)
      : 16;
  const sizeСircle = size + 3;
  const pixelSize = sizeСircle * 0.25 * rootFontSize;
  const center = Math.round(pixelSize / 2);
  const radius = center - strokeWidth;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className={`relative flex h-${size} w-${size} items-center justify-center`}>
      <svg className={`absolute h-${sizeСircle} w-${sizeСircle} -rotate-90 transform`}>
        <circle
          cx={center}
          cy={center}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          className="text-gray-100"
        />
        <circle
          cx={center}
          cy={center}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={cn('transition-all duration-300 ease-out', colorClass)}
        />
      </svg>
      {children}
    </div>
  );
}

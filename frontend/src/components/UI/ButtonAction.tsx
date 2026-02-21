import type { ElementType, ComponentPropsWithoutRef } from 'react';
import { X, type LucideIcon } from 'lucide-react';

import { cn } from '../../utils/ui';
import { CircularProgress } from './CircularProgress';

interface ButtonActionProps<T extends ElementType = 'button'> {
  /** Компонент или HTML-тег для рендеринга (например, Link) */
  as?: T;
  icon: LucideIcon;
  iconLoading?: LucideIcon | null;
  /** Процент выполнения операции (0-100). Если задан — включается режим индикации. */
  progress?: number;
}

type PolymorphicButtonActionProps<T extends ElementType> = ButtonActionProps<T> &
  Omit<ComponentPropsWithoutRef<T>, keyof ButtonActionProps<T>>;

/**
 * Универсальная кнопка действия с поддержкой индикации прогресса.
 * Поддерживает полиморфный рендеринг, визуализацию состояний асинхронных операций
 * через CircularProgress и динамическую смену иконок.
 */
export function ButtonAction<T extends ElementType = 'button'>({
  as,
  icon: Icon,
  iconLoading: IconLoading,
  progress,
  className,
  ...props
}: PolymorphicButtonActionProps<T>) {
  const Component = as || 'button';
  const loading = progress !== undefined;

  return (
    <Component
      {...props}
      {...(Component === 'button' ? { type: 'button' } : {})}
      className={cn('btn-file-control relative no-underline', className)}
    >
      {loading ? (
        <CircularProgress progress={progress} size={5}>
          {IconLoading && progress === 100 ? (
            <IconLoading className="animate-slide-infinite h-5 w-5" />
          ) : (
            <>
              <Icon className="h-5 w-5" />
              <X className="absolute z-10 h-7 w-7 text-gray-400 opacity-0 transition-opacity duration-500 ease-in-out hover:opacity-100" />
            </>
          )}
        </CircularProgress>
      ) : (
        <Icon className="h-5 w-5" />
      )}
    </Component>
  );
}

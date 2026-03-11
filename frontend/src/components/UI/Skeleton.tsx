import { cn } from '../../utils/ui';

interface SkeletonProps {
  message?: string;
  className?: string;
}

/**
 * Компонент для визуальной индикации процесса загрузки контента.
 */
export function Skeleton({ message = 'Подготовка контента...', className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'absolute inset-0 z-20 flex min-h-60 flex-col items-center justify-center rounded-2xl bg-gray-50/80 backdrop-blur-sm',
        className,
      )}
    >
      <div className="flex flex-col items-center gap-4">
        <div className="h-12 w-12 shrink-0 animate-spin rounded-full border-4 border-blue-500/20 border-t-blue-500" />
      </div>
      {message && <p className="animate-pulse text-sm font-medium text-gray-400">{message}</p>}
    </div>
  );
}

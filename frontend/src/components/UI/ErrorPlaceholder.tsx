import { cn } from '../../utils/ui';
import type { FileItem } from '../../types/storage';
import { FileIcon } from './FileIcon';

interface ErrorPlaceholderProps {
  file: FileItem;
  message?: string;
  className?: string;
}

/**
 * Компонент для отображения критической ошибки визуализации контента.
 */
export function ErrorPlaceholder({
  file,
  message = 'Файл поврежден или недоступен',
  className,
}: ErrorPlaceholderProps) {
  return (
    <div
      className={cn(
        'animate-in fade-in zoom-in-95 flex flex-col items-center gap-6 py-20 duration-500',
        className,
      )}
    >
      <div className="relative">
        <div className="relative overflow-hidden rounded-full bg-red-50 p-8 ring-8 ring-red-50/30">
          <FileIcon file={file} className="h-16 w-16 opacity-20 grayscale" />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="select-none text-4xl font-black text-red-500/40">!</span>
          </div>
        </div>
        <div className="absolute -inset-4 -z-10 rounded-full bg-red-500/5 blur-2xl" />
      </div>
      <div className="flex flex-col items-center gap-2 px-6 text-center">
        <p className="max-w-60 text-sm font-black uppercase tracking-wider text-red-500/80">
          Ошибка загрузки
        </p>
        {message && (
          <p className="max-w-70 text-xs font-bold leading-relaxed text-gray-400">{message}</p>
        )}
      </div>
    </div>
  );
}

import { ChevronUp, ChevronDown, ArrowUpDown } from 'lucide-react';
import { cn } from '../../utils/ui';

interface SortHeaderProps {
  label: string;
  field: string | null;
  /** Текущий параметр сортировки (например, 'size' или '-size' для убывания) */
  currentOrdering: string;
  onSort: (nextOrdering: string) => void;
  className?: string;
}

/**
 * Интерактивный заголовок колонки таблицы.
 * Реализует переключение между прямой, обратной сортировкой и её сбросом.
 */
export function SortHeader({ label, field, currentOrdering, onSort, className }: SortHeaderProps) {
  const isAsc = currentOrdering === field;
  const isDesc = currentOrdering === `-${field}`;
  const isActive = isAsc || isDesc;

  /** Переключение направления сортировки или её сброс. */
  const handleToggle = () => {
    if (!field) return;
    let nextValue = '';
    if (currentOrdering === field) {
      nextValue = `-${field}`;
    } else if (currentOrdering === `-${field}`) {
      nextValue = '';
    } else {
      nextValue = field;
    }
    onSort(nextValue);
  };

  if (!field) {
    return (
      <div
        className={cn(
          'col-table-title group flex select-none items-center justify-center py-4 transition-colors',
          className,
        )}
      >
        <span>{label}</span>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      className={cn(
        'col-table-title group flex cursor-pointer select-none items-center justify-center gap-1.5 py-4 transition-colors',
        isActive ? 'text-blue-600' : 'text-gray-500 hover:text-gray-900',
        className,
      )}
    >
      <span>{label}</span>
      <div className="flex h-3 w-3 items-center justify-center">
        {isAsc && <ChevronDown className="animate-in zoom-in-50 h-3 w-3 duration-200" />}
        {isDesc && <ChevronUp className="animate-in zoom-in-50 h-3 w-3 duration-200" />}
        {!isActive && (
          <ArrowUpDown className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-30" />
        )}
      </div>
    </button>
  );
}

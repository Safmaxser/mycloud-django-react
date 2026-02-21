import { useEffect, useState } from 'react';
import { Search, X } from 'lucide-react';
import { useDebounce } from 'use-debounce';

import { cn } from '../../utils/ui';
import { FormInput } from './FormInput';

interface SearchInputProps {
  value: string;
  /** Функция вызова поиска (выполняется с задержкой 500мс) */
  onSearch: (value: string) => void;
  placeholder?: string;
}

/**
 * Интеллектуальное поле поиска.
 * Реализует механизм дебаунса (задержка 500мс) для минимизации нагрузки на API
 * и обеспечивает мгновенную очистку локального состояния.
 */
export function SearchInput({ value, onSearch, placeholder = 'Поиск...' }: SearchInputProps) {
  const [localValue, setLocalValue] = useState(value);
  const [debouncedValue, { cancel }] = useDebounce(localValue, 500);
  const isSearching = localValue.length > 0;

  // Очистка при размонтировании
  useEffect(() => {
    return () => {
      setLocalValue('');
      cancel();
    };
  }, [cancel]);

  // Синхронизация с внешним значением (например, при сбросе фильтров)
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // Вызов колбэка только при изменении дебаунс-значения
  useEffect(() => {
    if (debouncedValue !== value) {
      onSearch(debouncedValue);
    }
  }, [debouncedValue, value, onSearch]);

  return (
    <div className="relative flex w-full items-center gap-4">
      <FormInput
        icon={Search}
        placeholder={placeholder}
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        className={cn(
          'w-full rounded-xl border-2 py-2 pl-10 pr-10 text-sm outline-none transition-all focus:outline-none focus:ring-0',
          isSearching
            ? 'border-blue-300 bg-blue-200/30 shadow shadow-blue-500/50 focus:border-blue-500 focus:shadow focus:shadow-blue-500/50'
            : 'border-gray-100 bg-gray-50/50 focus:bg-white',
        )}
      />
      {localValue && (
        <button
          onClick={() => setLocalValue('')}
          className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer rounded-full p-1 text-gray-500 transition-colors hover:bg-blue-200"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

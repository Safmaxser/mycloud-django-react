import { cn } from '../../utils/ui';

interface SearchResultsInfoProps {
  search: string;
  count: number;
  className?: string;
}

/** Компонент для отображения активного поискового запроса и количества найденных результатов. */
export function SearchResultsInfo({ search, count, className }: SearchResultsInfoProps) {
  if (!search) return null;

  return (
    <div
      className={cn(
        'animate-in fade-in slide-in-from-left-4 right-70 absolute top-0 flex items-center gap-3 duration-300',
        className,
      )}
    >
      <span className="text-sm font-black uppercase tracking-widest text-gray-500">
        Результаты поиска
      </span>
      <div className="group flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50/50 px-3 py-0.5 transition-all hover:bg-blue-50">
        <span className="text-sm font-bold text-blue-600">"{search}"</span>
      </div>
      <span className="text-sm font-bold italic text-gray-400">Найдено: {count}</span>
    </div>
  );
}

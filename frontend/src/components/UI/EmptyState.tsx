import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description: string;
  icon: LucideIcon;
  /** Слот для дополнительной кнопки действия (например, 'Попробовать снова') */
  action?: ReactNode;
}

/** Универсальный компонент для отображения пустых состояний, результатов поиска или ошибок. */
export function EmptyState({ title, description, icon: Icon, action }: EmptyStateProps) {
  return (
    <div className="flex h-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-white text-center">
      <div className="mb-4 rounded-full bg-gray-50 p-6 text-gray-200">
        <Icon className="h-16 w-16" strokeWidth={1.5} />
      </div>
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      <p className="mt-2 text-gray-500">{description}</p>
      {action && <div className="mt-8 flex w-full justify-center">{action}</div>}
    </div>
  );
}

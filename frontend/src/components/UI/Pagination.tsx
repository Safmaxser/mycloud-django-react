import { ChevronLeft, ChevronRight } from 'lucide-react';

import { ButtonStandard } from './ButtonStandard';
import { PAGE_SIZE } from '../../constants/config';

interface PaginationProps {
  current: number;
  total: number;
  onChange: (page: number) => void;
}

/** Компонент навигации по страницам списка с расчетом общего количества и блокировкой границ. */
export function Pagination({ current, total, onChange }: PaginationProps) {
  const totalPages = Math.ceil(total / PAGE_SIZE);

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-4">
      <ButtonStandard
        type="button"
        disabled={current === 1}
        onClick={() => onChange(current - 1)}
        classNameIcon="transition-transform group-hover:-translate-x-0.5"
        className="btn-blue-light w-30 py-1"
        icon={ChevronLeft}
        label="Назад"
      />
      <span className="text-xs font-black uppercase tracking-widest text-gray-400">
        Страница {current} из {totalPages}
      </span>
      <ButtonStandard
        type="button"
        disabled={current === totalPages}
        onClick={() => onChange(current + 1)}
        classNameIcon="transition-transform group-hover:translate-x-0.5"
        className="btn-blue-light w-30 py-1"
        icon={ChevronRight}
        label="Вперёд"
        swap={true}
      />
    </div>
  );
}

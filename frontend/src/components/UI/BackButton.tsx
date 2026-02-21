import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

import { ROUTES } from '../../routes/paths';
import { cn } from '../../utils/ui';

interface BackButtonProps {
  to?: string;
  label?: string;
  className?: string;
}

/** Кнопка возврата с настраиваемым маршрутом и текстовой меткой. */
export function BackButton({
  to = ROUTES.HOME,
  label = 'Назад на главную',
  className,
}: BackButtonProps) {
  return (
    <Link to={to} className={cn('link-standard', className)}>
      <ArrowLeft className="h-4 w-4" />
      {label}
    </Link>
  );
}

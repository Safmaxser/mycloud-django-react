import type { ElementType, ComponentPropsWithoutRef } from 'react';
import { Loader2, type LucideIcon } from 'lucide-react';

import { cn } from '../../utils/ui';

interface ButtonStandardProps<T extends ElementType = 'button'> {
  /** Компонент или HTML-тег для рендеринга (например, Link или 'button') */
  as?: T;
  /** Состояние загрузки: активирует спиннер и блокирует нажатия */
  loading?: boolean;
  icon?: LucideIcon | null;
  label?: string;
  /** Текст, заменяющий основной label в процессе загрузки */
  loadingLabel?: string | null;
  classNameIcon?: string | null;
  /** Если true — иконка отображается после текста */
  swap?: boolean;
}

type PolymorphicButtonStandardProps<T extends ElementType> = ButtonStandardProps<T> &
  Omit<ComponentPropsWithoutRef<T>, keyof ButtonStandardProps<T>>;

/**
 * Универсальная полиморфная кнопка приложения.
 * Поддерживает состояния загрузки, гибкое позиционирование иконок (swap),
 * автоматическую блокировку и корректную типизацию для различных HTML-тегов.
 */
export function ButtonStandard<T extends ElementType = 'button'>({
  as,
  loading,
  icon: Icon,
  label,
  loadingLabel,
  classNameIcon,
  swap = false,
  className,
  ...props
}: PolymorphicButtonStandardProps<T>) {
  const Component = as || 'button';
  const isDisabled = loading || (props as ComponentPropsWithoutRef<'button'>).disabled;

  const labelIconLoading = swap ? (
    <>
      {loadingLabel ? <span>{loadingLabel}</span> : <span>{label}</span>}
      <Loader2 className="h-4 w-4 animate-spin" />
    </>
  ) : (
    <>
      <Loader2 className="h-4 w-4 animate-spin" />
      {loadingLabel ? <span>{loadingLabel}</span> : <span>{label}</span>}
    </>
  );

  const labelIcon = swap ? (
    <>
      <span>{label}</span>
      {Icon && <Icon className={cn('h-4 w-4', classNameIcon)} />}
    </>
  ) : (
    <>
      {Icon && <Icon className={cn('h-4 w-4', classNameIcon)} />}
      <span>{label}</span>
    </>
  );

  return (
    <Component
      {...(Component === 'button' ? { disabled: isDisabled } : {})}
      {...props}
      className={cn(
        'btn-standard btn-small btn-blue group inline-flex items-center justify-center gap-2',
        className,
      )}
    >
      {loading ? <>{labelIconLoading}</> : <>{labelIcon}</>}
    </Component>
  );
}

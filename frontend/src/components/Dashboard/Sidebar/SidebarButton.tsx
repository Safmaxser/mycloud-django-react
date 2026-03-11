import type { ElementType, ComponentPropsWithoutRef } from 'react';
import { NavLink, type NavLinkProps, type NavLinkRenderProps } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';

import { cn } from '../../../utils/ui';

interface SidebarButtonProps<T extends ElementType = 'button'> {
  /** Компонент или HTML-тег для рендеринга (например, NavLink или 'div') */
  as?: T;
  icon: LucideIcon;
  label: string;
}

type PolymorphicSidebarButtonProps<T extends ElementType> = SidebarButtonProps<T> &
  Omit<ComponentPropsWithoutRef<T>, keyof SidebarButtonProps<T>>;

/**
 * Универсальная кнопка навигации для боковой панели.
 * Поддерживает рендеринг как обычной кнопки, так и NavLink с автоматической
 * подсветкой активного состояния и объединением Tailwind-классов.
 */
export function SidebarButton<T extends ElementType = 'button'>({
  as,
  icon: Icon,
  label,
  className,
  ...props
}: PolymorphicSidebarButtonProps<T>) {
  const Component = as || 'button';

  // Специальная обработка для NavLink (react-router-dom) для работы с isActive
  if ((as as unknown) === NavLink) {
    const navLinkProps = props as unknown as NavLinkProps;
    return (
      <NavLink
        {...navLinkProps}
        className={(renderProps: NavLinkRenderProps) =>
          cn(
            'btn-sidebar',
            renderProps.isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50',
            typeof className === 'function' ? className(renderProps) : className,
          )
        }
      >
        <Icon className="h-5 w-5 shrink-0" />
        <span className="hidden lg:block">{label}</span>
      </NavLink>
    );
  }

  return (
    <Component
      {...props}
      {...(Component === 'button' ? { type: 'button' } : {})}
      className={cn(
        'btn-sidebar text-red-600 hover:bg-red-50',
        typeof className === 'string' ? className : '',
      )}
    >
      <Icon className="h-5 w-5 shrink-0" />
      <span className="hidden lg:block">{label}</span>
    </Component>
  );
}

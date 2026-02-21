import { UserIcon } from 'lucide-react';

import { cn } from '../../utils/ui';
import { getHashColor, getHashTextColor } from '../../utils/colors';
import type { User } from '../../types/user';

interface UserAvatarProps {
  /** Данные пользователя. Если null — отображается скелетон. */
  user?: User | null;
  /** Выбор фиксированного размера иконки и шрифта (sm, md или lg). */
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * Компонент аватара пользователя.
 * Генерирует уникальный фоновый цвет и цвет текста на основе ID пользователя.
 * Отображает инициал имени или заглушку в виде иконки при отсутствии данных.
 */
export function UserAvatar({ user, size = 'md', className }: UserAvatarProps) {
  const sizeClasses = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-12 w-12 text-base',
    lg: 'h-20 w-20 text-2xl',
  };

  // Состояние загрузки или отсутствия пользователя (Skeleton)
  if (!user) {
    return (
      <div
        className={cn(
          'flex shrink-0 animate-pulse items-center justify-center rounded-full border border-gray-100 bg-gray-200 text-gray-500 shadow-inner',
          sizeClasses[size],
          className,
        )}
      >
        <UserIcon className={size === 'lg' ? 'h-10 w-10' : 'h-1/2 w-1/2'} strokeWidth={2} />
      </div>
    );
  }

  const bgColor = getHashColor(user.id);
  const textColor = getHashTextColor(user.id);
  const initial = user.full_name?.charAt(0) || user.username.charAt(0).toUpperCase();

  return (
    <div
      style={{
        backgroundColor: bgColor,
        color: textColor,
        borderColor: `${textColor}20`, // Прозрачная граница в тон текста
      }}
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full border font-bold shadow-sm',
        sizeClasses[size],
        className,
      )}
    >
      {initial}
    </div>
  );
}

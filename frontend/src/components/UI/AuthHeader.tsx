import type { LucideIcon } from 'lucide-react';

interface AuthHeaderProps {
  icon: LucideIcon;
  title: string;
  subtitle: string;
}

/** Универсальный заголовок для форм авторизации, регистрации и восстановления доступа. */
export function AuthHeader({ icon: Icon, title, subtitle }: AuthHeaderProps) {
  return (
    <div className="mb-8 flex flex-col items-center">
      <div className="mb-4 rounded-full bg-blue-100 p-3">
        <Icon className="h-8 w-8 text-blue-600" />
      </div>
      <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
      <p className="text-sm text-gray-500">{subtitle}</p>
    </div>
  );
}

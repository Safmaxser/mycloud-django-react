import type { LucideIcon } from 'lucide-react';

interface AuthHeaderProps {
  icon: LucideIcon;
  title: string;
  subtitle: string;
}

/** Универсальный заголовок для форм авторизации, регистрации и восстановления доступа. */
export function AuthHeader({ icon: Icon, title, subtitle }: AuthHeaderProps) {
  return (
    <div className="flex flex-col items-center">
      <div className="flex flex-col items-center gap-0 landscape:flex-row landscape:gap-2 landscape:lg:flex-col landscape:lg:gap-0">
        <div className="mb-4 rounded-full bg-blue-100 p-3 landscape:mb-2 landscape:lg:mb-4">
          <Icon className="h-8 w-8 text-blue-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
      </div>
      <p className="text-sm text-gray-500">{subtitle}</p>
    </div>
  );
}

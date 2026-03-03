import type { PropsWithChildren } from 'react';

import { Sidebar } from '../Dashboard/Sidebar/Sidebar';
import { UserMenu } from '../Dashboard/Header/UserMenu';

interface MainLayoutProps {
  /** Контент левой части хедера (заголовки, кнопки действий) */
  headerContent?: React.ReactNode;
  /** Поле поиска, адаптированное под конкретный раздел (файлы/пользователи) */
  searchInput?: React.ReactNode;
}

/**
 * Основной макет внутреннего интерфейса приложения.
 * Обеспечивает единую структуру с боковой панелью (Sidebar),
 * фиксированным хедером и прокручиваемой областью контента.
 */
export function MainLayout({
  headerContent,
  searchInput,
  children,
}: PropsWithChildren<MainLayoutProps>) {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="relative flex flex-1 flex-col overflow-hidden bg-white">
        <header className="h-18 relative flex shrink-0 items-center justify-between gap-6 border-b border-gray-200 bg-white px-8">
          <div className="flex flex-1 items-center gap-6">{headerContent}</div>
          <div className="flex w-full max-w-2xl items-center gap-4">
            {searchInput}
            <div className="mx-2 h-8 w-px bg-gray-100" />
            <UserMenu />
          </div>
        </header>
        <main className="flex-1 overflow-y-auto bg-gray-50/30 p-1">{children}</main>
      </div>
    </div>
  );
}

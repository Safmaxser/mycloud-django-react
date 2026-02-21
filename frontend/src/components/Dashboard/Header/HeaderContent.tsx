import { Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

import { ROUTES } from '../../../routes/paths';
import { FileUpload } from './FileUpload';
import { OtherUser } from './OtherUser';

export interface HeaderContentProps {
  /** ID пользователя для админ-режима. Если undefined — загружаются личные файлы. */
  userId: string | undefined;
}

/**
 * Контроллер содержимого верхней панели (Header).
 * Переключает интерфейс между формой загрузки файлов (для владельца)
 * и навигацией с информацией о пользователе (для администратора).
 */
export function HeaderContent({ userId }: HeaderContentProps) {
  const isAdminView = Boolean(userId);

  return (
    <>
      {isAdminView ? (
        <>
          <div className="flex flex-1 items-center justify-between gap-4">
            <Link
              to={ROUTES.ADMIN}
              className="flex items-center gap-1 text-sm font-bold text-blue-600 transition-colors hover:text-blue-700"
            >
              <ChevronLeft className="h-4 w-4" />
              Назад к пользователям
            </Link>
            <OtherUser userId={userId} />
          </div>
        </>
      ) : (
        <FileUpload />
      )}
    </>
  );
}

import { useEffect } from 'react';
import {
  AlertCircle,
  Database,
  Files,
  HardDrive,
  Loader2,
  ShieldAlert,
  UserCog,
} from 'lucide-react';

import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { fetchUsers } from '../../../store/slices/adminSlice';
import { formatBytes } from '../../../utils/formatters';

export interface OtherUserProps {
  /** ID пользователя для админ-режима. Если undefined — компонент скрыт. */
  userId: string | undefined;
}

/**
 * Информационная панель текущего просматриваемого пользователя в режиме администратора.
 * Отображает имя, логин и статистику хранилища (объем и количество файлов)
 * выбранного пользователя, выделяя интерфейс специальным стилем.
 */
export function OtherUser({ userId }: OtherUserProps) {
  const dispatch = useAppDispatch();
  const { loading } = useAppSelector((state) => state.storage);
  const { users } = useAppSelector((state) => state.admin);

  const isAdminView = Boolean(userId);
  const targetUser = isAdminView ? users.find((u) => u.id === userId) : null;

  // Автоматическая загрузка списка пользователей, если данные отсутствуют
  useEffect(() => {
    if (isAdminView && users.length === 0 && !loading) {
      dispatch(fetchUsers());
    }
  }, [isAdminView, users.length, loading, dispatch]);

  if (!isAdminView) return null;

  return (
    <div className="flex flex-1 items-center justify-between gap-1 rounded-2xl border-2 border-blue-300 bg-blue-100/50 px-2 py-0 text-base font-medium text-gray-700 shadow shadow-blue-400 lg:px-4 lg:py-1">
      {targetUser ? (
        <>
          <div className="hidden items-center gap-2 lg:flex">
            <ShieldAlert className="h-6 w-6 animate-pulse text-red-400" />
            <Database className="h-6 w-6" />
          </div>
          <div className="mx-2 hidden h-8 w-px bg-blue-200 lg:block" />
          <div className="flex items-center gap-2">
            <UserCog className="h-5 w-5 lg:h-6 lg:w-6" />
            {`${targetUser.full_name} (${targetUser.username})`}
          </div>
          <div className="mx-2 h-8 w-px bg-blue-200" />
          <div className="flex flex-col items-center gap-0 lg:flex-row lg:gap-1">
            <div className="flex items-center gap-2">
              <HardDrive className="h-3 w-3 lg:h-6 lg:w-6" />
              <span className="whitespace-nowrap text-xs lg:text-base">
                {formatBytes(targetUser.files_total_size)}
              </span>
            </div>
            <div className="mx-2 hidden h-8 w-px bg-blue-200 lg:block" />
            <div className="flex items-center gap-2">
              <Files className="h-3 w-3 lg:h-6 lg:w-6" />
              <span className="text-xs lg:text-base">{targetUser.files_count}</span>
            </div>
          </div>
        </>
      ) : (
        <div className="mx-auto flex items-center gap-2 text-xs lg:text-base">
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Загрузка</span>
              <span className="hidden lg:block">данных пользователя</span>
              <span>...</span>
            </>
          ) : (
            <>
              <AlertCircle className="h-4 w-4" />
              <span>Пользователь не найден</span>
            </>
          )}
        </div>
      )}
    </div>
  );
}

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
    <div className="flex flex-1 items-center justify-between gap-1 rounded-2xl border-2 border-blue-300 bg-blue-100/50 px-4 py-1 text-base font-medium text-gray-700 shadow shadow-blue-400">
      {targetUser ? (
        <>
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-6 w-6 animate-pulse text-red-400" />
            <Database className="h-6 w-6" />
          </div>
          <div className="mx-2 h-8 w-px bg-blue-200" />
          <div className="flex items-center gap-2">
            <UserCog className="h-6 w-6" />
            {`${targetUser.full_name} (${targetUser.username})`}
          </div>
          <div className="mx-2 h-8 w-px bg-blue-200" />
          <div className="flex items-center gap-2">
            <HardDrive className="h-6 w-6" />
            {formatBytes(targetUser.files_total_size)}
          </div>
          <div className="mx-2 h-8 w-px bg-blue-200" />
          <div className="flex items-center gap-2">
            <Files className="h-6 w-6" />
            {targetUser.files_count}
          </div>
        </>
      ) : (
        <div className="mx-auto flex items-center gap-2">
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Загрузка данных пользователя...</span>
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

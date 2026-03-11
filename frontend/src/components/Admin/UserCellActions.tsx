import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Trash2, ShieldAlert, FolderOpen, User as UserIcon, UserPen } from 'lucide-react';

import { useAppDispatch } from '../../store/hooks';
import { deleteUser, updateUser } from '../../store/slices/adminSlice';

import { getAdminFilesPath } from '../../routes/paths';
import type { User } from '../../types/user';

import { ConfirmModal } from '../Modals/ConfirmModal';
import { ProfileEditModal } from '../Modals/ProfileEditModal';
import { ButtonAction } from '../UI/ButtonAction';

interface UserCellActionsProps {
  user: User;
}

/**
 * Ячейка действий над пользователем.
 * Реализует функции перехода к файлам пользователя, редактирования профиля,
 * изменения прав администратора (is_staff) и безвозвратного удаления аккаунта.
 */
export function UserCellActions({ user }: UserCellActionsProps) {
  const dispatch = useAppDispatch();
  const [userDeleted, setUserDeleted] = useState<User | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);

  /** Удаление пользователя после подтверждения в модальном окне. */
  const handleDeleteConfirm = async () => {
    if (userDeleted) {
      await dispatch(deleteUser(userDeleted.id)).unwrap();
      setUserDeleted(null);
    }
  };

  /** Переключение статуса администратора (is_staff). */
  const handleToggleAdmin = (id: string, status: boolean) => {
    dispatch(updateUser({ id, userData: { is_staff: !status } }));
  };

  return (
    <div className="col-table justify-end">
      <div className="flex h-9 items-center justify-end gap-1 opacity-100 transition-all duration-200 group-hover:flex group-hover:opacity-100 lg:hidden lg:opacity-0">
        <ButtonAction
          as={Link}
          to={getAdminFilesPath(user.id)}
          className="bg-blue-100 text-blue-600 lg:bg-transparent lg:text-gray-400 lg:hover:text-blue-600"
          title="Просмотреть файлы"
          icon={FolderOpen}
        />
        <ButtonAction
          onClick={() => setIsEditOpen(true)}
          className="bg-green-100 text-green-600 lg:bg-transparent lg:text-gray-400 lg:hover:text-green-600"
          title="Изменить профиль"
          icon={UserPen}
        />
        <ButtonAction
          onClick={() => handleToggleAdmin(user.id, user.is_staff)}
          className="bg-purple-100 text-purple-600 lg:bg-transparent lg:text-gray-400 lg:hover:text-purple-600"
          title="Настроить права"
          icon={ShieldAlert}
        />
        <ButtonAction
          onClick={() => setUserDeleted(user)}
          className="bg-red-100 text-red-600 lg:bg-transparent lg:text-gray-400 lg:hover:text-red-600"
          title="Удалить аккаунт"
          icon={Trash2}
        />
      </div>
      <div className="hidden justify-end lg:flex lg:group-hover:hidden">
        <UserIcon className="h-5 w-5 text-gray-200" />
      </div>
      <ConfirmModal
        isOpen={Boolean(userDeleted)}
        onClose={() => setUserDeleted(null)}
        onConfirm={handleDeleteConfirm}
        title={`Удалить аккаунт пользователя: ${userDeleted?.username}?`}
        message="Это действие нельзя будет отменить. Аккаунт пользователя и все его файлы будут удалены безвозвратно."
      />
      {isEditOpen && <ProfileEditModal userId={user.id} onClose={() => setIsEditOpen(false)} />}
    </div>
  );
}

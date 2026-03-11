import { useState, useEffect, useRef } from 'react';
import { User, Mail, ShieldCheck, Key, Save, IdCard, type LucideIcon } from 'lucide-react';
import { toast } from 'react-toastify';

import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { deleteMe, updateMe } from '../../store/slices/authSlice';
import { updateUser } from '../../store/slices/adminSlice';

import { updateSchema, type UpdateFormValues } from '../../utils/validation';
import type { Abortable } from '../../types/common';

import { BaseModal } from './BaseModal';
import { ConfirmModal } from './ConfirmModal';
import { DangerZone } from './DangerZone';
import { FormInput } from '../UI/FormInput';
import { ButtonStandard } from '../UI/ButtonStandard';

interface ProfileField {
  id: keyof UpdateFormValues;
  label: string;
  icon: LucideIcon | null;
  type: string;
  prefix?: string;
  placeholder?: string;
  autoComplete?: string;
}

const PROFILE_FIELDS: readonly ProfileField[] = [
  {
    id: 'username',
    label: 'Логин',
    icon: User,
    type: 'text',
    prefix: '@',
    autoComplete: 'username',
  },
  { id: 'email', label: 'Почта', icon: Mail, type: 'email', autoComplete: 'email' },
  { id: 'full_name', label: 'Полное имя', icon: IdCard, type: 'text', autoComplete: 'name' },
  {
    id: 'password',
    label: 'Новый пароль',
    icon: Key,
    type: 'password',
    placeholder: 'Оставьте пустым...',
    autoComplete: 'new-password',
  },
] as const;

type LocalFormValues = UpdateFormValues & { is_staff?: boolean };

interface ProfileEditModalProps {
  /** ID пользователя для редактирования в режиме администратора. */
  userId?: string;
  onClose: () => void;
}

/**
 * Универсальное модальное окно редактирования профиля.
 * Поддерживает два режима: личные настройки пользователя и управление
 * аккаунтом другого пользователя через панель администратора.
 */
export function ProfileEditModal({ userId, onClose }: ProfileEditModalProps) {
  const dispatch = useAppDispatch();

  // Выбор целевого пользователя в зависимости от режима (Admin/Self)
  const authUser = useAppSelector((state) => state.auth.user);
  const adminUser = useAppSelector((state) => state.admin.users.find((u) => u.id === userId));

  const isAdminMode = Boolean(userId);
  const user = isAdminMode ? adminUser : authUser;

  const { isUpdating } = useAppSelector((state) => state.auth);
  const [formData, setFormData] = useState<LocalFormValues>({
    username: user?.username || '',
    email: user?.email || '',
    full_name: user?.full_name || '',
    password: '',
    is_staff: user?.is_staff || false,
  });
  const [errors, setErrors] = useState<Partial<Record<keyof UpdateFormValues, string>>>({});
  const [isConfirmDelete, setConfirmDelete] = useState<boolean>(false);
  const savePromiseRef = useRef<Abortable | null>(null);
  const deletePromiseRef = useRef<Abortable | null>(null);

  const title = isAdminMode ? 'Редактирование пользователя' : 'Мой профиль';

  // Логика отслеживания изменений для активации кнопки сохранения
  const isBaseChanged =
    formData.username !== user?.username ||
    formData.email !== user?.email ||
    formData.full_name !== user?.full_name ||
    formData.password !== '';
  const isRoleChanged = isAdminMode && formData.is_staff !== user?.is_staff;
  const isChanged = isBaseChanged || isRoleChanged;

  /** Валидация и отправка обновленных данных на сервер. */
  const handleSave = async () => {
    const result = updateSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof UpdateFormValues, string>> = {};
      result.error.issues.forEach((issue) => {
        const path = issue.path[0] as keyof UpdateFormValues;
        fieldErrors[path] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }
    try {
      setErrors({});
      let promise;
      if (isAdminMode && userId) {
        promise = dispatch(updateUser({ id: userId, userData: formData }));
      } else {
        promise = dispatch(updateMe(formData));
      }
      savePromiseRef.current = promise;
      await promise.unwrap();
      toast.success(isAdminMode ? 'Данные обновлены' : 'Профиль обновлён');
      onClose();
    } catch (error) {
      if (error) toast.error(error as string);
    } finally {
      savePromiseRef.current = null;
    }
  };

  /** Полное удаление собственного аккаунта. */
  const handleDeleteConfirm = async () => {
    try {
      const promise = dispatch(deleteMe());
      deletePromiseRef.current = promise;
      await promise.unwrap();
      toast.success('Профиль удалён');
    } catch (error) {
      if (error) toast.error(error as string);
    } finally {
      deletePromiseRef.current = null;
    }
  };

  // Очистка активных запросов при закрытии окна
  useEffect(() => {
    return () => {
      savePromiseRef.current?.abort();
      deletePromiseRef.current?.abort();
    };
  }, []);

  return (
    <BaseModal
      className="max-w-lg gap-6 p-8 landscape:max-w-3xl landscape:gap-4 landscape:p-6 landscape:lg:max-w-lg landscape:lg:gap-6 landscape:lg:p-8"
      onClose={onClose}
    >
      <div className="flex flex-col items-center text-gray-700">
        <h3 className="text-4xl font-black tracking-tight">Настройки</h3>
        <p className="text-sm font-black tracking-[0.2em] text-gray-400">{title}</p>
      </div>

      <div className="grid grid-cols-1 gap-x-4 gap-y-6 landscape:grid-cols-2 landscape:lg:grid-cols-1">
        {user?.is_staff && (
          <div className="col-span-1 flex items-center justify-center gap-2 rounded-2xl border border-orange-100/50 bg-orange-50 px-4 py-2.5 text-orange-600 landscape:col-span-2 landscape:lg:col-span-1">
            <ShieldCheck className="h-5 w-5" />
            <span className="text-xs font-black uppercase tracking-widest">Администратор</span>
          </div>
        )}
        {PROFILE_FIELDS.filter((field) => !(isAdminMode && field.id === 'password')).map(
          (field) => (
            <FormInput
              key={field.id}
              label={field.label}
              icon={field.icon}
              type={field.type}
              autoComplete={field.autoComplete}
              placeholder={field.placeholder}
              value={formData[field.id]}
              error={errors[field.id]}
              onChange={(e) => setFormData({ ...formData, [field.id]: e.target.value })}
            />
          ),
        )}
        {isAdminMode && (
          <div className="flex items-center gap-3 rounded-2xl bg-blue-50/50 p-4 ring-1 ring-blue-100">
            <input
              id="is_staff_checkbox"
              type="checkbox"
              checked={formData.is_staff}
              onChange={(e) => setFormData({ ...formData, is_staff: e.target.checked })}
              className="h-5 w-5 cursor-pointer rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="is_staff_checkbox" className="cursor-pointer">
              <span className="block text-sm font-black text-blue-900">Права администратора</span>
              <span className="block text-[0.7rem] text-blue-400 landscape:text-[0.5rem] landscape:lg:text-[0.7rem]">
                Разрешить управление другими пользователями
              </span>
            </label>
          </div>
        )}
      </div>

      <div className="flex w-full flex-col gap-2 landscape:flex-row landscape:lg:flex-col">
        <ButtonStandard
          disabled={!isChanged || isUpdating}
          className="w-full"
          onClick={handleSave}
          loading={isUpdating}
          icon={Save}
          label="Обновить данные"
        />
        <button onClick={onClose} className="btn-non-priority w-full">
          Отмена
        </button>
      </div>

      {!isAdminMode && !user?.is_staff && (
        <>
          <DangerZone
            title="Удаление всех данных"
            description="Ваш профиль и все загруженные файлы будут стерты без возможности восстановления."
            buttonText="Удалить аккаунт навсегда"
            onDelete={() => setConfirmDelete(true)}
          />
          <ConfirmModal
            isOpen={isConfirmDelete}
            onClose={() => setConfirmDelete(false)}
            onConfirm={handleDeleteConfirm}
            title="Удалить аккаунт?"
            message="Это действие нельзя будет отменить. Ваш аккаунт и все его файлы будут удалены безвозвратно."
          />
        </>
      )}
    </BaseModal>
  );
}

import { AlertTriangle, Trash2 } from 'lucide-react';

import { BaseModal } from './BaseModal';
import { ButtonStandard } from '../UI/ButtonStandard';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  isLoading?: boolean;
}

/**
 * Модальное окно подтверждения деструктивных операций.
 * Обеспечивает защиту от случайного удаления данных, требуя от пользователя
 * осознанного действия перед выполнением асинхронного запроса.
 */
export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  isLoading,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <BaseModal onClose={onClose} className="max-w-sm">
      <div className="flex flex-col">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-500">
          <AlertTriangle className="h-8 w-8" />
        </div>
        <h3 className="mb-2 text-xl font-black tracking-tight text-gray-900">{title}</h3>
        <p className="mb-8 text-sm font-medium leading-relaxed text-gray-500">{message}</p>
        <div className="flex flex-col gap-3">
          <ButtonStandard
            onClick={onConfirm}
            loading={isLoading}
            loadingLabel="Удаление..."
            icon={Trash2}
            label="Да, удалить"
            className="bg-red-600 shadow-red-100 hover:bg-red-700"
          />
          <button
            onClick={onClose}
            disabled={isLoading}
            className="btn-non-priority disabled:opacity-30"
          >
            Отмена
          </button>
        </div>
      </div>
    </BaseModal>
  );
}

import { File as FileIcon, Upload } from 'lucide-react';

import { formatBytes } from '../../utils/formatters';
import { BaseModal } from './BaseModal';
import { FormTextArea } from '../UI/FormTextArea';
import { ButtonStandard } from '../UI/ButtonStandard';

interface UploadConfirmModalProps {
  file: File;
  comment: string;
  onCommentChange: (val: string) => void;
  onConfirm: () => void;
  onClose: () => void;
}

/**
 * Модальное окно подтверждения загрузки файла.
 * Позволяет пользователю проверить метаданные выбранного объекта (имя, размер)
 * и добавить опциональное текстовое описание перед отправкой на сервер.
 */
export function UploadConfirmModal({
  file,
  comment,
  onCommentChange,
  onConfirm,
  onClose,
}: UploadConfirmModalProps) {
  return (
    <BaseModal onClose={onClose}>
      <div className="mb-6 flex items-center justify-between">
        <h3 className="text-xl font-black tracking-tight text-gray-700">Подтверждение</h3>
      </div>
      <div className="mb-6 flex items-center gap-3 rounded-2xl border border-blue-100 bg-blue-50/50 p-4">
        <div className="rounded-lg bg-blue-100 p-2 text-blue-600">
          <FileIcon className="h-5 w-5" />
        </div>
        <div className="flex min-w-0 flex-col">
          <span className="truncate text-sm font-bold text-blue-900">{file.name}</span>
          <span className="text-xs font-black uppercase tracking-wider text-blue-400">
            {formatBytes(file.size)}
          </span>
        </div>
      </div>
      <div className="mb-8 text-gray-900">
        <FormTextArea
          autoFocus
          label="Комментарий"
          value={comment}
          onChange={(e) => onCommentChange(e.target.value)}
          placeholder="Добавьте описание..."
        />
      </div>
      <div className="flex flex-col gap-3">
        <ButtonStandard
          onClick={onConfirm}
          icon={Upload}
          label="Начать загрузку"
          classNameIcon="transition-transform group-hover:-translate-y-0.5"
        />
        <button onClick={onClose} className="btn-non-priority">
          Отмена
        </button>
      </div>
    </BaseModal>
  );
}

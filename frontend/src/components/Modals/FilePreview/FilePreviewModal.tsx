import { useState } from 'react';
import { Download, HardDrive, Calendar, Save } from 'lucide-react';
import { toast } from 'react-toastify';

import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { updateFile } from '../../../store/slices/storageSlice';

import { formatBytes, formatDate } from '../../../utils/formatters';
import { calculateUXDelay } from '../../../utils/ui';
import type { FileItem } from '../../../types/storage';

import { BaseModal } from '../BaseModal';
import { FilePreviewContent } from './FilePreviewContent';
import { FormTextArea } from '../../UI/FormTextArea';
import { ButtonStandard } from '../../UI/ButtonStandard';
import { FormInput } from '../../UI/FormInput';
import { FileIcon } from '../../UI/FileIcon';

interface FilePreviewModalProps {
  file: FileItem;
  url: string;
  onClose: () => void;
}

/**
 * Модальное окно предпросмотра и редактирования файла.
 * Обеспечивает отображение содержимого (через Blob URL), просмотр метаданных,
 * изменение названия/комментария и мгновенное скачивание из памяти браузера.
 */
export function FilePreviewModal({ file: initialFile, url, onClose }: FilePreviewModalProps) {
  const dispatch = useAppDispatch();
  const file = useAppSelector(
    (state) => state.storage.files.find((f) => f.id === initialFile.id) || initialFile,
  );
  const [newName, setNewName] = useState(file.original_name);
  const [newComment, setNewComment] = useState(file.comment || '');
  const [isSaving, setIsSaving] = useState(false);

  const isChanged = newName !== file.original_name || newComment !== (file.comment || '');

  /** Сохранение обновленных метаданных файла на сервере. */
  const handleSave = async () => {
    try {
      await dispatch(
        updateFile({
          id: file.id,
          original_name: newName.trim(),
          comment: newComment.trim(),
        }),
      ).unwrap();
      toast.success('Изменения сохранены');
    } catch (error) {
      if (error) toast.error(error as string);
    }
  };

  /** Скачивание файла напрямую из Blob-ссылки в памяти без повторного запроса к API. */
  const handleDownloadFromMemory = async () => {
    setIsSaving(true);
    try {
      const link = document.createElement('a');
      link.href = url;
      link.download = file.original_name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      // Искусственная задержка для плавности UX индикатора загрузки
      await new Promise((resolve) => setTimeout(resolve, calculateUXDelay(file.size)));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <BaseModal className="max-w-6xl p-0" onClose={onClose}>
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-gray-100 bg-white/80 p-5 backdrop-blur-md">
        <div className="rounded-xl bg-blue-50 p-2 text-blue-600">
          <FileIcon file={file} className="h-5 w-5" />
        </div>
        <div className="flex min-w-0 flex-col">
          <h3 className="max-w-xs truncate text-base font-bold text-gray-900 sm:max-w-md">
            {file.original_name}
          </h3>
        </div>
      </header>
      <div className="flex h-full max-h-[85vh] flex-col overflow-hidden md:flex-row">
        <div className="flex flex-1 items-center justify-center overflow-y-auto bg-gray-900/5 p-4 sm:p-8">
          <FilePreviewContent file={file} url={url} />
        </div>
        <aside className="md:w-90 w-full shrink-0 overflow-y-auto border-l border-gray-100 bg-gray-50/50 p-6">
          <div className="space-y-5">
            <FormInput
              label="Имя файла"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
            <FormTextArea
              label="Комментарий"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Добавьте описание..."
            />
            <ButtonStandard
              disabled={!isChanged}
              onClick={handleSave}
              className="btn-green w-full"
              icon={Save}
              label="Сохранить"
            />
            <div className="flex items-start gap-3 border-t border-gray-100 pt-4">
              <HardDrive className="mt-0.5 h-4 w-4 text-blue-500" strokeWidth={2.5} />
              <div className="flex flex-col gap-1">
                <span className="text-sm font-bold text-gray-500">Размер</span>
                <span className="text-sm font-black text-gray-600">{formatBytes(file.size)}</span>
              </div>
            </div>
            <div className="mb-10 flex items-start gap-3">
              <Calendar className="mt-0.5 h-4 w-4 text-purple-500" strokeWidth={2.5} />
              <div className="flex flex-col gap-1">
                <span className="text-sm font-bold text-gray-500">Загружен</span>
                <span className="text-sm font-black text-gray-600">
                  {formatDate(file.created_at)}
                </span>
              </div>
            </div>
          </div>
          <ButtonStandard
            disabled={isSaving}
            onClick={handleDownloadFromMemory}
            className="w-full"
            classNameIcon="transition-transform group-hover:translate-y-0.5"
            icon={Download}
            label="Скачать"
            loading={isSaving}
            loadingLabel="Подготовка..."
          />
        </aside>
      </div>
    </BaseModal>
  );
}

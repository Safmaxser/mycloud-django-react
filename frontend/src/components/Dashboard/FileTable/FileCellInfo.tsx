import { useState, type KeyboardEvent } from 'react';
import { toast } from 'react-toastify';

import { useAppDispatch } from '../../../store/hooks';
import { updateFile } from '../../../store/slices/storageSlice';
import { cn } from '../../../utils/ui';
import type { FileItem } from '../../../types/storage';

import { FileIcon } from '../../UI/FileIcon';
import { FormTextArea } from '../../UI/FormTextArea';
import { FormInput } from '../../UI/FormInput';

interface FileCellInfoProps {
  file: FileItem;
}

/**
 * Ячейка основной информации о файле.
 * Реализует логику inline-редактирования названия и комментария по двойному клику
 * с поддержкой горячих клавиш (Enter — сохранение, Escape — отмена).
 */
export function FileCellInfo({ file }: FileCellInfoProps) {
  const dispatch = useAppDispatch();
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(file.original_name);
  const [isEditingComment, setIsEditingComment] = useState(false);
  const [tempComment, setTempComment] = useState(file.comment || '');
  const [prevFile, setPrevFile] = useState(file);

  // Синхронизация локального состояния при обновлении пропсов (например, после сохранения на сервере)
  if (file.original_name !== prevFile.original_name || file.comment !== prevFile.comment) {
    setPrevFile(file);
    setTempName(file.original_name);
    setTempComment(file.comment || '');
  }

  const handleSave = async (type: 'name' | 'comment') => {
    const isNameChanged = tempName.trim() !== file.original_name;
    const isCommentChanged = tempComment.trim() !== (file.comment || '');
    if (type === 'name') setIsEditingName(false);
    else setIsEditingComment(false);
    if (!isNameChanged && !isCommentChanged) return;

    try {
      await dispatch(
        updateFile({
          id: file.id,
          original_name: tempName.trim(),
          comment: tempComment.trim(),
        }),
      ).unwrap();
      toast.success('Изменения сохранены');
    } catch (error) {
      if (error) toast.error(error as string);
      setTempName(file.original_name);
      setTempComment(file.comment || '');
    }
  };

  const handleKeyDown = (type: 'name' | 'comment', e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (type === 'comment' && e.shiftKey) return; // Позволяем перенос строки в textarea
      e.preventDefault();
      handleSave(type);
    }
    if (e.key === 'Escape') {
      if (type === 'name') {
        setIsEditingName(false);
        setTempName(file.original_name);
      } else {
        setIsEditingComment(false);
        setTempComment(file.comment || '');
      }
    }
  };

  return (
    <div className="col-table justify-start">
      <div className="flex w-full gap-3">
        <FileIcon file={file} className="h-6 w-6" />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          {isEditingName ? (
            <FormInput
              autoFocus
              value={tempName}
              onChange={(e) => setTempName(e.target.value)}
              onBlur={() => handleSave('name')}
              onKeyDown={(e) => handleKeyDown('name', e)}
            />
          ) : (
            <span
              onDoubleClick={() => setIsEditingName(true)}
              className="cursor-text truncate text-sm font-semibold text-gray-900 transition-colors hover:text-blue-600"
              title="Нажмите, чтобы изменить имя файла"
            >
              {file.original_name}
            </span>
          )}
          {isEditingComment ? (
            <FormTextArea
              autoFocus
              value={tempComment}
              onChange={(e) => setTempComment(e.target.value)}
              onBlur={() => handleSave('comment')}
              onKeyDown={(e) => handleKeyDown('comment', e)}
              placeholder="Добавьте описание..."
            />
          ) : (
            <p
              onDoubleClick={() => {
                setIsEditingComment(true);
              }}
              className={cn(
                'wrap-break-word w-full max-w-full cursor-text truncate text-sm leading-relaxed transition-colors',
                file.comment
                  ? 'text-gray-600 hover:text-blue-500'
                  : 'italic text-gray-300 hover:text-gray-400',
              )}
              title="Нажмите, чтобы изменить описание"
            >
              {file.comment || 'Добавить описание...'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

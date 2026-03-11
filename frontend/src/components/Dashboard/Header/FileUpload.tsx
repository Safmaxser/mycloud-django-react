import { useRef, useState } from 'react';
import { Upload } from 'lucide-react';
import { toast } from 'react-toastify';

import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { uploadFile } from '../../../store/slices/storageSlice';
import { formatBytes } from '../../../utils/formatters';
import { DEFAULT_MAX_FILE_SIZE } from '../../../constants/config';

import { ProgressOverlay } from './ProgressOverlay';
import { UploadConfirmModal } from '../../Modals/UploadConfirmModal';
import { ButtonStandard } from '../../UI/ButtonStandard';

/**
 * Компонент управления загрузкой файлов.
 * Реализует выбор файла через скрытый input, валидацию размера на основе квот пользователя
 * и вызов модального окна подтверждения с возможностью добавления комментария.
 */
export function FileUpload() {
  const dispatch = useAppDispatch();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [comment, setComment] = useState('');

  const { user } = useAppSelector((state) => state.auth);
  const { uploadProgress } = useAppSelector((state) => state.storage);

  const isUploading = uploadProgress !== null;
  const maxFileSize = user?.max_file_size || DEFAULT_MAX_FILE_SIZE;

  /** Обработка выбора файла и первичная валидация размера. */
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > maxFileSize) {
      toast.error(
        `Файл слишком велик: ${formatBytes(file.size)}. Лимит — ${formatBytes(maxFileSize)}`,
      );
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }
    setPendingFile(file);
    setComment('');
  };

  /** Инициация асинхронной загрузки файла на сервер. */
  const handleConfirmUpload = async () => {
    if (!pendingFile) return;
    const fileToUpload = pendingFile;
    const commentToUpload = comment.trim();
    setPendingFile(null);
    setComment('');
    if (fileInputRef.current) fileInputRef.current.value = '';

    try {
      await dispatch(
        uploadFile({
          file: fileToUpload,
          comment: commentToUpload,
        }),
      ).unwrap();
      toast.success(`Файл "${fileToUpload.name}" успешно загружен`);
    } catch (error) {
      if (error) toast.error(error as string);
    }
  };

  /** Отмена выбора файла. */
  const handleCancel = () => {
    setPendingFile(null);
    setComment('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <>
      <h1 className="text-center text-lg font-bold text-gray-800 lg:text-2xl">Мои файлы</h1>
      <div className="flex items-center">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept="*/*"
        />
        <ButtonStandard
          type="button"
          disabled={isUploading}
          onClick={() => fileInputRef.current?.click()}
          classNameIcon="transition-transform group-hover:-translate-y-0.5"
          icon={Upload}
          label="Загрузить файл"
          loading={isUploading}
          loadingLabel={`Загрузка ${uploadProgress}%`}
          classNameLabel="hidden xl:block"
        />
        {pendingFile && (
          <UploadConfirmModal
            file={pendingFile}
            comment={comment}
            onCommentChange={setComment}
            onConfirm={handleConfirmUpload}
            onClose={handleCancel}
          />
        )}
      </div>
      <ProgressOverlay progress={uploadProgress} />
    </>
  );
}

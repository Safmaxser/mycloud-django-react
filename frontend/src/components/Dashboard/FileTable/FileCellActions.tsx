import { useState, useEffect, useRef } from 'react';
import { Download, Trash2, MoreVertical, Eye, Unlock, Lock, ArrowDown } from 'lucide-react';
import { toast } from 'react-toastify';

import { useAppSelector, useAppDispatch } from '../../../store/hooks';
import {
  revokeShareLink,
  generateShareLink,
  downloadFile,
  deleteFile,
  loadPreview,
} from '../../../store/slices/storageSlice';

import { cn } from '../../../utils/ui';
import type { Abortable } from '../../../types/common';
import type { FileItem } from '../../../types/storage';

import { FilePreviewModal } from '../../Modals/FilePreview/FilePreviewModal';
import { ConfirmModal } from '../../Modals/ConfirmModal';
import { ButtonAction } from '../../UI/ButtonAction';

interface FileCellActionsProps {
  file: FileItem;
}

/**
 * Ячейка действий над файлом.
 * Реализует функции предпросмотра, скачивания, удаления и управления публичным доступом.
 * Поддерживает независимое отслеживание прогресса и отмену асинхронных операций.
 */
export function FileCellActions({ file }: FileCellActionsProps) {
  const dispatch = useAppDispatch();

  // Состояния для модальных окон
  const [previewData, setPreviewData] = useState<{ file: FileItem; url: string } | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Подписка на прогресс из глобального состояния
  const downloadProgress = useAppSelector((state) => state.storage.downloadingFiles[file.id]);
  const previewingProgress = useAppSelector((state) => state.storage.previewingFiles[file.id]);

  // Рефы для управления отменой запросов (AbortController)
  const previewPromiseRef = useRef<Abortable | null>(null);
  const downloadPromiseRef = useRef<Abortable | null>(null);

  const isDownloading = downloadProgress !== undefined;
  const isPreviewing = previewingProgress !== undefined;
  const hasLink = Boolean(file.special_link_token);

  /** Удаление файла после подтверждения в модальном окне. */
  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    try {
      await dispatch(deleteFile(deleteId)).unwrap();
      setDeleteId(null);
      toast.success('Файл успешно удален');
    } catch (error) {
      if (error) toast.error(error as string);
      setDeleteId(null);
    }
  };

  /** Загрузка файла в память и открытие окна предпросмотра. */
  const handleView = async () => {
    if (previewPromiseRef.current) {
      previewPromiseRef.current.abort();
      previewPromiseRef.current = null;
      return;
    }
    try {
      const promise = dispatch(loadPreview(file.id));
      previewPromiseRef.current = promise;
      const result = await promise.unwrap();
      setPreviewData({ file, url: result.url });
    } catch (error) {
      if (error) toast.error(error as string);
    } finally {
      previewPromiseRef.current = null;
    }
  };

  /** Инициация скачивания файла на диск. */
  const handleDownload = async () => {
    if (downloadPromiseRef.current) {
      downloadPromiseRef.current.abort();
      downloadPromiseRef.current = null;
      return;
    }
    try {
      const promise = dispatch(downloadFile(file));
      downloadPromiseRef.current = promise;
      await promise.unwrap();
    } catch (error) {
      if (error) toast.error(error as string);
    } finally {
      downloadPromiseRef.current = null;
    }
  };

  /** Очистка URL из памяти при закрытии предпросмотра. */
  const closePreview = () => {
    if (previewData) {
      window.URL.revokeObjectURL(previewData.url);
      setPreviewData(null);
    }
  };

  // Очистка активных запросов при размонтировании строки
  useEffect(() => {
    return () => {
      if (previewPromiseRef.current) {
        previewPromiseRef.current.abort();
      }
      if (downloadPromiseRef.current) {
        downloadPromiseRef.current.abort();
      }
    };
  }, []);

  return (
    <div className="col-table justify-end">
      <div className="relative flex h-9 items-center justify-end">
        <div
          className={cn(
            'flex gap-1 transition-all duration-200',
            isDownloading || isPreviewing
              ? 'visible opacity-100'
              : 'invisible opacity-0 group-hover:visible group-hover:opacity-100',
          )}
        >
          <ButtonAction
            onClick={handleView}
            className="hover:text-green-600"
            title="Просмотреть"
            icon={Eye}
            progress={previewingProgress}
          />
          <ButtonAction
            onClick={handleDownload}
            className="hover:text-blue-600"
            title="Скачать"
            icon={Download}
            iconLoading={ArrowDown}
            progress={downloadProgress}
          />
          <ButtonAction
            disabled={isDownloading || isPreviewing}
            onClick={() => setDeleteId(file.id)}
            className="hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-30"
            title="Удалить"
            icon={Trash2}
          />
          <ButtonAction
            onClick={() =>
              hasLink ? dispatch(revokeShareLink(file.id)) : dispatch(generateShareLink(file.id))
            }
            className={cn(
              'btn-file-control text-gray-400',
              hasLink ? 'hover:text-green-600' : 'hover:text-blue-600',
            )}
            title={hasLink ? 'Закрыть доступ' : 'Открыть доступ по ссылке'}
            icon={hasLink ? Unlock : Lock}
          />
        </div>
        <div
          className={cn(
            'pointer-events-none absolute right-2 transition-opacity duration-200',
            isDownloading ? 'opacity-0' : 'opacity-100 group-hover:opacity-0',
          )}
        >
          <MoreVertical className="h-5 w-5 text-gray-300" />
        </div>
      </div>
      {previewData && (
        <FilePreviewModal file={previewData.file} url={previewData.url} onClose={closePreview} />
      )}
      <ConfirmModal
        isOpen={Boolean(deleteId)}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDeleteConfirm}
        title="Удалить файл?"
        message="Это действие нельзя будет отменить. Файл будет удален безвозвратно."
      />
    </div>
  );
}

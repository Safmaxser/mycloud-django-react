import { useState } from 'react';

import { getFileType } from '../../../utils/file';
import type { FileItem } from '../../../types/storage';

import { FileIcon } from '../../UI/FileIcon';
import { Skeleton } from '../../UI/Skeleton';
import { ErrorPlaceholder } from '../../UI/ErrorPlaceholder';

interface FilePreviewContentProps {
  file: FileItem;
  url: string;
}

/**
 * Компонент динамической визуализации контента файла.
 * Определяет категорию файла (image, video, audio, pdf) и отрисовывает
 * соответствующий HTML-плеер или заглушку для неподдерживаемых форматов.
 */
export function FilePreviewContent({ file, url }: FilePreviewContentProps) {
  const type = getFileType(file);
  const isAsyncType = ['image', 'video', 'pdf', 'audio'].includes(type);

  const [isLoading, setIsLoading] = useState(isAsyncType);
  const [isError, setIsError] = useState(false);

  const handleLoad = () => setIsLoading(false);
  const handleError = () => {
    setIsLoading(false);
    setIsError(true);
  };

  return (
    <div className="relative flex h-full min-h-60 w-full items-center justify-center overflow-hidden">
      {isLoading && !isError && <Skeleton />}

      {isError ? (
        <ErrorPlaceholder file={file} />
      ) : (
        <>
          {type === 'image' && (
            <img
              src={url}
              onLoad={handleLoad}
              onError={handleError}
              alt={file.original_name}
              className={`max-h-full max-w-full rounded-2xl object-contain shadow-2xl transition-all duration-500 ${
                isLoading ? 'scale-95 opacity-0' : 'scale-100 opacity-100'
              }`}
            />
          )}

          {type === 'video' && (
            <video
              src={url}
              controls
              onLoadedData={handleLoad}
              onError={handleError}
              className={`max-h-full w-full rounded-2xl shadow-2xl outline-none ${
                isLoading ? 'hidden' : 'block'
              }`}
            />
          )}

          {type === 'audio' && (
            <div className="animate-in fade-in slide-in-from-bottom-8 flex w-full flex-col items-center gap-10 py-16 duration-700">
              <div className="group relative">
                <div className="absolute -inset-4 rounded-[2.5rem] bg-blue-500/5 blur-2xl transition-all group-hover:bg-blue-500/10" />
                <div className="rounded-4xl relative flex h-32 w-32 items-center justify-center bg-white shadow-2xl ring-1 ring-gray-100">
                  <FileIcon file={file} className="h-16 w-16" />
                </div>
              </div>
              <div className="flex flex-col items-center gap-4 text-center">
                <h3 className="max-w-md truncate px-4 text-lg font-bold text-gray-900">
                  {file.original_name}
                </h3>
                <p className="text-[0.7rem] font-black uppercase tracking-[0.2em] text-blue-500/60">
                  Аудиопоток активен
                </p>
              </div>
              <div className="w-full max-w-xl px-6">
                <audio
                  src={url}
                  onLoadedData={handleLoad}
                  onError={handleError}
                  controls
                  className="h-10 w-full rounded-full opacity-90 shadow-inner transition-opacity hover:opacity-100"
                />
              </div>
            </div>
          )}

          {type === 'pdf' && (
            <iframe
              src={`${url}#toolbar=0`}
              onLoad={handleLoad}
              onError={handleError}
              className={`min-h-125 h-full w-full rounded-2xl border-0 bg-white shadow-2xl ${
                isLoading ? 'opacity-0' : 'opacity-100'
              }`}
              title="PDF Preview"
            />
          )}

          {!['image', 'video', 'audio', 'pdf'].includes(type) && (
            <div className="flex flex-col items-center gap-4 py-20 text-gray-400">
              <div className="relative">
                <FileIcon file={file} className="h-20 w-20 opacity-10" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-bold">?</span>
                </div>
              </div>
              <p className="text-sm font-bold tracking-tight">
                Предпросмотр недоступен для этого формата
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

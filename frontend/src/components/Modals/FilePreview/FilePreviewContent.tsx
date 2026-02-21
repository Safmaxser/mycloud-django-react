import { FileIcon } from '../../UI/FileIcon';

import { getFileType } from '../../../utils/file';
import type { FileItem } from '../../../types/storage';

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
  if (type === 'image') {
    return (
      <img
        src={url}
        alt={file.original_name}
        className="animate-in fade-in zoom-in-95 max-h-[70vh] rounded-2xl object-contain shadow-2xl duration-500"
      />
    );
  }
  if (type === 'video') {
    return (
      <video
        src={url}
        controls
        className="max-h-[70vh] w-full rounded-2xl shadow-2xl outline-none"
      />
    );
  }
  if (type === 'audio') {
    return (
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
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-500/60">
            Аудиопоток активен
          </p>
        </div>
        <div className="w-full px-6">
          <audio
            src={url}
            controls
            className="h-10 w-full rounded-full opacity-90 shadow-inner transition-opacity hover:opacity-100"
          />
        </div>
      </div>
    );
  }
  if (type === 'pdf') {
    return (
      <iframe
        src={`${url}#toolbar=0`}
        className="h-[70vh] w-full rounded-2xl border-0 bg-white shadow-2xl"
        title="PDF Preview"
      />
    );
  }

  // Заглушка для форматов без поддержки предпросмотра (архивы, исполняемые файлы и т.д.)
  return (
    <div className="animate-in fade-in flex flex-col items-center gap-4 py-20 text-gray-400 duration-700">
      <div className="relative">
        <FileIcon file={file} className="h-20 w-20 opacity-10" />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-bold">?</span>
        </div>
      </div>
      <p className="text-sm font-bold tracking-tight">Предпросмотр недоступен для этого формата</p>
    </div>
  );
}

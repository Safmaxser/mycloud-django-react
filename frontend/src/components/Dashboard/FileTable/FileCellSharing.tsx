import { DownloadCloud, Link2 } from 'lucide-react';
import { toast } from 'react-toastify';

import type { FileItem } from '../../../types/storage';

interface FileCellSharingProps {
  file: FileItem;
}

/**
 * Ячейка управления публичным доступом к файлу.
 * Позволяет копировать прямые ссылки на скачивание или встраивание ресурса (inline),
 * если для файла сгенерирован специальный токен доступа.
 */
export function FileCellSharing({ file }: FileCellSharingProps) {
  const hasLink = Boolean(file.special_link_token);

  /** Копирование сформированного URL в буфер обмена с уведомлением пользователя. */
  const copyToClipboard = async (type: 'download' | 'view') => {
    if (!file.special_link_token) return;
    const baseUrl = `${window.location.origin}/api/external/download/${file.special_link_token}`;
    const finalUrl = type === 'view' ? `${baseUrl}?inline=true` : baseUrl;
    await navigator.clipboard.writeText(finalUrl);
    toast.success(
      type === 'view' ? 'Ссылка для встраивания скопирована' : 'Ссылка на скачивание скопирована',
    );
  };

  return (
    <div className="col-table">
      {hasLink ? (
        <div className="animate-in fade-in slide-in-from-left-2 flex items-center justify-center gap-2 duration-300">
          <button
            onClick={() => copyToClipboard('download')}
            className="group flex cursor-pointer items-center gap-1.5 rounded-lg bg-blue-50 px-2.5 py-1.5 text-blue-600 transition-all hover:bg-blue-600 hover:text-white hover:shadow-md active:scale-95"
            title="Копировать ссылку на скачивание"
          >
            <DownloadCloud className="h-4 w-4" strokeWidth={2.5} />
          </button>
          <button
            onClick={() => copyToClipboard('view')}
            className="group flex cursor-pointer items-center gap-1.5 rounded-lg bg-purple-50 px-2.5 py-1.5 text-purple-600 transition-all hover:bg-purple-600 hover:text-white hover:shadow-md active:scale-95"
            title="Копировать как ресурс (inline)"
          >
            <Link2 className="h-4 w-4" strokeWidth={2.5} />
          </button>
        </div>
      ) : (
        <div className="justify-center text-center text-[10px] font-bold uppercase tracking-widest text-gray-300">
          Приватный
        </div>
      )}
    </div>
  );
}

import {
  FileText,
  Image as ImageIcon,
  Film,
  File,
  Music,
  Archive,
  type LucideIcon,
} from 'lucide-react';

import { getFileType } from '../../utils/file';
import { cn } from '../../utils/ui';
import type { FileItem } from '../../types/storage';

const ICON_CONFIG: Record<string, { icon: LucideIcon; color: string }> = {
  image: { icon: ImageIcon, color: 'text-purple-500' },
  video: { icon: Film, color: 'text-red-500' },
  audio: { icon: Music, color: 'text-pink-500' },
  pdf: { icon: FileText, color: 'text-blue-500' },
  document: { icon: FileText, color: 'text-blue-500' },
  archive: { icon: Archive, color: 'text-amber-500' },
  file: { icon: File, color: 'text-gray-500' },
};

interface FileIconProps {
  file: FileItem;
  className?: string;
}

/** Компонент для визуализации типа файла через соответствующую иконку и цветовую схему. */
export function FileIcon({ file, className }: FileIconProps) {
  const type = getFileType(file);
  const { icon: Icon, color } = ICON_CONFIG[type];
  return <Icon className={cn(color, 'h-5 w-5 shrink-0', className)} />;
}

import { useEffect, type PropsWithChildren } from 'react';
import { createPortal } from 'react-dom';

import { ButtonClose } from '../UI/ButtonClose';
import { cn } from '../../utils/ui';

interface BaseModalProps {
  onClose: () => void;
  className?: string;
}

/**
 * Базовый компонент модального окна.
 * Использует React Portal для рендеринга вне основной иерархии DOM (в body),
 * блокирует прокрутку страницы и обеспечивает стандартную анимацию появления.
 */
export function BaseModal({ onClose, className, children }: PropsWithChildren<BaseModalProps>) {
  // Блокировка прокрутки фона при открытии и восстановление при закрытии
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  return createPortal(
    <div className="animate-in fade-in fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm duration-300">
      <div
        className={cn(
          'animate-in zoom-in-95 rounded-4xl relative flex w-full flex-col overflow-hidden bg-white shadow-2xl duration-300',
          className,
        )}
      >
        <ButtonClose onClick={onClose} />
        {children}
      </div>
    </div>,
    document.body,
  );
}

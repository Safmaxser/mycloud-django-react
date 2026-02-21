import { X } from 'lucide-react';

interface ButtonCloseProps {
  onClick: () => void;
}

/** Универсальная кнопка закрытия для модальных окон и панелей. */
export function ButtonClose({ onClick }: ButtonCloseProps) {
  return (
    <button
      onClick={onClick}
      type="button"
      aria-label="Закрыть"
      className="absolute right-5 top-5 z-50 cursor-pointer rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-100"
    >
      <X className="h-6 w-6" />
    </button>
  );
}

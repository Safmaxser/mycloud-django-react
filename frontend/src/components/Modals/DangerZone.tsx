import { useState } from 'react';
import { ChevronDown, AlertOctagon } from 'lucide-react';

import { cn } from '../../utils/ui';

interface DangerZoneProps {
  onDelete: () => void;
  title: string;
  description: string;
  buttonText: string;
}

/** Компонент для группировки деструктивных действий с дополнительным уровнем подтверждения через раскрытие. */
export function DangerZone({ onDelete, title, description, buttonText }: DangerZoneProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-t border-red-50">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="group flex w-full cursor-pointer items-center justify-between py-2 transition-all"
      >
        <span className="text-[0.7rem] font-black uppercase tracking-[0.2em] text-gray-400 group-hover:text-red-400">
          Управление аккаунтом
        </span>
        <ChevronDown
          className={cn(
            'h-4 w-4 text-gray-300 transition-all duration-300',
            isOpen && 'rotate-180 text-red-400',
          )}
        />
      </button>

      {isOpen && (
        <div className="animate-in fade-in slide-in-from-top-3 mt-1 duration-500">
          <div className="rounded-4xl bg-red-50/30 p-4 ring-1 ring-red-100/50">
            <div className="flex items-start gap-4">
              <div className="rounded-xl bg-red-100 p-2 text-red-600">
                <AlertOctagon className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-black text-red-600">{title}</h4>
                <p className="mt-1 text-[0.7rem] leading-relaxed text-red-400/80 landscape:text-[0.5rem] landscape:lg:text-[0.7rem]">
                  {description}
                </p>
                <button
                  type="button"
                  onClick={onDelete}
                  className="mt-6 block cursor-pointer text-[0.7rem] font-black uppercase tracking-widest text-red-500 underline-offset-8 hover:text-red-700 hover:underline landscape:hidden landscape:lg:block"
                >
                  {buttonText}
                </button>
              </div>
              <button
                type="button"
                onClick={onDelete}
                className="block cursor-pointer self-center text-[0.7rem] font-black uppercase tracking-widest text-red-500 underline-offset-8 hover:text-red-700 hover:underline portrait:hidden landscape:block landscape:lg:hidden"
              >
                Удалить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

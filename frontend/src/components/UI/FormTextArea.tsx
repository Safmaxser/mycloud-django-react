import { forwardRef, useId, type TextareaHTMLAttributes } from 'react';
import type { LucideIcon } from 'lucide-react';

import { cn } from '../../utils/ui';

interface FormTextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  icon?: LucideIcon | null;
  error?: string;
}

/** Универсальное многострочное поле ввода с поддержкой иконок, меток и отображения ошибок. */
export const FormTextArea = forwardRef<HTMLTextAreaElement, FormTextAreaProps>(
  ({ label, icon: Icon, error, className, ...props }, ref) => {
    const id = useId();

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={id} className="mb-1 ml-0.5 block text-sm font-bold text-gray-500">
            {label}
          </label>
        )}
        <div className="relative">
          {Icon && <Icon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />}
          <div
            className={cn(
              'group rounded-2xl border-2 bg-white px-1 py-1.5 transition-all focus-within:ring-2',
              error
                ? 'border-red-100 bg-red-50 focus-within:border-red-300 focus-within:ring-red-50'
                : 'border-blue-100 focus-within:border-blue-300 focus-within:ring-blue-50',
              Icon ? 'pl-8' : 'pl-1',
              className,
            )}
          >
            <textarea
              {...props}
              ref={ref}
              id={id}
              className="custom-scrollbar block min-h-20 w-full resize-none px-2 text-base font-medium leading-relaxed text-gray-700 outline-none"
            />
          </div>
        </div>
        {error && <p className="ml-0.5 mt-1 text-xs text-red-600">{error}</p>}
      </div>
    );
  },
);

FormTextArea.displayName = 'FormTextArea';

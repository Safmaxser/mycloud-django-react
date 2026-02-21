import { forwardRef, useId, type InputHTMLAttributes } from 'react';
import type { LucideIcon } from 'lucide-react';

import { cn } from '../../utils/ui';

interface FormInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: LucideIcon | null;
  error?: string;
}

/** Универсальное поле ввода с поддержкой иконок, меток и отображения ошибок валидации. */
export const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  ({ label, icon: Icon, error, className, ...props }, ref) => {
    const id = useId();

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={id} className="mb-1 ml-0.5 block text-sm font-bold text-gray-500">
            {label}
          </label>
        )}
        <div className="group relative">
          {Icon && <Icon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />}
          <input
            type="text"
            {...props}
            ref={ref}
            id={id}
            className={cn(
              'w-full rounded-xl border-2 bg-white px-3 py-2 text-base font-medium leading-relaxed text-gray-700 outline-none transition-all focus-within:ring-2',
              Icon ? 'pl-10' : 'pl-3',
              error
                ? 'border-red-100 bg-red-50 focus:border-red-300 focus:ring-red-50'
                : 'border-blue-100 focus:border-blue-300 focus:ring-blue-50',
              className,
            )}
          />
        </div>
        {error && <p className="ml-0.5 mt-1 text-xs text-red-600">{error}</p>}
      </div>
    );
  },
);

FormInput.displayName = 'FormInput';

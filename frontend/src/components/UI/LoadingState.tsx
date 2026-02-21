import { Loader } from 'lucide-react';

interface LoaderDataProps {
  title: string;
}

/** Компонент для отображения состояния загрузки данных с анимированным индикатором и заголовком. */
export function LoadingState({ title }: LoaderDataProps) {
  return (
    <div className="flex h-full flex-col items-center justify-center text-blue-600">
      <Loader className="animate-steps mb-4 h-16 w-16 text-blue-600" />
      <p className="font-medium text-gray-500">{title}</p>
    </div>
  );
}

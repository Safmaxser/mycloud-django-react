import { Cloud } from 'lucide-react';

/** Компонент полноэкранного индикатора загрузки при инициализации приложения. */
export function SplashScreen() {
  const currentYear = new Date().getFullYear();

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white">
      <div className="flex animate-pulse flex-col items-center">
        <div className="mb-4 rounded-2xl bg-blue-600 p-4 shadow-xl shadow-blue-200">
          <Cloud className="h-12 w-12 text-white" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-800">MyCloud</h1>
        <p className="mt-2 text-sm font-medium uppercase tracking-widest text-gray-400">
          Загрузка системы...
        </p>
      </div>
      <div className="absolute bottom-10 text-xs font-medium text-gray-300">
        &copy; {currentYear} MyCloud — Безопасное хранение файлов
      </div>
    </div>
  );
}

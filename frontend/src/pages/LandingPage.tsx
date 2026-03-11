import { useLocation, Link } from 'react-router-dom';
import { Cloud, ArrowRight } from 'lucide-react';

import { ROUTES } from '../routes/paths';
import { ButtonStandard } from '../components/UI/ButtonStandard';

/**
 * Главная страница (Лендинг) приложения.
 * Презентует возможности сервиса и обеспечивает навигацию к формам авторизации.
 */
export function LandingPage() {
  const location = useLocation();
  const currentYear = new Date().getFullYear();

  return (
    <div className="flex h-dvh flex-col justify-between overflow-hidden bg-white font-sans text-gray-900">
      <header className="flex h-20 items-center justify-between border-b border-gray-100 px-10">
        <div className="flex h-full items-center gap-4 p-2 lg:p-3">
          <div className="h-full w-full rounded-xl bg-blue-600 p-2 shadow-md shadow-blue-200">
            <Cloud className="h-full w-full text-white" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-gray-800">MyCloud</span>
        </div>
        <Link
          to={ROUTES.LOGIN}
          state={location.state}
          className="btn-non-priority text-base text-blue-600 hover:text-blue-800"
        >
          Войти
        </Link>
      </header>
      <main className="flex flex-col items-center gap-8 px-4 text-center lg:gap-10 landscape:gap-4 landscape:lg:gap-10">
        <h1 className="mx-auto max-w-4xl text-7xl font-black tracking-tight lg:text-8xl landscape:text-5xl landscape:lg:text-8xl">
          MyCloud. <span className="text-gray-400">Облако для ваших файлов.</span>
        </h1>
        <p className="mx-auto max-w-2xl text-xl font-medium leading-relaxed text-gray-500 landscape:text-lg landscape:lg:text-xl">
          Безопасное хранилище для ваших файлов с моментальным предпросмотром и панелью
          администратора.
        </p>
        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          <ButtonStandard
            as={Link}
            to={ROUTES.REGISTER}
            state={location.state}
            label="Создать аккаунт"
            icon={ArrowRight}
            classNameIcon="transition-transform group-hover:translate-x-1"
            className="btn-big px-10 shadow-xl shadow-blue-100"
          />
          <Link to={ROUTES.LOGIN} state={location.state} className="btn-non-priority text-base">
            Войти
          </Link>
        </div>
      </main>
      <footer className="lg:h-30 flex h-10 items-center border-t border-gray-100 text-center">
        <div className="mx-auto max-w-7xl px-6">
          <div className="bottom-10 text-base font-medium text-gray-300">
            &copy; {currentYear} MyCloud — Безопасное хранение файлов
          </div>
        </div>
      </footer>
    </div>
  );
}

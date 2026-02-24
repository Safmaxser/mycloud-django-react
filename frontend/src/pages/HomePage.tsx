import { useLocation, Navigate } from 'react-router-dom';

import { useAppSelector } from '../store/hooks';
import { DashboardPage } from './DashboardPage';
import { LandingPage } from './LandingPage';
import { SplashScreen } from '../components/UI/SplashScreen';

/**
 * Корневой контроллер главной страницы приложения.
 * Управляет навигацией на основе статуса авторизации, обеспечивая переход
 * в DashboardPage (или возврат на сохраненный путь) либо показ LandingPage.
 */
export function HomePage() {
  const { isAuthenticated, isInitializing } = useAppSelector((state) => state.auth);
  const location = useLocation();

  // Ожидание завершения проверки сессии
  if (isInitializing) {
    return <SplashScreen />;
  }

  if (isAuthenticated) {
    // Редирект на сохраненный путь, если он был передан в состоянии роутера
    const from = location.state?.from?.pathname;
    if (from) {
      return <Navigate to={from} replace />;
    }
    return <DashboardPage />;
  }

  return <LandingPage />;
}

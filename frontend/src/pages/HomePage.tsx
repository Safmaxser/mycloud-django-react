import { useAppSelector } from '../store/hooks';
import { DashboardPage } from './DashboardPage';
import { LandingPage } from './LandingPage';
import { SplashScreen } from '../components/UI/SplashScreen';

/**
 * Корневой контроллер главной страницы приложения.
 * Выполняет условный рендеринг: DashboardPage для авторизованных пользователей
 * или LandingPage для неавторизованных гостей.
 */
export function HomePage() {
  const { isAuthenticated, isInitializing } = useAppSelector((state) => state.auth);

  // Ожидание завершения проверки сессии
  if (isInitializing) {
    return <SplashScreen />;
  }
  return isAuthenticated ? <DashboardPage /> : <LandingPage />;
}

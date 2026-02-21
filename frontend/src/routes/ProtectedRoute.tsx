import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { useAppSelector } from '../store/hooks';
import { ROUTES } from './paths';
import { SplashScreen } from '../components/UI/SplashScreen';

interface ProtectedRouteProps {
  adminOnly?: boolean;
}

/**
 * Компонент-обертка для защиты приватных маршрутов.
 * Реализует проверку авторизации и ролей доступа (is_staff) перед рендерингом страниц.
 */
export function ProtectedRoute({ adminOnly = false }: ProtectedRouteProps) {
  const { isAuthenticated, isInitializing, user } = useAppSelector((state) => state.auth);
  const location = useLocation();

  // Пока восстанавливается сессия (fetchMe), предотвращаем редирект на логин
  if (isInitializing) {
    return <SplashScreen />;
  }

  if (!isAuthenticated) {
    // Сохраняем текущий путь, чтобы вернуть пользователя после успешного входа
    return <Navigate to={ROUTES.HOME} state={{ from: location }} replace />;
  }

  if (adminOnly && !user?.is_staff) {
    return <Navigate to={ROUTES.HOME} replace />;
  }

  return <Outlet />;
}

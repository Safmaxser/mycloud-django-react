import { createBrowserRouter, Navigate } from 'react-router-dom';

import { ROUTES } from './paths';
import { ProtectedRoute } from './ProtectedRoute';

import { HomePage } from '../pages/HomePage';
import { LoginPage } from '../pages/LoginPage';
import { RegisterPage } from '../pages/RegisterPage';
import { DashboardPage } from '../pages/DashboardPage';
import { AdminPage } from '../pages/AdminPage';

/** Конфигурация маршрутизации приложения с защитой приватных зон. */
export const router = createBrowserRouter([
  {
    path: ROUTES.HOME,
    element: <HomePage />,
  },
  {
    path: ROUTES.LOGIN,
    element: <LoginPage />,
  },
  {
    path: ROUTES.REGISTER,
    element: <RegisterPage />,
  },
  {
    // Защищенные маршруты, доступные только администраторам (is_staff)
    element: <ProtectedRoute adminOnly />,
    children: [
      { path: ROUTES.ADMIN, element: <AdminPage /> },
      { path: ROUTES.ADMIN_USER_FILES, element: <DashboardPage /> },
    ],
  },
  {
    // Редирект на главную при обращении к несуществующему маршруту
    path: '*',
    element: <Navigate to={ROUTES.HOME} replace />,
  },
]);

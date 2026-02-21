import { useEffect, useRef, type BaseSyntheticEvent } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Lock, User as UserIcon } from 'lucide-react';
import { zodResolver } from '@hookform/resolvers/zod';

import { useAppDispatch, useAppSelector } from '../store/hooks';
import { loginUser, clearAuthError } from '../store/slices/authSlice';

import { ROUTES } from '../routes/paths';
import { loginSchema, type LoginFormValues } from '../utils/validation';
import type { Abortable } from '../types/common';

import { ButtonStandard } from '../components/UI/ButtonStandard';
import { FormInput } from '../components/UI/FormInput';
import { BackButton } from '../components/UI/BackButton';
import { AuthHeader } from '../components/UI/AuthHeader';

/**
 * Страница авторизации пользователя.
 * Обеспечивает вход в систему и перенаправление на защищенные ресурсы.
 */
export function LoginPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { isSubmitting, isAuthenticated, error } = useAppSelector((state) => state.auth);
  const loginPromiseRef = useRef<Abortable | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onFormSubmit = (data: LoginFormValues) => {
    const promise = dispatch(loginUser(data));
    loginPromiseRef.current = promise;
  };

  const handleFormAction = (e: BaseSyntheticEvent) => {
    handleSubmit(onFormSubmit)(e);
  };

  useEffect(() => {
    if (isAuthenticated) {
      const from = location.state?.from?.pathname || ROUTES.HOME;
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location.state]);

  useEffect(() => {
    dispatch(clearAuthError());
    return () => {
      if (loginPromiseRef.current) {
        loginPromiseRef.current.abort();
      }
      dispatch(clearAuthError());
    };
  }, [dispatch]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="rounded-4xl flex w-full max-w-lg flex-col bg-white p-8 shadow-2xl">
        <BackButton />
        <AuthHeader
          icon={Lock}
          title="Вход в MyCloud"
          subtitle="Введите данные для доступа к файлам"
        />
        <form onSubmit={handleFormAction} className="space-y-6">
          <FormInput
            label="Имя пользователя"
            icon={UserIcon}
            placeholder="ivan_cloud"
            error={errors.username?.message}
            {...register('username')}
          />
          <FormInput
            label="Пароль"
            icon={Lock}
            type="password"
            placeholder="••••••••"
            error={errors.password?.message}
            {...register('password')}
          />
          {error && (
            <div className="rounded-md border border-red-100 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}
          <ButtonStandard label="Войти" loading={isSubmitting} className="mt-2 w-full" />
        </form>
        <div className="mt-6 text-center text-sm">
          <span className="text-gray-500">Нет аккаунта? </span>
          <Link
            to={ROUTES.REGISTER}
            className="cursor-pointer font-medium text-blue-600 transition-colors hover:text-blue-500"
          >
            Зарегистрироваться
          </Link>
        </div>
      </div>
    </div>
  );
}

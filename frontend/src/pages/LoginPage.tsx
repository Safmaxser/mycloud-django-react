import { useEffect, useRef, type BaseSyntheticEvent } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
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
      navigate(ROUTES.HOME, { replace: true });
    }
  }, [isAuthenticated, navigate]);

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
    <div className="flex h-dvh items-center justify-center overflow-hidden bg-gray-50 px-4">
      <div className="rounded-4xl flex w-full max-w-lg flex-col gap-8 bg-white p-8 shadow-2xl landscape:max-w-xl landscape:gap-4 landscape:p-6 landscape:lg:max-w-lg landscape:lg:gap-8 landscape:lg:p-8">
        <BackButton />
        <AuthHeader
          icon={Lock}
          title="Вход в MyCloud"
          subtitle="Введите данные для доступа к файлам"
        />
        <form
          onSubmit={handleFormAction}
          className="flex flex-col gap-6 landscape:gap-2 landscape:lg:gap-6"
        >
          <div className="flex flex-col gap-4 landscape:flex-row landscape:lg:flex-col">
            <FormInput
              label="Имя пользователя"
              icon={UserIcon}
              autoComplete="username"
              placeholder="ivan_cloud"
              error={errors.username?.message}
              {...register('username')}
            />
            <FormInput
              label="Пароль"
              icon={Lock}
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              error={errors.password?.message}
              {...register('password')}
            />
          </div>
          {error && (
            <div className="rounded-md border border-red-100 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}
          <ButtonStandard label="Войти" loading={isSubmitting} className="mt-2 w-full" />
        </form>
        <div className="text-center text-sm">
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

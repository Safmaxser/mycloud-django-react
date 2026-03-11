import { useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { UserPlus, Lock, Mail, User as UserIcon, IdCard } from 'lucide-react';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'react-toastify';

import { useAppDispatch, useAppSelector } from '../store/hooks';
import { registerUser } from '../store/slices/authSlice';

import { ROUTES } from '../routes/paths';
import { registerSchema, type RegisterFormValues } from '../utils/validation';
import type { Abortable } from '../types/common';

import { BackButton } from '../components/UI/BackButton';
import { FormInput } from '../components/UI/FormInput';
import { ButtonStandard } from '../components/UI/ButtonStandard';
import { AuthHeader } from '../components/UI/AuthHeader';

/**
 * Страница регистрации нового пользователя.
 * Реализует проверку данных через Zod и создание учетной записи.
 */
export function RegisterPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { isSubmitting, error } = useAppSelector((state) => state.auth);
  const registerPromiseRef = useRef<Abortable | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormValues) => {
    try {
      const promise = dispatch(registerUser(data));
      registerPromiseRef.current = promise;
      await promise.unwrap();
      toast.success('Регистрация успешна! Теперь вы можете войти');
      navigate(ROUTES.LOGIN, { replace: true });
    } catch (error) {
      if (error) toast.error(error as string);
    } finally {
      registerPromiseRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      registerPromiseRef.current?.abort();
    };
  }, []);

  return (
    <div className="flex h-dvh items-center justify-center overflow-hidden bg-gray-50 px-4 py-12">
      <div className="rounded-4xl flex w-full max-w-lg flex-col gap-8 bg-white p-8 shadow-2xl landscape:max-w-3xl landscape:gap-4 landscape:p-6 landscape:lg:max-w-lg landscape:lg:gap-8 landscape:lg:p-8">
        <BackButton />
        <AuthHeader
          icon={UserPlus}
          title="Создать аккаунт"
          subtitle="Зарегистрируйтесь в MyCloud для хранения файлов"
        />
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-6 landscape:gap-2 landscape:lg:gap-6"
        >
          <div className="grid grid-cols-2 gap-4 lg:gap-6 landscape:grid-cols-4 landscape:lg:grid-cols-2">
            <FormInput
              classNameBlock="col-span-2"
              label="Логин (4-20 символов, латиница)"
              icon={UserIcon}
              placeholder="ivan_cloud"
              error={errors.username?.message}
              {...register('username')}
            />
            <FormInput
              classNameBlock="col-span-2"
              label="Электронная почта"
              icon={Mail}
              type="email"
              placeholder="example@mail.com"
              error={errors.email?.message}
              {...register('email')}
            />
            <FormInput
              classNameBlock="col-span-2"
              label="Имя и Фамилия"
              icon={IdCard}
              placeholder="Иван Иванов"
              error={errors.full_name?.message}
              {...register('full_name')}
            />
            <FormInput
              classNameBlock="col-span-1"
              label="Пароль"
              icon={Lock}
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              error={errors.password?.message}
              {...register('password')}
            />
            <FormInput
              classNameBlock="col-span-1"
              label="Повторите пароль"
              icon={Lock}
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              error={errors.confirmPassword?.message}
              {...register('confirmPassword')}
            />
          </div>
          {error && (
            <div className="rounded-md border border-red-100 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}
          <ButtonStandard
            label="Зарегистрироваться"
            loading={isSubmitting}
            className="mt-2 w-full"
          />
        </form>
      </div>
    </div>
  );
}

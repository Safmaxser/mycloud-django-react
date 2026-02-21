import { z } from 'zod';

/** Схема валидации для формы входа в систему. */
export const loginSchema = z.object({
  username: z.string().min(1, 'Введите имя пользователя'),
  password: z.string().min(1, 'Введите пароль'),
});

// Начинается с буквы, далее латиница и цифры
const USERNAME_REGEX = /^[a-zA-Z][a-zA-Z0-9]*$/;
// Обязательно: 1 заглавная буква, 1 цифра и 1 спецсимвол
const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+{}[\]:;<>,.?/~`|-]).*$/;

/** Базовые поля пользователя, используемые в схемах регистрации и обновления. */
const baseUserFields = {
  username: z
    .string()
    .min(1, 'Введите логин')
    .min(4, 'Минимум 4 символа')
    .max(20, 'Максимум 20 символов')
    .regex(USERNAME_REGEX, 'Только латиница и цифры, начинается с буквы'),
  email: z
    .string()
    .min(1, 'Введите email')
    .pipe(z.email({ message: 'Некорректный формат email' })),
  full_name: z.string().max(255, 'Слишком длинное имя').optional().or(z.literal('')),
};

/** Схема валидации для формы регистрации нового пользователя. */
export const registerSchema = z
  .object({
    ...baseUserFields,
    password: z
      .string()
      .min(1, 'Введите пароль')
      .min(6, 'Пароль должен быть не менее 6 символов')
      .regex(PASSWORD_REGEX, 'Нужна заглавная буква, цифра и спецсимвол'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Пароли не совпадают',
    path: ['confirmPassword'],
  });

/** Схема валидации для обновления данных профиля (пароль опционален). */
export const updateSchema = z.object({
  ...baseUserFields,
  password: z
    .string()
    .min(6, 'Пароль должен быть не менее 6 символов')
    .regex(PASSWORD_REGEX, 'Нужна заглавная буква, цифра и спецсимвол')
    .or(z.literal(''))
    .optional(),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
export type RegisterFormValues = z.infer<typeof registerSchema>;
export type UpdateFormValues = z.infer<typeof updateSchema>;

import { describe, expect, it } from 'vitest';
import { loginSchema, registerSchema, updateSchema } from '../validation';

/**
 * Тестирование схем валидации на базе Zod.
 * Проверка соблюдения бизнес-правил, регулярных выражений и логики сравнения полей (confirmPassword).
 */
describe('validation - Schemas', () => {
  /** Валидация формы аутентификации */
  describe('loginSchema', () => {
    it('should validate correct login data', () => {
      const result = loginSchema.safeParse({ username: 'user', password: '123' });
      expect(result.success).toBe(true);
    });

    it('should fail on empty fields', () => {
      const result = loginSchema.safeParse({ username: '', password: '' });
      expect(result.success).toBe(false);
      if (!result.success) {
        const usernameError = result.error.issues.find((i) => i.path[0] === 'username');
        const passwordError = result.error.issues.find((i) => i.path[0] === 'password');
        expect(usernameError?.message).toBe('Введите имя пользователя');
        expect(passwordError?.message).toBe('Введите пароль');
      }
    });
  });

  /** Сложная валидация регистрации (регистрационные правила и Regex) */
  describe('registerSchema', () => {
    const validData = {
      username: 'User123',
      email: 'test@mail.com',
      password: 'Password1!',
      confirmPassword: 'Password1!',
      full_name: 'John Doe',
    };

    it('should validate correct registration data', () => {
      const result = registerSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should fail if passwords do not match (refine check)', () => {
      const result = registerSchema.safeParse({ ...validData, confirmPassword: 'wrong' });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Пароли не совпадают');
      }
    });

    it.each([
      ['simple', 'нет заглавной, цифры и спецсимвола'],
      ['Simple123', 'нет спецсимвола'],
      ['SIMPLE!', 'нет цифры'],
      ['123456!', 'нет заглавной буквы'],
      ['Sho1!', 'слишком короткий (менее 6 символов)'],
    ])('should fail registration if password is (%s)', (pw) => {
      const result = registerSchema.safeParse({ ...validData, password: pw, confirmPassword: pw });
      expect(result.success).toBe(false);
    });

    it.each([
      ['1user', 'начинается с цифры'],
      ['us', 'слишком короткий (менее 4 символов)'],
      ['very_long_username_over_20_chars', 'превышает 20 символов'],
      ['user@', 'содержит спецсимволы'],
      ['юзер', 'содержит кириллицу'],
    ])('should fail registration if username is (%s)', (username) => {
      const result = registerSchema.safeParse({ ...validData, username });
      expect(result.success).toBe(false);
    });

    it('should validate email format', () => {
      const result = registerSchema.safeParse({ ...validData, email: 'not-an-email' });
      expect(result.success).toBe(false);
    });
  });

  /** Валидация обновления профиля (поддержка опциональных полей) */
  describe('updateSchema', () => {
    const baseData = {
      username: 'User123',
      email: 'test@mail.com',
    };

    it('should allow empty password for profile updates', () => {
      const result = updateSchema.safeParse({ ...baseData, password: '' });
      expect(result.success).toBe(true);
    });

    it('should validate password if it is provided', () => {
      const result = updateSchema.safeParse({ ...baseData, password: 'short' });
      expect(result.success).toBe(false);
    });

    it('should allow optional or empty full_name', () => {
      const withNull = updateSchema.safeParse({ ...baseData, full_name: '' });
      const without = updateSchema.safeParse(baseData);
      expect(withNull.success).toBe(true);
      expect(without.success).toBe(true);
    });
  });
});

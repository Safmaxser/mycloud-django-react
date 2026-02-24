import type { Middleware } from '@reduxjs/toolkit';

import { authSlice } from '../slices/authSlice';
import { unauthorizedError } from '../actions';

import { socketManager } from './socketManager';
import { handleSocketMessage } from './socketHandler';

/**
 * Middleware для координации жизненного цикла WebSocket-соединения с состоянием Redux.
 * Автоматически инициирует подключение при авторизации пользователя и
 * разрывает соединение при выходе из системы или ошибках доступа.
 */
export const socketMiddleware: Middleware = (store) => (next) => (action) => {
  // Инициализация соединения при успешном входе или восстановлении сессии
  if (
    authSlice.actions.loginUser.fulfilled.match(action) ||
    authSlice.actions.fetchMe.fulfilled.match(action)
  ) {
    socketManager.connect(store.dispatch, (msg) => handleSocketMessage(store, msg));
  }

  // Принудительное закрытие сокета при логауте или удалении аккаунта
  if (
    authSlice.actions.logoutUser.fulfilled.match(action) ||
    authSlice.actions.deleteMe.fulfilled.match(action) ||
    unauthorizedError.match(action)
  ) {
    socketManager.disconnect();
  }

  return next(action);
};

import { adminSlice } from '../slices/adminSlice';
import { authSlice } from '../slices/authSlice';
import { storageSlice } from '../slices/storageSlice';
import { unauthorizedError } from '../actions';

import { socketManager } from './socketManager';

import type { AppDispatch, RootState } from '..';
import type { SocketEvent } from '../../types/socket';

// Кэш для предотвращения дублирования обработки событий
const processedMessages = new Set<string>();

/**
 * Диспетчер входящих WebSocket-сообщений.
 * Обеспечивает дедупликацию событий по ID и распределяет данные
 * по соответствующим Redux-слайсам (Auth, Storage, Admin)
 * для синхронизации интерфейса в реальном времени.
 */
export const handleSocketMessage = (
  store: { getState: () => RootState; dispatch: AppDispatch },
  message: SocketEvent,
) => {
  const { id: eventId, type, payload } = message;

  // Проверка на дубликаты сообщений
  if (eventId && processedMessages.has(eventId)) return;
  if (eventId) {
    processedMessages.add(eventId);
    if (processedMessages.size > 50) {
      const first = processedMessages.values().next().value;
      if (first) processedMessages.delete(first);
    }
  }

  const state = store.getState();
  const currentUser = state.auth.user;
  const dispatch = store.dispatch;

  // Роутинг событий бэкенда в Redux-слайсы
  switch (type) {
    case 'SUBSCRIPTIONS_UPDATED':
      // Техническое событие: подтверждение переподписки на каналы (например, при получении прав админа)
      console.log(`[WS] Подписки обновлены: ${payload}`);
      break;

    case 'USER_CREATED':
    case 'USER_UPDATED':
      if (payload.id === currentUser?.id) {
        const wasStaff = currentUser?.is_staff;
        dispatch(authSlice.actions.updateCurrentUser(payload));
        if (wasStaff !== payload.is_staff) {
          socketManager.send({ command: 'update_subscriptions' });
        }
      }
      if (currentUser?.is_staff) {
        dispatch(adminSlice.actions.syncUser({ updatedUser: payload, currentUser }));
      }
      break;

    case 'USER_DELETED':
      if (payload.id === currentUser?.id) {
        store.dispatch(unauthorizedError());
      } else if (currentUser?.is_staff) {
        store.dispatch(adminSlice.actions.removeUser(payload.id));
      }
      break;

    case 'FILE_CREATED':
    case 'FILE_UPDATED':
      dispatch(storageSlice.actions.syncFile({ file: payload, user: currentUser }));
      break;

    case 'FILE_DELETED':
      dispatch(
        storageSlice.actions.removeFile({
          fileId: payload.id,
          ownerId: payload.owner_id,
          user: currentUser,
        }),
      );
      break;
  }
};

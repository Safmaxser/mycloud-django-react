import { authSlice } from '../slices/authSlice';

import type { AppDispatch } from '..';
import type { SocketEvent } from '../../types/socket';

/**
 * Менеджер управления WebSocket-соединением.
 * Инкапсулирует низкоуровневую логику работы с протоколами ws/wss,
 * автоматический реконнект и сериализацию данных при отправке.
 */
class SocketManager {
  private socket: WebSocket | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  /**
   * Инициирует подключение к серверу и устанавливает обработчики событий.
   * Предотвращает дублирование активных соединений.
   */
  connect(dispatch: AppDispatch, onMessage: (data: SocketEvent) => void) {
    if (
      this.socket?.readyState === WebSocket.OPEN ||
      this.socket?.readyState === WebSocket.CONNECTING
    )
      return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    this.socket = new WebSocket(`${protocol}//${window.location.host}/ws/cloud/`);

    this.socket.onmessage = (event) => {
      try {
        onMessage(JSON.parse(event.data));
      } catch (e) {
        console.error('[WS] Ошибка обработки сообщения', e);
      }
    };

    this.socket.onclose = () => {
      // Использование fetchMe как триггера для проверки авторизации перед реконнектом
      this.reconnectTimer = setTimeout(() => dispatch(authSlice.actions.fetchMe()), 3000);
    };
  }

  /** Корректно завершает соединение и очищает таймеры реконнекта. */
  disconnect() {
    if (this.socket) {
      this.socket.onclose = null;
      this.socket.close();
      this.socket = null;
    }
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
  }

  /** Отправляет объект данных на сервер в формате JSON. */
  send(data: object) {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(data));
    }
  }
}

export const socketManager = new SocketManager();

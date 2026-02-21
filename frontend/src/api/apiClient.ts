import axios, { type AxiosInstance } from 'axios';
import { store } from '../store';
import { unauthorizedError } from '../store/actions';

/** HTTP-клиент с настройкой CSRF и автоматической обработкой ошибок авторизации. */
const apiClient: AxiosInstance = axios.create({
  baseURL: '/api',
  withCredentials: true,
  xsrfCookieName: 'csrftoken',
  xsrfHeaderName: 'X-CSRFToken',
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;

    // Глобальная обработка истечения сессии (Unauthorized/Forbidden)
    if (status === 401 || status === 403) {
      // Игнорируем страницу логина, чтобы избежать циклического редиректа
      if (!window.location.pathname.includes('/login')) {
        store.dispatch(unauthorizedError());
      }
    }
    return Promise.reject(error);
  },
);

export default apiClient;

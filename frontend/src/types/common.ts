/** Интерфейс для объектов с поддержкой прерывания (например, асинхронных запросов). */
export interface Abortable {
  abort: () => void;
}

/** Описание структуры колонки для универсальных таблиц данных. */
export interface TableColumn {
  label: string;
  field: string | null;
  className?: string;
}

/** Конфигурация для типизации отклоненных значений в Redux Thunk. */
export type ThunkConfig = { rejectValue: string | null };

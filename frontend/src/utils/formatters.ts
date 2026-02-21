/** Форматирует размер в байтах в человекочитаемую строку (КБ, МБ, ГБ). */
export const formatBytes = (bytes: number | null | undefined, decimals: number = 2): string => {
  if (bytes === null || bytes === undefined) return '—';
  if (bytes <= 0) return '0 Байт';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Байт', 'КБ', 'МБ', 'ГБ', 'ТБ'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

/** Преобразует ISO-дату в локальный формат (ДД.ММ.ГГГГ ЧЧ:ММ). */
export const formatDate = (dateString: string | null): string => {
  if (!dateString) return '—';
  return new Date(dateString).toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/** Преобразует дату в относительный формат (например, "2 минуты назад", "в прошлом месяце"). */
export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  const rtf = new Intl.RelativeTimeFormat('ru', { numeric: 'auto' });
  if (diffInSeconds < 60) return 'только что';

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return rtf.format(-diffInMinutes, 'minute');

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return rtf.format(-diffInHours, 'hour');

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return rtf.format(-diffInDays, 'day');

  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInDays < 30) return rtf.format(-diffInWeeks, 'week');

  const diffInMonths = Math.floor(diffInDays / 30.44);
  if (diffInMonths < 12) return rtf.format(-diffInMonths, 'month');

  const diffInYears = Math.floor(diffInDays / 365.25);

  return rtf.format(-diffInYears, 'year');
}

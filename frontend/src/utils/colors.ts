/** Генерирует стабильный пастельный фон на основе строкового ID. */
export const getHashColor = (str: string): string => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = Math.abs(hash % 360);
  return `hsl(${h}, 45%, 92%)`;
};

/** Генерирует контрастный темный текст, сочетающийся с фоном getHashColor. */
export const getHashTextColor = (str: string): string => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = Math.abs(hash % 360);
  return `hsl(${h}, 60%, 40%)`;
};

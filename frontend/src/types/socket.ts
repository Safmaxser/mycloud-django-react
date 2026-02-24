import type { FileItem } from './storage';
import type { User } from './user';

/** Описание структуры событий реального времени, поступающих через WebSocket (Django Channels). */
export type SocketEvent =
  | { type: 'FILE_CREATED' | 'FILE_UPDATED'; payload: FileItem; id: string }
  | { type: 'FILE_DELETED'; payload: { id: string; owner_id: string }; id: string }
  | { type: 'USER_CREATED' | 'USER_UPDATED'; payload: User; id: string }
  | { type: 'USER_DELETED'; payload: { id: string }; id: string }
  | { type: 'SUBSCRIPTIONS_UPDATED'; payload: string; id: string };

import { configureStore, combineReducers } from '@reduxjs/toolkit';

import { socketMiddleware } from './middleware/socketMiddleware';
import authReducer from './slices/authSlice';
import storageReducer from './slices/storageSlice';
import adminReducer from './slices/adminSlice';

const rootReducer = combineReducers({
  auth: authReducer,
  storage: storageReducer,
  admin: adminReducer,
});

/** Глобальное состояние приложения с поддержкой WebSocket-соединения. */
export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      // Отключаем проверку для корректной работы с Blob/File объектами
      serializableCheck: false,
    }).concat(socketMiddleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

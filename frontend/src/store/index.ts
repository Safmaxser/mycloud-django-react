import { configureStore } from '@reduxjs/toolkit';

import authReducer from './slices/authSlice';
import storageReducer from './slices/storageSlice';
import adminReducer from './slices/adminSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    storage: storageReducer,
    admin: adminReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

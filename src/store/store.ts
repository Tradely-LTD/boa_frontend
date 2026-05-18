import { configureStore } from '@reduxjs/toolkit';
import { emptyApi } from './emptyApi';
import authReducer          from './authSlice';
import notificationsReducer from './notificationsSlice';

export const store = configureStore({
  reducer: {
    [emptyApi.reducerPath]: emptyApi.reducer,
    auth:          authReducer,
    notifications: notificationsReducer,
  },
  middleware: (getDefault) => getDefault().concat(emptyApi.middleware),
});

export type RootState   = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

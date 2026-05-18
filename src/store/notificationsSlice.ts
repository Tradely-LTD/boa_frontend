import { createSlice } from '@reduxjs/toolkit';

interface NotificationsState {
  lastReadAt: string | null;
}

const stored = localStorage.getItem('boa_notif_read');

const initialState: NotificationsState = {
  lastReadAt: stored ?? null,
};

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    markAllRead: (state) => {
      state.lastReadAt = new Date().toISOString();
      localStorage.setItem('boa_notif_read', state.lastReadAt);
    },
  },
});

export const { markAllRead } = notificationsSlice.actions;
export default notificationsSlice.reducer;

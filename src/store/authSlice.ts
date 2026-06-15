import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface AuthUser {
  id: number;
  userId: number;
  email: string;
  name: string;
  role: 'admin' | 'super_admin' | 'centre_manager' | 'collector' | 'shop_owner' | 'sales_rep';
  centreId?: number | null;
  shopId?: number | null;
}

interface AuthState {
  token: string | null;
  user: AuthUser | null;
}

const TOKEN_KEY = 'boa_token';
const USER_KEY  = 'boa_user';

const initialState: AuthState = {
  token: localStorage.getItem(TOKEN_KEY),
  user:  JSON.parse(localStorage.getItem(USER_KEY) ?? 'null'),
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials(state, action: PayloadAction<{ token: string; user: AuthUser }>) {
      state.token = action.payload.token;
      state.user  = action.payload.user;
      localStorage.setItem(TOKEN_KEY, action.payload.token);
      localStorage.setItem(USER_KEY,  JSON.stringify(action.payload.user));
    },
    logout(state) {
      state.token = null;
      state.user  = null;
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    },
  },
});

export const { setCredentials, logout } = authSlice.actions;
export default authSlice.reducer;

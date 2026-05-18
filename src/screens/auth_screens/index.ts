/**
 * @module auth_screens
 * @depends store/emptyApi, store/authSlice
 * @routes /login
 */
export { default as LoginScreen } from './LoginScreen';
export { useLoginMutation } from './services/authApiSlice';

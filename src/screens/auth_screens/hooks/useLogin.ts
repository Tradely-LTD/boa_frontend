import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useLoginMutation } from '../services/authApiSlice';
import { setCredentials } from '../../../store/authSlice';

export const useLogin = () => {
  const dispatch  = useDispatch();
  const navigate  = useNavigate();
  const [loginApi, { isLoading, error }] = useLoginMutation();

  const login = async (email: string, password: string) => {
    const res = await loginApi({ email, password }).unwrap();
    dispatch(setCredentials({ token: res.data.token, user: res.data.user }));
    const dest = res.data.user.role === 'centre_manager' ? '/manager/dashboard' : '/dashboard';
    navigate(dest, { replace: true });
  };

  const errorMessage = error
    ? ('data' in error ? (error.data as any)?.message : 'Network error')
    : null;

  return { login, isLoading, errorMessage };
};

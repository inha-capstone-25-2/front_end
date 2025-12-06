// 로그아웃 뮤테이션 훅
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { logout as logoutAPI } from '../../lib/api';
import { useAuthStore } from '../../store/authStore';

export const useLogoutMutation = () => {
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();

  return useMutation({
    mutationFn: logoutAPI,
    onSuccess: () => {
      logout();
      navigate('/');
    },
    onError: () => {
      logout();
      navigate('/');
    },
  });
};

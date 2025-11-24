// 회원 탈퇴 mutation 훅
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { quitAccount } from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import { toast } from 'sonner';

export const useQuitAccountMutation = () => {
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();

  return useMutation({
    mutationFn: quitAccount,
    onSuccess: () => {
      logout();
      toast.success('회원 탈퇴가 완료되었습니다');
      navigate('/');
    },
    onError: (error) => {
      const errorMessage = error instanceof Error ? error.message : '회원 탈퇴 중 오류가 발생했습니다.';
      toast.error('회원 탈퇴 실패', {
        description: errorMessage,
      });
    },
  });
};


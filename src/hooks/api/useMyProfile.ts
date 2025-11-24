// 사용자 프로필 조회 쿼리 훅
import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AxiosError } from 'axios';
import { fetchMyProfile } from '../../lib/api';
import { UserProfile } from '../../types/auth';
import { useAuthStore } from '../../store/authStore';
import { toast } from 'sonner';

export const useMyProfileQuery = () => {
  const navigate = useNavigate();
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const setUserInfo = useAuthStore((state) => state.setUserInfo);
  const logout = useAuthStore((state) => state.logout);

  const query = useQuery<UserProfile, Error>({
    queryKey: ['myProfile'],
    queryFn: async (): Promise<UserProfile> => {
      return fetchMyProfile();
    },
    enabled: isLoggedIn,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (query.data) {
      setUserInfo(query.data.name, query.data.username);
    }
  }, [query.data, setUserInfo]);

  useEffect(() => {
    if (query.error) {
      const error = query.error as unknown;
      
      if (error instanceof Error && 'response' in error) {
        const axiosError = error as AxiosError;
        if (axiosError.response?.status === 401) {
          logout();
          toast.error('로그인이 필요합니다', {
            description: '세션이 만료되었습니다. 다시 로그인해주세요.',
          });
          navigate('/login');
          return;
        }
      }
      
      const errorMessage = error instanceof Error ? error.message : '다시 시도해주세요.';
      toast.error('사용자 정보를 불러오는 중 오류가 발생했습니다', {
        description: errorMessage,
      });
    }
  }, [query.error, logout, navigate]);

  return query;
};

/**
 * 검색어 기록 조회 쿼리 훅
 * 
 * 이 파일은 사용자의 최근 검색어 기록을 조회하는 쿼리 훅을 정의합니다.
 * - useSearchHistory: 검색어 기록 조회
 */

import { useQuery } from '@tanstack/react-query';
import { getSearchHistory, SearchQueryHistoryItem } from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import { useMyProfileQuery } from './useMyProfile';

/**
 * 검색어 기록 조회 쿼리 훅
 * 
 * @param userId - 사용자 ID (선택사항, 없으면 프로필에서 가져옴)
 * @param limit - 조회할 검색어 기록 개수 (기본값: 20)
 * @returns React Query 쿼리 객체
 * 
 * 기능:
 * - GET /papers/search-history?user_id={userId}&limit={limit} 엔드포인트 호출
 * - userId가 없으면 프로필에서 가져옴
 * - 로그인하지 않은 경우 쿼리 비활성화
 * - staleTime: 1분 (1분 동안 캐시된 데이터 사용)
 * - searched_at 기준으로 최신순 정렬
 * - 중복 키워드는 자동 필터링
 */
export const useSearchHistory = (userId?: number, limit: number = 20) => {
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const { data: profile, isLoading: isLoadingProfile } = useMyProfileQuery();
  
  // userId가 없으면 프로필에서 가져오기
  const effectiveUserId = userId || (profile?.id ? parseInt(profile.id) : undefined);
  
  return useQuery<SearchQueryHistoryItem[], Error>({
    queryKey: ['searchHistory', effectiveUserId, limit],
    queryFn: async (): Promise<SearchQueryHistoryItem[]> => {
      if (!effectiveUserId) {
        throw new Error('User ID is required');
      }
      return getSearchHistory(effectiveUserId, limit);
    },
    enabled: isLoggedIn && !isLoadingProfile && !!effectiveUserId,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
};


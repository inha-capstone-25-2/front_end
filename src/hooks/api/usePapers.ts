// 논문 관련 React Query 훅
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, endpoints, Paper, SearchPapersResponse, BookmarkResponse, SearchHistoryResponse, fetchSearchHistory, fetchViewedPapers, addBookmark, AddBookmarkResponse, deleteBookmark, BookmarkItem, fetchBookmarks, searchPapers, getPaperDetail, getRecommendations } from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import { useAppStore } from '../../store/useAppStore';
import { toast } from 'sonner';

export interface SearchPapersParams {
  q: string;
  categories?: string[];
  page?: number;
  sort_by?: string;
}

// 논문 검색 쿼리
export function useSearchPapersQuery(params: SearchPapersParams, enabled: boolean = true) {
  const categoriesKey = params.categories && params.categories.length > 0
    ? [...params.categories].sort().join(',')
    : undefined;
  
  return useQuery({
    queryKey: ['papers', 'search', params.q, categoriesKey, params.sort_by, params.page],
    queryFn: async (): Promise<SearchPapersResponse> => {
      return searchPapers(
        params.q,
        params.page || 1,
        params.categories && params.categories.length > 0 ? params.categories : undefined,
        params.sort_by
      );
    },
    enabled: enabled && !!params.q,
    staleTime: 2 * 60 * 1000,
    retry: false,
  });
}

// 논문 상세 조회
export function usePaperDetailQuery(paperId: string | number, enabled: boolean = true) {
  return useQuery({
    queryKey: ['papers', 'detail', paperId],
    queryFn: async (): Promise<Paper> => {
      return getPaperDetail(paperId);
    },
    enabled: enabled && !!paperId,
    staleTime: 5 * 60 * 1000,
  });
}

// 추천 논문 조회: paperId별 캐시 분리, 논문 변경 시에만 API 호출
export function useRecommendationsQuery(
  paperId: string | number | null,
  topK: number = 6,
  enabled: boolean = true
) {
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  return useQuery({
    queryKey: ['papers', 'recommendations', paperId, topK],
    queryFn: async (): Promise<Paper[]> => {
      // paperId가 존재할 때만 API 호출 (enabled 조건과 한 번 더 방어)
      if (!paperId) {
        return [];
      }
      return getRecommendations(paperId, topK);
    },
    enabled: enabled && isLoggedIn && !!paperId,
    staleTime: 5 * 60 * 1000,
    refetchOnMount: false,
    retry: false,
  });
}

// 북마크 목록 조회
export function useBookmarksQuery() {
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);

  return useQuery({
    queryKey: ['bookmarks'],
    queryFn: async (): Promise<BookmarkItem[]> => {
      return fetchBookmarks();
    },
    enabled: isLoggedIn,  // 로그인 상태일 때만 활성화
    staleTime: 1 * 60 * 1000,
  });
}

// 북마크 토글 뮤테이션
export function useToggleBookmarkMutation() {
  const queryClient = useQueryClient();
  const toggleBookmark = useAppStore((state) => state.toggleBookmark);
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);

  return useMutation({
    mutationFn: async (paperId: number): Promise<BookmarkResponse> => {
      const response = await api.post<BookmarkResponse>(endpoints.papers.toggleBookmark(paperId));
      return response.data;
    },
    onMutate: async (paperId: number) => {
      if (!isLoggedIn) {
        toast.error('로그인이 필요합니다', {
          description: '북마크 기능을 사용하려면 로그인해주세요.',
        });
        throw new Error('Not logged in');
      }

      await queryClient.cancelQueries({ queryKey: ['bookmarks'] });
      
      const previousBookmarks = queryClient.getQueryData<BookmarkItem[]>(['bookmarks']);
      
      if (previousBookmarks) {
        const paperIdString = String(paperId);
        const isBookmarked = previousBookmarks.some(b => 
          b.paper_id === paperIdString || String(b.paper?.id) === paperIdString
        );
        const newBookmarks = isBookmarked
          ? previousBookmarks.filter(b => {
              const bookmarkPaperId = b.paper_id || (b.paper?.id ? String(b.paper.id) : null);
              return bookmarkPaperId !== paperIdString;
            })
          : previousBookmarks;
        
        queryClient.setQueryData(['bookmarks'], newBookmarks);
      }

      return { previousBookmarks };
    },
    onSuccess: (_data, paperId) => {
      toggleBookmark(paperId);
      
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
      queryClient.invalidateQueries({ queryKey: ['papers', 'detail', paperId] });
      queryClient.invalidateQueries({ queryKey: ['papers', 'search'] });
    },
    onError: (_error, _paperId, context) => {
      if (context?.previousBookmarks) {
        queryClient.setQueryData(['bookmarks'], context.previousBookmarks);
      }
      
      toast.error('북마크 처리 실패', {
        description: '다시 시도해주세요.',
      });
    },
  });
}

// 북마크 추가
export function useAddBookmarkMutation() {
  const queryClient = useQueryClient();
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);

  return useMutation({
    mutationFn: async ({ paperId, notes }: { paperId: string; notes?: string }): Promise<AddBookmarkResponse> => {
      if (!isLoggedIn) {
        toast.error('로그인이 필요합니다', {
          description: '북마크 기능을 사용하려면 로그인해주세요.',
        });
        throw new Error('Not logged in');
      }
      
      return addBookmark(paperId, notes);
    },
    onMutate: async ({ paperId, notes }) => {
      // 진행 중인 쿼리 취소
      await queryClient.cancelQueries({ queryKey: ['bookmarks'] });
      
      // 이전 북마크 목록 저장 (롤백용)
      const previousBookmarks = queryClient.getQueryData<BookmarkItem[]>(['bookmarks']);
      
      // Optimistic update: 북마크 목록에 임시로 추가
      if (previousBookmarks) {
        const newBookmark: BookmarkItem = {
          id: `temp-${paperId}`,  // 임시 ID
          paper_id: paperId,
          notes: notes,
        };
        
        queryClient.setQueryData<BookmarkItem[]>(['bookmarks'], (old = []) => {
          // 이미 존재하는지 확인
          const exists = old.some(b => b.paper_id === paperId);
          if (exists) {
            return old;  // 이미 있으면 추가하지 않음
          }
          return [...old, newBookmark];
        });
      }
      
      return { previousBookmarks };
    },
    onSuccess: (data, { paperId }) => {
      toast.success('북마크가 추가되었습니다', {
        description: '내 서재에서 확인할 수 있습니다.',
      });
      
      // 북마크 목록 및 검색 결과 무효화하여 최신 데이터 가져오기
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
      queryClient.invalidateQueries({ queryKey: ['papers', 'search'] });
    },
    onError: (error: Error, variables, context) => {
      // 에러 발생 시 이전 상태로 롤백
      if (context?.previousBookmarks) {
        queryClient.setQueryData(['bookmarks'], context.previousBookmarks);
      }
      
      // 에러 메시지에서 중복 북마크 확인
      const errorMessage = error.message || '';
      if (errorMessage.includes('already exists') || 
          errorMessage.includes('Bookmark already exists') ||
          errorMessage.includes('duplicate')) {
        toast.error('이미 북마크된 논문입니다', {
          description: '내 서재에서 확인할 수 있습니다.',
        });
        // 북마크 목록을 갱신하여 UI 동기화
        queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
      } else {
        toast.error('북마크 추가 실패', {
          description: errorMessage || '다시 시도해주세요.',
        });
      }
    },
  });
}

// 북마크 삭제
export function useDeleteBookmarkMutation() {
  const queryClient = useQueryClient();
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);

  return useMutation({
    mutationFn: async (bookmarkId: string): Promise<void> => {
      if (!isLoggedIn) {
        toast.error('로그인이 필요합니다', {
          description: '북마크 기능을 사용하려면 로그인해주세요.',
        });
        throw new Error('Not logged in');
      }
      
      return deleteBookmark(bookmarkId);
    },
    onSuccess: () => {
      toast.success('북마크가 삭제되었습니다');
      
      // 북마크 목록 및 검색 결과 무효화하여 최신 데이터 가져오기
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
      queryClient.invalidateQueries({ queryKey: ['papers', 'search'] });
    },
    onError: (error: Error) => {
      toast.error('북마크 삭제 실패', {
        description: error.message || '다시 시도해주세요.',
      });
    },
  });
}


// 검색 기록 조회
export function useSearchHistoryQuery(userId: string | null, limit: number = 20, enabled: boolean = true) {
  return useQuery({
    queryKey: ['papers', 'searchHistory', userId, limit],
    queryFn: async (): Promise<SearchHistoryResponse> => {
      if (!userId) throw new Error('User ID is required');
      return fetchSearchHistory(userId, limit);
    },
    enabled: enabled && !!userId,
    staleTime: 1 * 60 * 1000,
  });
}

// 조회한 논문 조회 (페이지네이션 지원)
export function useViewedPapersQuery(page: number = 1, limit: number = 10, enabled: boolean = true) {
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  
  return useQuery({
    queryKey: ['papers', 'viewed', page, limit],
    queryFn: async (): Promise<SearchPapersResponse> => {
      return fetchViewedPapers(page, limit);
    },
    enabled: enabled && isLoggedIn,
    staleTime: 1 * 60 * 1000,
  });
}

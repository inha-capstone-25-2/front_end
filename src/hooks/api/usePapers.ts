// 논문 관련 React Query 훅
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, endpoints, Paper, SearchPapersResponse, BookmarkResponse, SearchHistoryResponse, fetchSearchHistory, addBookmark, AddBookmarkResponse, deleteBookmark, updateBookmark, BookmarkItem, UpdateBookmarkResponse, fetchBookmarks, BookmarksListResponse, BookmarkListItem, searchPapers, getPaperDetail, getPaperById } from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import { useAppStore } from '../../store/useAppStore';
import { toast } from 'sonner';

export interface SearchPapersParams {
  q: string;
  categories?: string[];
  page?: number;
}

// 논문 검색 쿼리
export function useSearchPapersQuery(params: SearchPapersParams, enabled: boolean = true) {
  const categoriesKey = params.categories && params.categories.length > 0
    ? [...params.categories].sort().join(',')
    : undefined;
  
  return useQuery({
    queryKey: ['papers', 'search', params.q, categoriesKey, params.page],
    queryFn: async (): Promise<SearchPapersResponse> => {
      return searchPapers(
        params.q,
        params.page || 1,
        params.categories && params.categories.length > 0 ? params.categories : undefined
      );
    },
    enabled: enabled && !!params.q,
    staleTime: 2 * 60 * 1000,
    retry: false,
  });
}

// 논문 상세 조회 (임시 비활성화)
export function usePaperDetailQuery(paperId: string | number, enabled: boolean = true) {
  return useQuery({
    queryKey: ['papers', 'detail', paperId],
    queryFn: async (): Promise<Paper> => {
      throw new Error('논문 상세 조회 기능이 임시로 비활성화되었습니다.');
    },
    enabled: false,
    staleTime: 5 * 60 * 1000,
  });
}

// 논문 상세 조회 별칭 (임시 비활성화)
export function usePaperDetail(id: string) {
  return useQuery({
    queryKey: ['paperDetail', id],
    queryFn: () => {
      return Promise.reject(new Error('논문 상세 조회 기능이 임시로 비활성화되었습니다.'));
    },
    enabled: false,
  });
}

// 북마크 목록 조회 (임시 비활성화)
export function useBookmarksQuery() {
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);

  return useQuery({
    queryKey: ['bookmarks'],
    queryFn: async (): Promise<BookmarkItem[]> => {
      return [];
    },
    enabled: false,
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

// 북마크 추가 (임시 비활성화)
export function useAddBookmarkMutation() {
  const queryClient = useQueryClient();
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);

  return useMutation({
    mutationFn: async ({ paperId, notes }: { paperId: string; notes?: string }): Promise<AddBookmarkResponse> => {
      throw new Error('북마크 추가 기능이 임시로 비활성화되었습니다.');
    },
    onSuccess: () => {},
    onError: () => {
      console.log('북마크 추가 기능이 비활성화되어 있습니다.');
    },
  });
}

// 북마크 삭제 (임시 비활성화)
export function useDeleteBookmarkMutation() {
  const queryClient = useQueryClient();
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);

  return useMutation({
    mutationFn: async (bookmarkId: string): Promise<void> => {
      throw new Error('북마크 삭제 기능이 임시로 비활성화되었습니다.');
    },
    onSuccess: () => {},
    onError: () => {
      console.log('북마크 삭제 기능이 비활성화되어 있습니다.');
    },
  });
}

// 북마크 수정 (임시 비활성화)
export function useUpdateBookmarkMutation() {
  const queryClient = useQueryClient();
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);

  return useMutation({
    mutationFn: async ({ bookmarkId, notes }: { bookmarkId: string; notes: string }): Promise<UpdateBookmarkResponse> => {
      throw new Error('북마크 수정 기능이 임시로 비활성화되었습니다.');
    },
    onSuccess: () => {},
    onError: () => {
      console.log('북마크 수정 기능이 비활성화되어 있습니다.');
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

/**
 * 논문 관련 React Query 훅
 * 
 * 이 파일은 논문 검색, 상세 조회, 북마크 관련 React Query 훅을 정의합니다.
 * - useSearchPapersQuery: 논문 검색 쿼리
 * - usePaperDetailQuery: 논문 상세 조회 쿼리
 * - useBookmarksQuery: 북마크 목록 조회 쿼리
 * - useToggleBookmarkMutation: 북마크 토글 뮤테이션
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, endpoints, Paper, SearchPapersResponse, BookmarkResponse, SearchHistoryResponse, fetchSearchHistory, addBookmark, AddBookmarkResponse, deleteBookmark, updateBookmark, BookmarkItem, UpdateBookmarkResponse, fetchBookmarks, BookmarksListResponse, BookmarkListItem } from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import { useAppStore } from '../../store/useAppStore';
import { toast } from 'sonner';

/**
 * 검색 파라미터 인터페이스
 */
export interface SearchPapersParams {
  q: string;
  categories?: string[];
  page?: number;
}

/**
 * 논문 검색 쿼리 훅
 * 
 * @param params - 검색 파라미터 (검색어, 카테고리, 페이지)
 * @param enabled - 쿼리 활성화 여부 (기본값: true)
 * @returns React Query 쿼리 객체
 * 
 * 기능:
 * - GET /papers/search?q={query}&categories={categories}&page={page} 엔드포인트 호출
 * - 검색어가 비어있으면 쿼리 비활성화
 * - staleTime: 2분 (2분 동안 캐시된 데이터 사용)
 * - timeout: 180초 (검색 API는 응답 시간이 길어 타임아웃을 180초로 설정, 서버 응답 시간 고려)
 * - retry: false (검색 쿼리는 긴 응답 시간이 예상되므로 자동 재시도 비활성화)
 */
export function useSearchPapersQuery(params: SearchPapersParams, enabled: boolean = true) {
  // queryKey 안정화: categories 배열을 정렬된 문자열로 변환하여 참조 비교 문제 해결
  const categoriesKey = params.categories && params.categories.length > 0
    ? [...params.categories].sort().join(',')
    : undefined;
  
  return useQuery({
    queryKey: ['papers', 'search', params.q, categoriesKey, params.page],
    queryFn: async (): Promise<SearchPapersResponse> => {
      const queryParams: Record<string, string | number | string[]> = {
        q: params.q,
      };
      
      // categories가 있으면 추가 (서버가 여러 개의 categories 파라미터를 받는 경우)
      if (params.categories && params.categories.length > 0) {
        // axios는 배열을 자동으로 여러 파라미터로 변환합니다
        // 예: categories: ['cs.AI', 'cs.LG'] -> ?categories=cs.AI&categories=cs.LG
        queryParams.categories = params.categories;
      }
      
      // page 추가
      if (params.page) {
        queryParams.page = params.page;
      }
      
      const response = await api.get<SearchPapersResponse>(endpoints.papers.search, {
        params: queryParams,
        timeout: 180000, // 검색 API는 응답 시간이 길어 180초(3분)로 설정, 서버 응답 시간 고려
      });
      return response.data;
    },
    enabled: enabled && !!params.q,
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: false, // 검색 쿼리는 긴 응답 시간이 예상되므로 자동 재시도 비활성화
  });
}

/**
 * 논문 상세 조회 쿼리 훅
 * 
 * @param paperId - 논문 ID
 * @param enabled - 쿼리 활성화 여부 (기본값: true)
 * @returns React Query 쿼리 객체
 * 
 * 기능:
 * - GET /papers/{id} 엔드포인트 호출
 * - paperId가 없으면 쿼리 비활성화
 * - staleTime: 5분 (5분 동안 캐시된 데이터 사용)
 */
export function usePaperDetailQuery(paperId: number, enabled: boolean = true) {
  return useQuery({
    queryKey: ['papers', 'detail', paperId],
    queryFn: async (): Promise<Paper> => {
      const response = await api.get<Paper>(endpoints.papers.detail(paperId));
      return response.data;
    },
    enabled: enabled && !!paperId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * 북마크 목록 조회 쿼리 훅
 * 
 * @returns React Query 쿼리 객체
 * 
 * 기능:
 * - GET /bookmarks 엔드포인트 호출
 * - 논문 정보가 없으면 paper_id로 논문 상세 조회
 * - 로그인하지 않은 경우 쿼리 비활성화
 * - staleTime: 1분 (1분 동안 캐시된 데이터 사용)
 * 
 * 주의사항:
 * - 서버 응답이 BookmarkListItem[] 형식 또는 { bookmarks: BookmarkListItem[] } 형식
 * - 논문 정보는 paper_id로 별도 조회 필요
 */
export function useBookmarksQuery() {
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);

  return useQuery({
    queryKey: ['bookmarks'],
    queryFn: async (): Promise<BookmarkItem[]> => {
      try {
        // 북마크 목록 조회
        const response: BookmarksListResponse = await fetchBookmarks();
        
        // 응답 형식에 따라 처리
        const bookmarksList: BookmarkListItem[] = Array.isArray(response)
          ? response
          : (response as { bookmarks: BookmarkListItem[] }).bookmarks || [];
        
        if (bookmarksList.length === 0) {
          return [];
        }
        
        // 논문 정보가 없으면 논문 상세 조회
        const bookmarkItems: BookmarkItem[] = await Promise.all(
          bookmarksList.map(async (bookmark) => {
            try {
              // paper_id를 숫자로 변환 시도
              const paperId = parseInt(bookmark.paper_id);
              
              if (isNaN(paperId)) {
                // 숫자가 아닌 경우 (예: MongoDB ObjectId) paper_id만 반환
                return {
                  id: bookmark.id || bookmark.paper_id,
                  paper_id: bookmark.paper_id,
                  notes: bookmark.notes,
                };
              }
              
              // 논문 상세 정보 조회
              const paperResponse = await api.get<Paper>(endpoints.papers.detail(paperId));
              
              return {
                id: bookmark.id || bookmark.paper_id, // 북마크 ID가 없으면 paper_id 사용
                paper_id: bookmark.paper_id,
                notes: bookmark.notes,
                paper: paperResponse.data,
              };
            } catch (error) {
              // 논문 조회 실패 시 paper_id만 있는 BookmarkItem 반환
              return {
                id: bookmark.id || bookmark.paper_id,
                paper_id: bookmark.paper_id,
                notes: bookmark.notes,
              };
            }
          })
        );
        
        return bookmarkItems;
      } catch (error) {
        // 에러 발생 시 빈 배열 반환
        return [];
      }
    },
    enabled: isLoggedIn,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

/**
 * 북마크 토글 뮤테이션 훅
 * 
 * @returns React Query 뮤테이션 객체
 * 
 * 기능:
 * - POST /papers/{id}/bookmark 엔드포인트 호출
 * - Optimistic Update: 서버 응답 전에 UI 업데이트
 * - 성공 시 관련 쿼리 무효화 (bookmarks, detail, search)
 * - 실패 시 이전 상태로 롤백
 * - Zustand store의 toggleBookmark 액션 호출
 * 
 * 주의사항:
 * - 로그인하지 않은 경우 에러 토스트 표시 및 요청 중단
 */
export function useToggleBookmarkMutation() {
  const queryClient = useQueryClient();
  const toggleBookmark = useAppStore((state) => state.toggleBookmark);
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);

  return useMutation({
    mutationFn: async (paperId: number): Promise<BookmarkResponse> => {
      const response = await api.post<BookmarkResponse>(endpoints.papers.toggleBookmark(paperId));
      return response.data;
    },
    /**
     * 뮤테이션 실행 전 (Optimistic Update)
     * 
     * 서버 응답을 기다리지 않고 즉시 UI를 업데이트하여
     * 사용자 경험을 향상시킵니다.
     */
    onMutate: async (paperId: number) => {
      if (!isLoggedIn) {
        toast.error('로그인이 필요합니다', {
          description: '북마크 기능을 사용하려면 로그인해주세요.',
        });
        throw new Error('Not logged in');
      }

      // 진행 중인 북마크 쿼리 취소
      await queryClient.cancelQueries({ queryKey: ['bookmarks'] });
      
      // 이전 북마크 목록 가져오기 (롤백용)
      const previousBookmarks = queryClient.getQueryData<BookmarkItem[]>(['bookmarks']);
      
      // Optimistic Update: 즉시 UI 업데이트
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
          : previousBookmarks; // 추가는 서버 응답 후 처리
        
        queryClient.setQueryData(['bookmarks'], newBookmarks);
      }

      // 롤백을 위한 이전 상태 반환
      return { previousBookmarks };
    },
    /**
     * 뮤테이션 성공 시
     * 
     * - Zustand store 업데이트
     * - 관련 쿼리 무효화하여 최신 데이터로 갱신
     */
    onSuccess: (_data, paperId) => {
      // Zustand store 업데이트
      toggleBookmark(paperId);
      
      // 관련 쿼리 무효화 (최신 데이터로 갱신)
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
      queryClient.invalidateQueries({ queryKey: ['papers', 'detail', paperId] });
      queryClient.invalidateQueries({ queryKey: ['papers', 'search'] });
    },
    /**
     * 뮤테이션 실패 시
     * 
     * Optimistic Update로 변경한 UI를 이전 상태로 롤백합니다.
     */
    onError: (_error, _paperId, context) => {
      // 에러 발생 시 이전 상태로 롤백
      if (context?.previousBookmarks) {
        queryClient.setQueryData(['bookmarks'], context.previousBookmarks);
      }
      
      toast.error('북마크 처리 실패', {
        description: '다시 시도해주세요.',
      });
    },
  });
}

/**
 * 북마크 추가 뮤테이션 훅
 * 
 * @returns React Query 뮤테이션 객체
 * 
 * 기능:
 * - POST /bookmarks 엔드포인트 호출
 * - 성공 시 관련 쿼리 무효화 (bookmarks 목록 등)
 * - 에러 처리
 * 
 * 주의사항:
 * - 로그인하지 않은 경우 에러 토스트 표시
 */
export function useAddBookmarkMutation() {
  const queryClient = useQueryClient();
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);

  return useMutation({
    mutationFn: async ({ paperId, notes }: { paperId: string; notes?: string }): Promise<AddBookmarkResponse> => {
      if (!isLoggedIn) {
        throw new Error('로그인이 필요합니다');
      }
      return addBookmark(paperId, notes);
    },
    onSuccess: () => {
      // 관련 쿼리 무효화하여 최신 데이터로 갱신
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
      queryClient.invalidateQueries({ queryKey: ['papers', 'search'] });
      
      toast.success('북마크가 추가되었습니다.');
    },
    onError: (error) => {
      const errorMessage = error instanceof Error ? error.message : '북마크 추가 중 오류가 발생했습니다.';
      toast.error('북마크 추가 실패', {
        description: errorMessage,
      });
    },
  });
}

/**
 * 북마크 삭제 뮤테이션 훅
 * 
 * @returns React Query 뮤테이션 객체
 * 
 * 기능:
 * - DELETE /bookmarks/{bookmarkId} 엔드포인트 호출
 * - 성공 시 관련 쿼리 무효화
 * - 에러 처리
 * 
 * 주의사항:
 * - 로그인하지 않은 경우 에러 토스트 표시
 */
export function useDeleteBookmarkMutation() {
  const queryClient = useQueryClient();
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);

  return useMutation({
    mutationFn: async (bookmarkId: string): Promise<void> => {
      if (!isLoggedIn) {
        throw new Error('로그인이 필요합니다');
      }
      return deleteBookmark(bookmarkId);
    },
    onSuccess: () => {
      // 관련 쿼리 무효화하여 최신 데이터로 갱신
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
      queryClient.invalidateQueries({ queryKey: ['papers', 'search'] });
      
      toast.success('북마크가 삭제되었습니다.');
    },
    onError: (error) => {
      const errorMessage = error instanceof Error ? error.message : '북마크 삭제 중 오류가 발생했습니다.';
      toast.error('북마크 삭제 실패', {
        description: errorMessage,
      });
    },
  });
}

/**
 * 북마크 수정 뮤테이션 훅
 * 
 * @returns React Query 뮤테이션 객체
 * 
 * 기능:
 * - PUT /bookmarks/{bookmarkId} 엔드포인트 호출
 * - 성공 시 관련 쿼리 무효화
 * - 에러 처리
 * 
 * 주의사항:
 * - 로그인하지 않은 경우 에러 토스트 표시
 */
export function useUpdateBookmarkMutation() {
  const queryClient = useQueryClient();
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);

  return useMutation({
    mutationFn: async ({ bookmarkId, notes }: { bookmarkId: string; notes: string }): Promise<UpdateBookmarkResponse> => {
      if (!isLoggedIn) {
        throw new Error('로그인이 필요합니다');
      }
      return updateBookmark(bookmarkId, notes);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
      toast.success('북마크가 수정되었습니다.');
    },
    onError: (error) => {
      const errorMessage = error instanceof Error ? error.message : '북마크 수정 중 오류가 발생했습니다.';
      toast.error('북마크 수정 실패', {
        description: errorMessage,
      });
    },
  });
}

/**
 * 검색 기록 조회 쿼리 훅
 * 
 * @param userId - 사용자 ID
 * @param limit - 조회할 검색 기록 개수 (기본값: 20)
 * @param enabled - 쿼리 활성화 여부 (기본값: true)
 * @returns React Query 쿼리 객체
 * 
 * 기능:
 * - GET /papers/search-history?user_id={userId}&limit={limit} 엔드포인트 호출
 * - userId가 없으면 쿼리 비활성화
 * - staleTime: 1분 (1분 동안 캐시된 데이터 사용)
 */
export function useSearchHistoryQuery(userId: string | null, limit: number = 20, enabled: boolean = true) {
  return useQuery({
    queryKey: ['papers', 'searchHistory', userId, limit],
    queryFn: async (): Promise<SearchHistoryResponse> => {
      if (!userId) throw new Error('User ID is required');
      return fetchSearchHistory(userId, limit);
    },
    enabled: enabled && !!userId,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

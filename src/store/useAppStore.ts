// 앱 전역 상태 관리 Store: 사용자 상태, 논문 상태, 검색 상태 관리
import { create } from 'zustand';
import { toast } from 'sonner';

// 앱 상태 인터페이스
interface AppState {
  // User state
  isLoggedIn: boolean;
  userId: string | null;
  userName: string | null;
  bookmarkedPaperIds: string[];
  
  // Paper state
  selectedPaperId: string | null;
  recentlyViewedPaperIds: number[];
  
  // Search state
  searchQuery: string;
  
  // Actions
  login: (userName: string, userId: string) => void;
  logout: () => void;
  toggleBookmark: (paperId: number) => void;
  setSelectedPaper: (paperId: string | null) => void;
  setSearchQuery: (query: string) => void;
  addRecentlyViewedPaper: (paperId: number) => void;
  updateUser: (updates: Partial<Pick<AppState, 'userName' | 'userId'>>) => void;
}

// 초기 상태: 앱 시작 시 또는 로그아웃 시 사용되는 기본 상태값
const initialState = {
  isLoggedIn: false,
  userId: null,
  userName: null,
  bookmarkedPaperIds: [],
  selectedPaperId: null,
  recentlyViewedPaperIds: [],
  searchQuery: '',
};
export const useAppStore = create<AppState>((set) => ({
  ...initialState,

  // 로그인 액션: 사용자 로그인 시 앱 상태 업데이트
  login: (userName: string, userId: string) => {
    set({
      isLoggedIn: true,
      userName,
      userId,
    });
  },

  // 로그아웃 액션: 모든 앱 상태를 초기 상태로 리셋
  logout: () => {
    set(initialState);
  },

  // 북마크 토글 액션: 논문 북마크 상태 토글 (로그인 체크, 토스트 메시지 포함)
  toggleBookmark: (paperId: number) => {
    const paperIdStr = String(paperId);
    set((state) => {
      if (!state.isLoggedIn) {
        toast.error('로그인이 필요합니다', {
          description: '북마크 기능을 사용하려면 로그인해주세요.',
        });
        return state;
      }

      const isBookmarked = state.bookmarkedPaperIds.includes(paperIdStr);
      const newBookmarkedIds = isBookmarked
        ? state.bookmarkedPaperIds.filter((id) => id !== paperIdStr)
        : [...state.bookmarkedPaperIds, paperIdStr];

      toast.success(isBookmarked ? '북마크가 해제되었습니다' : '내 서재에 추가되었습니다');

      return {
        ...state,
        bookmarkedPaperIds: newBookmarkedIds,
      };
    });
  },

  // 선택된 논문 설정 액션: 선택된 논문 ID 설정 (null이면 선택 해제)
  setSelectedPaper: (paperId: string | null) => {
    set({ selectedPaperId: paperId });
  },

  // 검색 쿼리 설정 액션: 검색어 설정
  setSearchQuery: (query: string) => {
    set({ searchQuery: query });
  },

  // 최근 조회한 논문 추가 액션: 논문 조회 시 최근 조회 목록에 추가 (최신순, 최대 10개)
  addRecentlyViewedPaper: (paperId: number) => {
    set((state) => {
      const filtered = state.recentlyViewedPaperIds.filter((id) => id !== paperId);
      const newList = [paperId, ...filtered].slice(0, 10);
      
      return {
        ...state,
        recentlyViewedPaperIds: newList,
      };
    });
  },

  // 사용자 정보 업데이트 액션: 사용자 정보 부분 업데이트
  updateUser: (updates) => {
    set((state) => ({
      ...state,
      ...updates,
    }));
  },
}));


import { useAuthStore } from '../store/authStore';
import { useNavigation } from './useNavigation';
import { useAddBookmarkMutation, useDeleteBookmarkMutation, useBookmarksQuery } from './api';
import { recordRecommendationClick } from '../lib/api';
import { toast } from 'sonner';

export function usePaperActions() {
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const { goToPaper, goToLogin } = useNavigation();
  const addBookmarkMutation = useAddBookmarkMutation();
  const deleteBookmarkMutation = useDeleteBookmarkMutation();
  const { data: bookmarks = [] } = useBookmarksQuery();

  const handlePaperClick = (paperId: number | string, recommendationId?: string) => {
    if (!isLoggedIn) {
      goToLogin();
      return;
    }
    
    // 추천 논문인 경우 클릭 기록
    if (recommendationId) {
      recordRecommendationClick(recommendationId).catch(() => {
        // 클릭 기록 실패는 조용히 처리
      });
    }
    
    // 문자열 ID 그대로 사용 (API 명세에 맞춤)
    goToPaper(paperId);
  };

  const handleBookmark = (paperId: number | string, notes?: string) => {
    if (!isLoggedIn) {
      toast.error('로그인이 필요합니다', {
        description: '북마크 기능을 사용하려면 로그인해주세요.',
      });
      goToLogin();
      return;
    }
    
    // 논문 ID를 문자열로 변환
    const paperIdString = typeof paperId === 'string' ? paperId.trim() : String(paperId);
    
    // 유효성 검증
    if (!paperIdString || paperIdString === '') {
      toast.error('유효하지 않은 논문 ID입니다.');
      return;
    }
    
    // 북마크 목록에서 해당 논문의 북마크 찾기
    const bookmark = bookmarks.find(b => {
      const bookmarkPaperId = b.paper_id || (b.paper?.id ? String(b.paper.id) : null);
      return bookmarkPaperId === paperIdString;
    });
    
    if (bookmark) {
      // 이미 북마크된 경우 삭제
      if (bookmark.id) {
        deleteBookmarkMutation.mutate(bookmark.id);
      } else {
        toast.error('북마크 ID를 찾을 수 없습니다.');
      }
    } else {
      // 북마크되지 않은 경우 추가
      addBookmarkMutation.mutate({ paperId: paperIdString, notes });
    }
  };

  return {
    handlePaperClick,
    handleBookmark,
    isLoggedIn,
  };
}

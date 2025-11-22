import { useAuthStore } from '../store/authStore';
import { useNavigation } from './useNavigation';
import { useAddBookmarkMutation, useDeleteBookmarkMutation, useBookmarksQuery } from './api';
import { toast } from 'sonner';

export function usePaperActions() {
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const { goToPaper, goToLogin } = useNavigation();
  const addBookmarkMutation = useAddBookmarkMutation();
  const deleteBookmarkMutation = useDeleteBookmarkMutation();
  const { data: bookmarks = [] } = useBookmarksQuery();

  const handlePaperClick = (paperId: number) => {
    if (!isLoggedIn) {
      goToLogin();
      return;
    }
    goToPaper(paperId);
  };

  const handleBookmark = (paperId: number, notes?: string) => {
    if (!isLoggedIn) {
      toast.error('로그인이 필요합니다', {
        description: '북마크 기능을 사용하려면 로그인해주세요.',
      });
      goToLogin();
      return;
    }
    
    // 논문 ID를 문자열로 변환
    const paperIdString = String(paperId);
    
    // 북마크 목록에서 해당 논문의 북마크 찾기
    const bookmark = bookmarks.find(b => {
      const bookmarkPaperId = b.paper_id || (b.paper?.id ? String(b.paper.id) : null);
      return bookmarkPaperId === paperIdString;
    });
    
    if (bookmark) {
      // 이미 북마크된 경우 삭제
      deleteBookmarkMutation.mutate(bookmark.id);
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

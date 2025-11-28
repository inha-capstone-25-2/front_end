import { useState, useMemo } from 'react';
import { Header } from '../layout/Header';
import { Footer } from '../layout/Footer';
import { Card, CardContent } from '../ui/card';
import { Bookmark, ArrowUpDown, Loader2 } from 'lucide-react';
import { PaginationControls } from '../ui/PaginationControls';
import { ScrollToTopButton } from '../layout/ScrollToTopButton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { UnifiedPaperCard } from '../papers/UnifiedPaperCard';
import { Alert, AlertDescription } from '../ui/alert';
import { useBookmarksQuery } from '../../hooks/api';
import { usePaperActions } from '../../hooks/usePaperActions';
import { useAuthStore } from '../../store/authStore';
import { Paper, BookmarkItem } from '../../lib/api';
import { useQueries } from '@tanstack/react-query';

export function MyLibraryPage() {
  const [sortBy, setSortBy] = useState<'recent' | 'title' | 'year'>('recent');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const { handlePaperClick, handleBookmark } = usePaperActions();
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  
  const { data: bookmarks = [], isLoading, isError, error } = useBookmarksQuery();

  // 논문 정보가 없는 북마크의 논문 정보를 가져오기
  const bookmarksWithoutPaper = bookmarks.filter(bookmark => !bookmark.paper && bookmark.paper_id);
  
  const paperDetailQueries = useQueries({
    queries: bookmarksWithoutPaper.map((bookmark) => ({
      queryKey: ['papers', 'detail', bookmark.paper_id],
      queryFn: async () => {
        try {
          const { getPaperDetail } = await import('../../lib/api');
          return await getPaperDetail(bookmark.paper_id);
        } catch (error) {
          console.error(`논문 정보 가져오기 실패 (${bookmark.paper_id}):`, error);
          return null;
        }
      },
      enabled: !!bookmark.paper_id,
      staleTime: 5 * 60 * 1000,
      retry: false,
    })),
  });

  // 논문 정보를 가져온 결과를 북마크에 병합
  const enrichedBookmarks: BookmarkItem[] = bookmarks.map((bookmark) => {
    if (bookmark.paper) {
      return bookmark; // 이미 논문 정보가 있으면 그대로 사용
    }
    
    // 논문 정보가 없는 경우, 가져온 논문 정보 찾기
    const paperDetailIndex = bookmarksWithoutPaper.findIndex(b => b.id === bookmark.id);
    if (paperDetailIndex >= 0 && paperDetailQueries[paperDetailIndex]?.data) {
      return {
        ...bookmark,
        paper: paperDetailQueries[paperDetailIndex].data!,
      };
    }
    
    return bookmark;
  });

  // BookmarkItem[]을 Paper[]로 변환
  const bookmarkedPapers = enrichedBookmarks
    .map(bookmark => {
      // 논문 정보가 있으면 그대로 사용
      if (bookmark.paper) {
        return bookmark.paper;
      }
      // 논문 정보가 없으면 최소한의 정보로 Paper 객체 생성
      return {
        id: bookmark.paper_id,
        title: `논문 (DOI: ${bookmark.paper_id})`,
        authors: '',
      } as Paper;
    })
    .filter(paper => paper.id); // ID가 있는 것만

  // 정렬
  const sortedPapers = [...bookmarkedPapers].sort((a, b) => {
    switch (sortBy) {
      case 'title':
        return a.title.localeCompare(b.title);
      case 'year': {
        const yearA = a.year != null ? Number(a.year) : 0;
        const yearB = b.year != null ? Number(b.year) : 0;

        // 유효한 숫자가 아니면 정렬에 영향을 주지 않도록 0으로 처리
        const safeYearA = Number.isNaN(yearA) ? 0 : yearA;
        const safeYearB = Number.isNaN(yearB) ? 0 : yearB;

        return safeYearB - safeYearA;
      }
      case 'recent':
      default:
        return 0; // 최근 추가 순 (현재는 ID 순)
    }
  });

  // 페이지네이션
  const totalPages = Math.ceil(sortedPapers.length / itemsPerPage);
  const currentPapers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedPapers.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedPapers, currentPage, itemsPerPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-600 mb-4">로그인이 필요한 페이지입니다.</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 bg-gray-50">
        <div className="max-w-[1200px] mx-auto px-4 md:px-6 lg:px-10 py-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <Bookmark className="h-7 w-7" style={{ color: '#4FA3D1' }} />
              <h1 className="text-3xl font-bold" style={{ color: '#215285' }}>
                내 서재
              </h1>
              <span className="text-gray-600">
                ({sortedPapers.length}개)
              </span>
            </div>

            <div className="flex items-center gap-3">
              <Select value={sortBy} onValueChange={(value: 'recent' | 'title' | 'year') => {
                setSortBy(value);
                setCurrentPage(1); // 정렬 변경 시 첫 페이지로
              }}>
                <SelectTrigger className="w-[180px]">
                  <ArrowUpDown className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="정렬 기준" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent">최근 추가순</SelectItem>
                  <SelectItem value="title">제목순</SelectItem>
                  <SelectItem value="year">연도순</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin mb-4" style={{ color: '#4FA3D1' }} />
              <p className="text-gray-600">북마크 목록을 불러오는 중...</p>
            </div>
          )}

          {/* Error State */}
          {isError && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>
                {error instanceof Error ? error.message : '북마크 목록을 불러오는 중 오류가 발생했습니다.'}
              </AlertDescription>
            </Alert>
          )}

          {/* Results */}
          {!isLoading && !isError && (
            <>
              {sortedPapers.length > 0 ? (
                <>
                  <div className="space-y-4 mb-12">
                    {currentPapers.map((paper) => (
                      <UnifiedPaperCard
                        key={paper.id}
                        paperId={paper.id}
                        title={paper.title}
                        authors={Array.isArray(paper.authors) ? paper.authors.join(', ') : paper.authors}
                        update_count={paper.update_count}
                        update_date={paper.update_date}
                        categories={paper.categories}
                        variant="search"
                        onPaperClick={handlePaperClick}
                        onToggleBookmark={handleBookmark}
                        isBookmarked={true}
                      />
                    ))}
                  </div>

                  {/* Pagination */}
                  <PaginationControls
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                  />
                </>
              ) : (
                <Card>
                  <CardContent className="p-12 text-center">
                    <Bookmark className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-600 text-lg mb-2">
                      북마크한 논문이 없습니다.
                    </p>
                    <p className="text-gray-500 text-sm">
                      관심 있는 논문을 북마크해보세요.
                    </p>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </main>
      <Footer />
      <ScrollToTopButton />
    </div>
  );
}

import { useState } from 'react';
import { Clock, Loader2 } from 'lucide-react';
import { Header } from '../layout/Header';
import { Footer } from '../layout/Footer';
import { UnifiedPaperCard } from '../papers/UnifiedPaperCard';
import { ScrollToTopButton } from '../layout/ScrollToTopButton';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '../ui/pagination';
import { Alert, AlertDescription } from '../ui/alert';
import { usePaperActions } from '../../hooks/usePaperActions';
import { useAuthStore } from '../../store/authStore';
import { useMyProfileQuery } from '../../hooks/api/useMyProfile';
import { useSearchHistoryQuery, useBookmarksQuery } from '../../hooks/api/usePapers';

const ITEMS_PER_PAGE = 10;

export function RecentlyViewedListPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const { handlePaperClick, handleBookmark } = usePaperActions();
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const { data: profile } = useMyProfileQuery();
  const userId = profile?.id || null;
  const { data: bookmarks = [] } = useBookmarksQuery();
  
  // 북마크 상태 확인 함수
  const isBookmarked = (paperId: string | number) => {
    return bookmarks.some(b => {
      const bookmarkPaperId = b.paper_id || (b.paper?.id ? String(b.paper.id) : null);
      return bookmarkPaperId === String(paperId);
    });
  };

  // 검색 기록 조회 (20개)
  const { data: searchHistoryData, isLoading, isError, error } = useSearchHistoryQuery(
    userId,
    20,
    isLoggedIn
  );

  const recentPapers = searchHistoryData?.papers || [];

  // 클라이언트 사이드 페이지네이션
  const totalPages = Math.ceil(recentPapers.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentPapers = recentPapers.slice(startIndex, endIndex);

  // 페이지 번호 생성 함수
  const getPageNumbers = () => {
    const pages: (number | 'ellipsis')[] = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('ellipsis');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('ellipsis');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push('ellipsis');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('ellipsis');
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

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

  // 로딩 상태 처리
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center bg-gray-50">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin" style={{ color: '#4FA3D1' }} />
            <p className="text-gray-600">검색 기록을 불러오는 중...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // 에러 상태 처리
  if (isError) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 bg-gray-50">
          <div className="max-w-[1200px] mx-auto px-4 md:px-6 lg:px-10 py-8">
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>
                {error instanceof Error ? error.message : '검색 기록을 불러오는 중 오류가 발생했습니다.'}
              </AlertDescription>
            </Alert>
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
          <div className="flex items-center gap-3 mb-8">
            <Clock className="h-7 w-7" style={{ color: '#4FA3D1' }} />
            <h1 className="text-3xl font-bold" style={{ color: '#215285' }}>
              최근 본 논문
            </h1>
          </div>

          <div className="space-y-4 mb-8">
            {currentPapers.length > 0 ? (
              currentPapers.map((paper) => {
                const authors = Array.isArray(paper.authors) ? paper.authors.join(', ') : paper.authors;
                const year = typeof paper.year === 'string' ? paper.year : String(paper.year);
                
                return (
                  <UnifiedPaperCard
                    key={paper.id}
                    paperId={paper.id}
                    title={paper.title}
                    authors={authors}
                    year={year}
                    publisher={paper.publisher}
                    variant="compact"
                    onPaperClick={handlePaperClick}
                    onToggleBookmark={handleBookmark}
                    isBookmarked={isBookmarked(paper.id)}
                  />
                );
              })
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">최근 본 논문이 없습니다.</p>
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center">
              <Pagination>
                <PaginationContent className="flex-wrap gap-1">
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                      className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                  
                  {getPageNumbers().map((page, index) => (
                    <PaginationItem key={index}>
                      {page === 'ellipsis' ? (
                        <PaginationEllipsis />
                      ) : (
                        <PaginationLink
                          onClick={() => handlePageChange(page as number)}
                          isActive={currentPage === page}
                          className="cursor-pointer"
                          style={
                            currentPage === page
                              ? { backgroundColor: '#4FA3D1', color: 'white', borderColor: '#4FA3D1' }
                              : {}
                          }
                        >
                          {page}
                        </PaginationLink>
                      )}
                    </PaginationItem>
                  ))}
                  
                  <PaginationItem>
                    <PaginationNext 
                      onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                      className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </div>
      </main>
      <Footer />
      <ScrollToTopButton />
    </div>
  );
}

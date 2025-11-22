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
import { useSearchHistoryQuery } from '../../hooks/api/usePapers';

const ITEMS_PER_PAGE = 10;

export function RecentlyViewedListPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const { handlePaperClick } = usePaperActions();
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const { data: profile } = useMyProfileQuery();
  const userId = profile?.id || null;

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
                  />
                );
              })
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">최근 본 논문이 없습니다.</p>
              </div>
            )}
          </div>

          {totalPages > 1 && (
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>
                
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                  if (
                    page === 1 ||
                    page === totalPages ||
                    (page >= currentPage - 1 && page <= currentPage + 1)
                  ) {
                    return (
                      <PaginationItem key={page}>
                        <PaginationLink
                          onClick={() => setCurrentPage(page)}
                          isActive={currentPage === page}
                          className="cursor-pointer"
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  } else if (page === currentPage - 2 || page === currentPage + 2) {
                    return (
                      <PaginationItem key={page}>
                        <PaginationEllipsis />
                      </PaginationItem>
                    );
                  }
                  return null;
                })}
                
                <PaginationItem>
                  <PaginationNext
                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                    className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </div>
      </main>
      <Footer />
      <ScrollToTopButton />
    </div>
  );
}

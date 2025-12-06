import { useState, useMemo, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { X, Loader2, RefreshCw } from 'lucide-react';
import { Header } from '../layout/Header';
import { SearchHeader } from '../layout/SearchHeader';
import { UnifiedPaperCard } from '../papers/UnifiedPaperCard';
import { CategoryFilter, getCategoryNameByCode } from '../category/CategoryFilter';
import { Footer } from '../layout/Footer';
import { ScrollToTopButton } from '../layout/ScrollToTopButton';
import { PaginationControls } from '../ui/PaginationControls';
import { Alert, AlertDescription } from '../ui/alert';
import { Button } from '../ui/button';
import { useSearchPapersQuery, SearchPapersParams, useBookmarksQuery } from '../../hooks/api';
import { usePaperActions } from '../../hooks/usePaperActions';
import { useQueryClient } from '@tanstack/react-query';

export function SearchResultsListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const searchQuery = searchParams.get('q') || '';
  const categoriesParam = searchParams.get('categories');
  const pageParam = searchParams.get('page');
  
  // URL에서 카테고리 파라미터 파싱 (메모이제이션)
  const selectedCategories = useMemo(() => {
    return categoriesParam 
      ? categoriesParam.split(',').filter(Boolean)
      : [];
  }, [categoriesParam]);
  
  // URL에서 페이지 파라미터 파싱
  const currentPage = useMemo(() => {
    return pageParam ? parseInt(pageParam, 10) : 1;
  }, [pageParam]);
  
  const [elapsedTime, setElapsedTime] = useState(0);
  const { handlePaperClick, handleBookmark } = usePaperActions();
  const queryClient = useQueryClient();
  const loadingStartTime = useRef<number | null>(null);
  const { data: bookmarks = [] } = useBookmarksQuery();
  
  // 북마크 상태 확인 함수
  const isBookmarked = (paperId: string | number) => {
    return bookmarks.some(b => {
      const bookmarkPaperId = b.paper_id || (b.paper?.id ? String(b.paper.id) : null);
      return bookmarkPaperId === String(paperId);
    });
  };

  // API 호출 파라미터 구성 (메모이제이션으로 불필요한 재생성 방지)
  const searchParams_obj: SearchPapersParams = useMemo(() => ({
    q: searchQuery,
    categories: selectedCategories.length > 0 ? selectedCategories : undefined,
    page: currentPage,
  }), [searchQuery, selectedCategories, currentPage]);

  // API에서 검색 결과 가져오기
  const { data: searchData, isLoading, isError, error, refetch } = useSearchPapersQuery(
    searchParams_obj,
    !!searchQuery
  );

  // 로딩 시간 추적
  useEffect(() => {
    if (isLoading) {
      loadingStartTime.current = Date.now();
      setElapsedTime(0);
      const interval = setInterval(() => {
        if (loadingStartTime.current) {
          const elapsed = Math.floor((Date.now() - loadingStartTime.current) / 1000);
          setElapsedTime(elapsed);
        }
      }, 1000);
      return () => {
        clearInterval(interval);
        loadingStartTime.current = null;
      };
    } else {
      loadingStartTime.current = null;
      setElapsedTime(0);
    }
  }, [isLoading]);

  // 서버에서 받은 데이터 사용
  const papers = searchData?.papers || [];
  const totalPages = searchData?.total ? Math.ceil(searchData.total / (searchData.pageSize || 10)) : 0;
  
  // 연도 필터 제거: 모든 논문 표시
  // const filteredPapers = papers.filter(paper => {
  //   // year가 없으면 필터링에서 제외 (표시)
  //   if (!paper.year) {
  //     return true;
  //   }
  //   
  //   const paperYear = typeof paper.year === 'string' ? parseInt(paper.year) : paper.year;
  //   const numericYear = Number(paperYear);
  //   
  //   // 유효한 숫자가 아니면 필터링에서 제외 (표시)
  //   if (isNaN(numericYear)) {
  //     return true;
  //   }
  //   
  //   // 유효한 숫자면 범위 체크
  //   return numericYear >= yearRange[0] && numericYear <= yearRange[1];
  // });
  
  const filteredPapers = papers;
  const currentPapers = filteredPapers;

  const handleCategorySelect = (categoryCode: string) => {
    const newCategories = selectedCategories.includes(categoryCode)
      ? selectedCategories.filter(code => code !== categoryCode)
      : [...selectedCategories, categoryCode];
    
    // URL 업데이트
    const newSearchParams = new URLSearchParams(searchParams);
    if (newCategories.length > 0) {
      newSearchParams.set('categories', newCategories.join(','));
    } else {
      newSearchParams.delete('categories');
    }
    newSearchParams.set('page', '1'); // 첫 페이지로 리셋
    setSearchParams(newSearchParams);
    
    // 스크롤을 맨 위로 이동
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRemoveCategory = (categoryCode: string) => {
    const newCategories = selectedCategories.filter(code => code !== categoryCode);
    
    // URL 업데이트
    const newSearchParams = new URLSearchParams(searchParams);
    if (newCategories.length > 0) {
      newSearchParams.set('categories', newCategories.join(','));
    } else {
      newSearchParams.delete('categories');
    }
    newSearchParams.set('page', '1'); // 첫 페이지로 리셋
    setSearchParams(newSearchParams);
    
    // 스크롤을 맨 위로 이동
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleClearAllFilters = () => {
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.delete('categories');
    newSearchParams.set('page', '1');
    setSearchParams(newSearchParams);
  };

  const handleSearch = (query: string) => {
    const newSearchParams = new URLSearchParams();
    newSearchParams.set('q', query);
    // 검색 시 카테고리와 페이지는 유지하지 않고 리셋
    setSearchParams(newSearchParams);
  };

  const handlePageChange = (page: number) => {
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.set('page', page.toString());
    setSearchParams(newSearchParams);
    // 스크롤을 맨 위로 이동
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <SearchHeader initialQuery={searchQuery} onSearch={handleSearch} />
      <main className="flex-1 bg-gray-50">
        <div className="max-w-[1400px] mx-auto px-4 md:px-6 lg:px-10 py-8">
          <div className="flex gap-6 lg:gap-8">
            {/* 좌측 필터 영역 */}
            <div className="hidden lg:flex lg:flex-col lg:w-64 lg:flex-shrink-0 lg:gap-4">
              <div className="sticky top-4 space-y-4">
                {/* 카테고리 필터 */}
                <div>
                  <CategoryFilter 
                    selectedCategories={selectedCategories}
                    onCategorySelect={handleCategorySelect}
                  />
                </div>
              </div>
            </div>

            {/* 우측 검색 결과 영역 */}
            <div className="flex-1 min-w-0">

              {/* Loading State */}
              {isLoading && (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin mb-4" style={{ color: '#4FA3D1' }} />
                  <p className="text-gray-600 mb-2">검색 중입니다. 잠시만 기다려주세요...</p>
                  {elapsedTime > 0 && (
                    <p className="text-xs text-gray-400">
                      경과 시간: {Math.floor(elapsedTime / 60)}분 {elapsedTime % 60}초
                    </p>
                  )}
                </div>
              )}

              {/* Error State */}
              {isError && (
                <Alert variant="destructive" className="mb-6">
                  <AlertDescription className="flex flex-col gap-3">
                    <div>
                      {(() => {
                        if (error instanceof Error) {
                          // 타임아웃 에러 확인
                          if (error.message.includes('timeout') || error.message.includes('타임아웃') || error.message.includes('시간이 초과')) {
                            return '응답 시간이 초과되었습니다. 서버 응답이 지연되고 있습니다. 잠시 후 다시 시도해주세요.';
                          }
                          // 네트워크 에러 확인
                          if (error.message.includes('네트워크') || error.message.includes('연결')) {
                            return error.message;
                          }
                          return error.message;
                        }
                        return '검색 중 오류가 발생했습니다.';
                      })()}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        queryClient.invalidateQueries({ queryKey: ['papers', 'search'] });
                        refetch();
                      }}
                      className="self-start"
                      style={{ borderColor: '#4FA3D1', color: '#4FA3D1' }}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      다시 시도
                    </Button>
                  </AlertDescription>
                </Alert>
              )}

              {/* Results */}
              {!isLoading && !isError && (
                <>
                  {/* Search Info */}
                  <div className="mb-6">
                    <p className="text-gray-600">
                      <span className="text-[#215285]">"{searchQuery}"</span>에 대한 검색 결과 
                      <span className="ml-2 text-sm text-gray-500">
                        ({searchData?.total || 0}개의 논문{searchData?.total && searchData.total > filteredPapers.length ? `, ${filteredPapers.length}개 표시` : ''})
                      </span>
                    </p>
                    
                    {/* 선택된 필터 표시 */}
                    {selectedCategories.length > 0 && (
                      <div className="mt-3 flex items-center gap-2 flex-wrap">
                        <span className="text-sm text-gray-500">필터:</span>
                        
                        {/* 카테고리 필터 */}
                        {selectedCategories.map((category) => (
                          <button
                            key={category}
                            onClick={() => handleRemoveCategory(category)}
                            className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm transition-colors"
                            style={{ 
                              backgroundColor: '#EAF4FA', 
                              color: '#4FA3D1',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = '#D5E9F5';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = '#EAF4FA';
                            }}
                          >
                            {getCategoryNameByCode(category)}
                            <X className="h-3 w-3" />
                          </button>
                        ))}
                        
                        {selectedCategories.length > 1 && (
                          <button
                            onClick={handleClearAllFilters}
                            className="text-sm text-gray-500 hover:text-[#4FA3D1] underline"
                          >
                            모두 지우기
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Paper List */}
                  <div className="space-y-4 mb-12">
                    {currentPapers.length > 0 ? (
                      currentPapers.map((paper) => (
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
                            isBookmarked={isBookmarked(paper.id)}
                          />
                      ))
                    ) : (
                      <div className="text-center py-12">
                        <p className="text-gray-500 text-lg">
                          {searchQuery ? '검색 결과가 없습니다.' : '검색어를 입력해주세요.'}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Pagination */}
                  <PaginationControls
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                  />
                </>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
      <ScrollToTopButton />
    </div>
  );
}

import { Clock, ChevronRight, Bookmark, ArrowRight, Loader2 } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../ui/tooltip';
import { useAuthStore } from '../../store/authStore';
import { useNavigation } from '../../hooks/useNavigation';
import { useMyProfileQuery } from '../../hooks/api/useMyProfile';
import { useSearchHistoryQuery } from '../../hooks/api/usePapers';

interface RecentlyViewedPapersProps {
  onPaperClick?: (paperId: string | number) => void;
  onViewAll?: () => void;
  bookmarkedPaperIds?: Array<string | number>;
  onToggleBookmark?: (paperId: string | number) => void;
}

export function RecentlyViewedPapers({ 
  onPaperClick, 
  onViewAll,
  bookmarkedPaperIds = [],
  onToggleBookmark,
}: RecentlyViewedPapersProps) {
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const { goToRecentPapers } = useNavigation();
  const { data: profile } = useMyProfileQuery();
  const userId = profile?.id || null;

  // 검색 기록 조회 (메인 페이지용 7개)
  const { data: searchHistoryData, isLoading, isError } = useSearchHistoryQuery(
    userId,
    7,
    isLoggedIn
  );

  const recentPapers = searchHistoryData?.papers || [];

  // 로딩 상태 처리
  if (isLoading) {
    return (
      <section className="w-full py-16 md:py-20 bg-[rgb(255,255,255)]">
        <div className="max-w-[1200px] mx-auto px-4 md:px-6 lg:px-10">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" style={{ color: '#4FA3D1' }} />
          </div>
        </div>
      </section>
    );
  }

  // 에러 상태 처리 또는 데이터가 없으면 섹션 숨김
  if (isError || recentPapers.length === 0) {
    return null;
  }

  const handleViewAll = () => {
    if (onViewAll) {
      onViewAll();
    } else {
      goToRecentPapers();
    }
  };
  return (
    <section className="w-full py-16 md:py-20 bg-[rgb(255,255,255)]">
      <div className="max-w-[1200px] mx-auto px-4 md:px-6 lg:px-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Clock className="h-7 w-7" style={{ color: '#4FA3D1' }} />
            <h2 className="text-[28px]" style={{ color: '#215285' }}>최근 조회 논문</h2>
          </div>
          <button
            onClick={handleViewAll}
            className="flex items-center gap-1 text-sm hover:underline transition-all"
            style={{ color: '#215285' }}
          >
            전체 보기
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Cards Container */}
        <div className="relative">
          <div className="overflow-x-auto pb-4 horizontal-scroll" style={{ scrollSnapType: 'x mandatory' }}>
            <div className="flex gap-4 min-w-max md:min-w-0">
              {recentPapers.map((paper) => {
                const authors = Array.isArray(paper.authors) ? paper.authors : [paper.authors];
                const year = typeof paper.year === 'string' ? paper.year : String(paper.year);
                const keywords = paper.keywords || [];
                
                return (
                  <Card
                    key={paper.id}
                    className="flex-shrink-0 w-[260px] sm:w-[280px] md:w-[220px] lg:w-[220px] hover:shadow-lg transition-shadow relative"
                    style={{ 
                      borderRadius: '12px',
                      scrollSnapAlign: 'start'
                    }}
                  >
                    <CardContent className="p-5 flex flex-col h-full">
                      {/* 북마크 아이콘 */}
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-gray-100 transition-all hover:scale-105 z-10"
                              onClick={(e) => {
                                e.stopPropagation();
                                onToggleBookmark?.(paper.id);
                              }}
                            >
                              <Bookmark
                                className="w-4 h-4 transition-colors"
                                style={{
                                  color: bookmarkedPaperIds.includes(paper.id) ? '#4FA3D1' : '#ccc',
                                  fill: bookmarkedPaperIds.includes(paper.id) ? '#4FA3D1' : 'none',
                                }}
                              />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{bookmarkedPaperIds.includes(paper.id) ? '북마크 해제' : '북마크 추가'}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>

                      {/* 제목 - 클릭 가능한 링크 */}
                      <h3 
                        className="mb-3 line-clamp-2 min-h-[3rem] cursor-pointer hover:text-[#4FA3D1] transition-colors pr-8"
                        style={{ color: '#215285' }}
                        onClick={() => onPaperClick?.(paper.id)}
                      >
                        {paper.title}
                      </h3>

                      {/* 저자 */}
                      <p className="text-sm text-gray-600 mb-2 line-clamp-1">
                        {authors.slice(0, 2).join(', ')}
                        {authors.length > 2 && ' 외'}
                      </p>

                      {/* 연도 및 출판사 */}
                      <p className="text-xs text-gray-500 mb-3">
                        {year} · {paper.publisher}
                      </p>

                      {/* 키워드 */}
                      {keywords.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-4">
                          {keywords.slice(0, 2).map((keyword: string, idx: number) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 text-xs rounded-full"
                              style={{
                                backgroundColor: '#E8F4F8',
                                color: '#215285'
                              }}
                            >
                              {keyword}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* 자세히 보기 링크 */}
                      <div className="mt-auto flex justify-end">
                        <button
                          onClick={() => onPaperClick?.(paper.id)}
                          className="flex items-center gap-1 text-sm transition-colors"
                          style={{ color: '#2563eb' }}
                          onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
                          onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
                        >
                          자세히 보기
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Sparkles, Loader2, Bookmark, ExternalLink, Star } from 'lucide-react';
import { Header } from '../layout/Header';
import { SearchHeader } from '../layout/SearchHeader';
import { Footer } from '../layout/Footer';
import { Separator } from '../ui/separator';
import { ScrollToTopButton } from '../layout/ScrollToTopButton';
import { usePaperDetailQuery, useBookmarksQuery, useRecommendationsQuery } from '../../hooks/api';
import type { Paper } from '../../lib/api';
import { usePaperActions } from '../../hooks/usePaperActions';
import { useAppStore } from '../../store/useAppStore';
import { Alert, AlertDescription } from '../ui/alert';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../ui/tooltip';
import { UnifiedPaperCard } from '../papers/UnifiedPaperCard';
import { Button } from '../ui/button';
import { useNavigation } from '../../hooks/useNavigation';

export function PaperDetailPage() {
  const { id } = useParams<{ id: string }>();
  // 문자열 ID 그대로 사용 (API 명세에 맞춤)
  const paperId = id || '';
  const { isLoggedIn, handlePaperClick, handleBookmark } = usePaperActions();
  const addRecentlyViewedPaper = useAppStore((state) => state.addRecentlyViewedPaper);
  const { data: bookmarks = [] } = useBookmarksQuery();

  const { data: paper, isLoading, isError, error } = usePaperDetailQuery(paperId, !!paperId);
  // 추천 논문 조회 (현재 상세 논문 ID 기준, 진입할 때마다 새로 요청)
  const { 
    data: recommendedPapers,
    isLoading: isLoadingRecommendations,
    isError: isErrorRecommendations,
    error: errorRecommendations 
  } = useRecommendationsQuery(paperId, 6, true);

  const typedRecommendedPapers: Paper[] = (recommendedPapers ?? []) as Paper[];

  const { goToLogin, goToSearch } = useNavigation();

  const handleSearch = (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return;

    if (!isLoggedIn) {
      goToLogin();
      return;
    }

    goToSearch(trimmed);
  };

  // 저자 확장/축소 상태
  const [isAuthorsExpanded, setIsAuthorsExpanded] = useState(false);
  const [showAuthorsToggle, setShowAuthorsToggle] = useState(false);
  const authorsRef = useRef<HTMLSpanElement | null>(null);

  // 저자가 2줄 이상인지 확인하여 토글 버튼 표시 여부 결정
  useEffect(() => {
    if (authorsRef.current) {
      const element = authorsRef.current;
      const computedStyle = getComputedStyle(element);
      const lineHeight = parseFloat(computedStyle.lineHeight || '0');
      if (lineHeight > 0) {
        const maxHeight = lineHeight * 2; // 2줄 높이
        setShowAuthorsToggle(element.scrollHeight > maxHeight);
      } else {
        setShowAuthorsToggle(false);
      }
    }
  }, [paper?.authors]);

  // 논문이 로드되면 최근 조회 목록에 추가
  useEffect(() => {
    if (paper && isLoggedIn) {
      const numericId = typeof paper.id === 'string' ? Number(paper.id) : paper.id;
      if (Number.isFinite(numericId)) {
        addRecentlyViewedPaper(numericId as number);
      }
    }
  }, [paper, isLoggedIn, addRecentlyViewedPaper]);

  // 북마크 상태 확인 함수
  const checkIsBookmarked = (paperId: string | number) => {
    return bookmarks.some(b => {
      const bookmarkPaperId = b.paper_id || (b.paper?.id ? String(b.paper.id) : null);
      return bookmarkPaperId === String(paperId);
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <SearchHeader onSearch={handleSearch} />
        <main className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin" style={{ color: '#4FA3D1' }} />
            <p className="text-gray-600">논문 정보를 불러오는 중...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (isError || !paper) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <SearchHeader onSearch={handleSearch} />
        <main className="flex-1">
          <div className="max-w-[1200px] mx-auto px-4 md:px-6 lg:px-10 py-8">
            <Alert variant="destructive">
              <AlertDescription>
                {error instanceof Error ? error.message : '논문 정보를 불러오는 중 오류가 발생했습니다.'}
              </AlertDescription>
            </Alert>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const isBookmarked = checkIsBookmarked(paper.id);

  // 원문 링크: API에서 externalUrl을 주면 우선 사용, 없으면 arXiv ID 기반 링크로 대체
  const externalUrl =
    paper.externalUrl ||
    (paper.id ? `https://arxiv.org/abs/${paper.id}` : undefined);

  // summary가 { en, ko } 객체로 올 수 있으므로 한국어 번역(ko)만 사용
  // - 요구사항: 요약과 한국어 요약을 나누지 않고 "요약" 섹션에 한국어 번역만 표시
  // - 한국어 번역이 없으면 요약 섹션을 표시하지 않음
  const rawSummary = paper.summary as unknown;
  let koSummaryText =
    rawSummary && typeof rawSummary === 'object'
      ? (rawSummary as any).ko ?? undefined
      : undefined;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <SearchHeader onSearch={handleSearch} />
      {/* 상세 페이지 본문 전체 폰트 크기 확대 (검색 영역 제외) */}
      <main className="flex-1">
        <div className="max-w-[1200px] mx-auto px-4 md:px-6 lg:px-10 py-8 text-lg md:text-xl">
          {/* Paper Detail */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-md p-6 md:p-8 mb-8 relative">
            {/* 북마크 버튼 */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition-all hover:scale-105 z-10"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleBookmark(paper.id);
                    }}
                  >
                    <Bookmark
                      className="w-5 h-5 transition-colors"
                      style={{
                        color: isBookmarked ? '#4FA3D1' : '#ccc',
                        fill: isBookmarked ? '#4FA3D1' : 'none',
                      }}
                    />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{isBookmarked ? '북마크 해제' : '북마크 추가'}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <div className="flex items-start gap-4 mb-6">
              <div className="flex-1">
                {/* 제목 */}
                <h1 className="text-2xl md:text-3xl font-extrabold mb-4" style={{ color: '#215285' }}>
                  {paper.title}
                </h1>
                
                {/* 저자 */}
                <div className="flex flex-col gap-1 text-gray-600 mb-4">
                  <span
                    ref={authorsRef}
                    className={isAuthorsExpanded ? '' : 'line-clamp-2'}
                  >
                    저자: {Array.isArray(paper.authors) ? paper.authors.join(', ') : paper.authors}
                  </span>
                  {showAuthorsToggle && (
                    <button
                      type="button"
                      className="text-sm text-[#215285] hover:underline self-start"
                      onClick={() => setIsAuthorsExpanded(!isAuthorsExpanded)}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.textDecoration = 'underline';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.textDecoration = 'none';
                      }}
                    >
                      {isAuthorsExpanded ? '간략히' : '더보기'}
                    </button>
                  )}
                </div>
                
                {/* 저널 */}
                <div className="flex flex-col gap-1 text-gray-600 mb-4">
                  <span>
                    저널: {(paper as any).journal || 'Undefined'}
                  </span>
                </div>
                
                {/* 카테고리 */}
                {paper.categories && paper.categories.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {paper.categories.map((cat: string, idx: number) => (
                      <span
                        key={idx}
                        className="px-3 py-1 rounded-full text-sm"
                        style={{ backgroundColor: '#EAF4FA', color: '#4FA3D1' }}
                      >
                        {cat}
                      </span>
                    ))}
                  </div>
                )}
                
                {/* 업데이트 & 원문 보기 영역 */}
                {(paper.update_date || externalUrl) && (
                  <div className="flex flex-wrap items-center gap-3 mb-4">
                    {paper.update_date && (
                      <span className="text-sm text-gray-500">
                        업데이트: {paper.update_date}
                      </span>
                    )}
                    {externalUrl && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="ml-auto border-[#215285] text-[#215285] hover:bg-[#215285] hover:text-white rounded-full"
                        onClick={() => window.open(externalUrl, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        원문 보기
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>

            <Separator className="my-6" />

            <div className="space-y-6">
              {/* 요약: 한국어 번역(ko)만 표시, 없으면 섹션을 표시하지 않음 */}
              {koSummaryText && (
                <section>
                  <h2 className="mb-4">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-7 w-7" style={{ color: '#4FA3D1' }} />
                      <span
                        className="text-2xl md:text-3xl font-extrabold"
                        style={{ color: '#215285' }}
                      >
                        요약
                      </span>
                    </div>
                  </h2>
                  <p className="text-xl md:text-2xl text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {koSummaryText}
                  </p>
                </section>
              )}
            </div>
          </div>

          {/* Recommended Papers */}
          <section className="mb-8">
            <h2 className="mb-6">
              <div className="flex items-center gap-2">
                <Star className="h-7 w-7" style={{ color: '#4FA3D1' }} />
                <span
                  className="text-2xl md:text-3xl font-extrabold"
                  style={{ color: '#215285' }}
                >
                  추천 논문
                </span>
              </div>
            </h2>
            {isLoadingRecommendations ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-6 w-6 animate-spin" style={{ color: '#4FA3D1' }} />
              </div>
            ) : isErrorRecommendations ? (
              <div className="text-center py-12">
                <Alert variant="destructive">
                  <AlertDescription>
                    추천 논문을 불러오는 중 오류가 발생했습니다.
                    {errorRecommendations instanceof Error && (
                      <span className="block mt-2 text-sm">
                        {errorRecommendations.message}
                      </span>
                    )}
                  </AlertDescription>
                </Alert>
              </div>
            ) : typedRecommendedPapers.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {typedRecommendedPapers.map((recommendedPaper: Paper) => (
                  <UnifiedPaperCard
                    key={recommendedPaper.id}
                    paperId={recommendedPaper.id}
                    title={recommendedPaper.title}
                    authors={Array.isArray(recommendedPaper.authors) ? recommendedPaper.authors.join(', ') : recommendedPaper.authors}
                    categories={recommendedPaper.categories}
                    update_date={recommendedPaper.update_date}
                    variant="recommended"
                    onPaperClick={handlePaperClick}
                    onToggleBookmark={handleBookmark}
                    isBookmarked={checkIsBookmarked(recommendedPaper.id)}
                    showSummary={false}
                    showBookmark={true}
                    recommendationId={recommendedPaper.recommendation_id}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500">추천 논문이 없습니다.</p>
              </div>
            )}
          </section>
        </div>
      </main>
      <Footer />
      <ScrollToTopButton />
    </div>
  );
}

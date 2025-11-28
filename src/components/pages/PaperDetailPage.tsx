import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Sparkles, Loader2, Bookmark } from 'lucide-react';
import { Header } from '../layout/Header';
import { SearchHeader } from '../layout/SearchHeader';
import { Footer } from '../layout/Footer';
import { Separator } from '../ui/separator';
import { ScrollToTopButton } from '../layout/ScrollToTopButton';
import { usePaperDetailQuery, useToggleBookmarkMutation, useBookmarksQuery } from '../../hooks/api';
import { usePaperActions } from '../../hooks/usePaperActions';
import { useAppStore } from '../../store/useAppStore';
import { Alert, AlertDescription } from '../ui/alert';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../ui/tooltip';
import { Paper } from '../../lib/api';
import { UnifiedPaperCard } from '../papers/UnifiedPaperCard';

// 추천 논문 Mock Data
const mockRecommendedPapers: Paper[] = [
  {
    id: 'mock-1',
    title: 'Transformer-based Language Models for Natural Language Understanding',
    authors: 'Smith, J., Johnson, A., Williams, B.',
    categories: ['cs.AI', 'cs.CL'],
    update_date: '2024-01-15',
    abstract: 'This paper presents a comprehensive study on transformer-based language models and their applications in natural language understanding tasks.',
  },
  {
    id: 'mock-2',
    title: 'Deep Learning Approaches to Computer Vision',
    authors: 'Chen, L., Kim, S., Patel, R.',
    categories: ['cs.CV', 'cs.LG'],
    update_date: '2024-01-10',
    abstract: 'We explore various deep learning architectures for computer vision tasks including object detection, image classification, and semantic segmentation.',
  },
  {
    id: 'mock-3',
    title: 'Reinforcement Learning in Multi-Agent Systems',
    authors: 'Anderson, M., Brown, K., Davis, P.',
    categories: ['cs.MA', 'cs.AI'],
    update_date: '2024-01-08',
    abstract: 'This research investigates reinforcement learning strategies for coordinating multiple agents in complex environments.',
  },
  {
    id: 'mock-4',
    title: 'Neural Architecture Search for Efficient Models',
    authors: 'Wilson, T., Martinez, C., Lee, H.',
    categories: ['cs.LG', 'cs.NE'],
    update_date: '2024-01-05',
    abstract: 'We propose a novel neural architecture search method that efficiently discovers optimal network structures for specific tasks.',
  },
];

export function PaperDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  // 문자열 ID 그대로 사용 (API 명세에 맞춤)
  const paperId = id || '';
  const { isLoggedIn, handlePaperClick, handleBookmark } = usePaperActions();
  const bookmarkedPaperIds = useAppStore((state) => state.bookmarkedPaperIds);
  const addRecentlyViewedPaper = useAppStore((state) => state.addRecentlyViewedPaper);
  const { data: bookmarks = [] } = useBookmarksQuery();
  
  const { data: paper, isLoading, isError, error } = usePaperDetailQuery(paperId, !!paperId);
  const toggleBookmarkMutation = useToggleBookmarkMutation();

  // 논문이 로드되면 최근 조회 목록에 추가
  useEffect(() => {
    if (paper && isLoggedIn) {
      addRecentlyViewedPaper(paper.id);
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
        <SearchHeader onSearch={() => {}} />
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
        <SearchHeader onSearch={() => {}} />
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

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <SearchHeader onSearch={() => {}} />
      <main className="flex-1">
        <div className="max-w-[1200px] mx-auto px-4 md:px-6 lg:px-10 py-8">
          {/* Paper Detail */}
          <div className="bg-white rounded-lg shadow-sm p-6 md:p-8 mb-8 relative">
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
              <div className="w-16 h-16 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#EAF4FA' }}>
                <Sparkles className="h-8 w-8" style={{ color: '#4FA3D1' }} />
              </div>
              <div className="flex-1">
                {/* 제목 */}
                <h1 className="text-2xl md:text-3xl font-bold mb-4" style={{ color: '#215285' }}>
                  {paper.title}
                </h1>
                
                {/* 저자 */}
                <div className="flex flex-wrap gap-4 text-gray-600 mb-4">
                  <span>{Array.isArray(paper.authors) ? paper.authors.join(', ') : paper.authors}</span>
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
                
                {/* 업데이트 날짜 */}
                {paper.update_date && (
                  <div className="text-sm text-gray-500 mb-4">
                    업데이트: {paper.update_date}
                  </div>
                )}
              </div>
            </div>

            <Separator className="my-6" />

            <div className="space-y-6">
              {/* 요약 (Summary) */}
              {paper.summary && (
                <section>
                  <h2 className="text-xl font-semibold mb-3" style={{ color: '#215285' }}>
                    Summary
                  </h2>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{paper.summary}</p>
                </section>
              )}
              
              {/* Abstract (Summary가 없을 경우 대체) */}
              {!paper.summary && paper.abstract && (
                <section>
                  <h2 className="text-xl font-semibold mb-3" style={{ color: '#215285' }}>
                    Abstract
                  </h2>
                  <p className="text-gray-700 leading-relaxed">{paper.abstract}</p>
                </section>
              )}
            </div>
          </div>

          {/* Recommended Papers */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-6" style={{ color: '#215285' }}>
              추천 논문
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {mockRecommendedPapers.map((recommendedPaper) => (
                <UnifiedPaperCard
                  key={recommendedPaper.id}
                  paperId={recommendedPaper.id}
                  title={recommendedPaper.title}
                  authors={recommendedPaper.authors}
                  categories={recommendedPaper.categories}
                  update_date={recommendedPaper.update_date}
                  variant="recommended"
                  onPaperClick={handlePaperClick}
                  onToggleBookmark={handleBookmark}
                  isBookmarked={checkIsBookmarked(recommendedPaper.id)}
                  showSummary={false}
                  showBookmark={true}
                />
              ))}
            </div>
          </section>
        </div>
      </main>
      <Footer />
      <ScrollToTopButton />
    </div>
  );
}

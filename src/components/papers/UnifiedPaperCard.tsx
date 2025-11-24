import { FileText, User, BookOpen, ArrowRight, Bookmark, ExternalLink } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../ui/tooltip';
import { UnifiedPaperCardProps } from '../../types/paper';

/**
 * 통합 PaperCard 컴포넌트
 * 
 * variant에 따라 다른 레이아웃을 렌더링합니다:
 * - 'default': 기본 카드 레이아웃
 * - 'list': 목록 형태 (PaperListCard 스타일)
 * - 'search': 검색 결과 형태 (SearchResultCard 스타일)
 * - 'compact': 컴팩트 형태 (PaperListItemCard 스타일)
 * - 'recommended': 추천 논문 형태 (RecommendedPaperCard 스타일)
 */
export function UnifiedPaperCard({
  paperId,
  title,
  authors,
  publisher,
  year,
  pages,
  summary,
  translatedSummary,
  externalUrl,
  update_count,
  update_date,
  categories,
  isBookmarked = false,
  onToggleBookmark,
  onPaperClick,
  variant = 'default',
  showSummary = false,
  showTranslatedSummary = false,
  showBookmark = true,
  showExternalLink = false,
  className,
}: UnifiedPaperCardProps) {
  const authorsText = Array.isArray(authors) ? authors.join(', ') : authors;
  const yearText = year ? String(year) : undefined;

  const handleCardClick = () => {
    if (onPaperClick) {
      onPaperClick(paperId);
    }
  };

  const handleBookmarkClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onToggleBookmark) {
      onToggleBookmark(paperId);
    }
  };

  // 북마크 버튼 렌더링
  const renderBookmark = () => {
    if (!showBookmark || !onToggleBookmark) return null;

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              className={`absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition-all hover:scale-105 z-10 ${
                variant === 'recommended' ? 'top-3 right-3 p-1.5' : ''
              }`}
              onClick={handleBookmarkClick}
            >
              <Bookmark
                className={`transition-colors ${
                  variant === 'recommended' ? 'w-4 h-4' : 'w-5 h-5'
                }`}
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
    );
  };

  // Search variant: 검색 결과 형태
  if (variant === 'search') {
    return (
      <Card 
        className={`transition-shadow hover:shadow-md relative cursor-pointer ${className || ''}`}
        onClick={handleCardClick}
      >
        <CardContent className="p-4 md:p-6">
          {renderBookmark()}

          <div className="flex gap-4">
            {/* Left: Icon */}
            <div className="flex-shrink-0">
              <div
                className="w-16 h-16 md:w-20 md:h-20 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: '#EAF4FA' }}
              >
                <FileText className="h-8 w-8 md:h-10 md:w-10" style={{ color: '#4FA3D1' }} />
              </div>
            </div>

            {/* Right: Content */}
            <div className="flex-1 min-w-0 space-y-3">
              <h3 
                className="line-clamp-2 cursor-pointer hover:text-[#4FA3D1] transition-colors" 
                style={{ color: '#215285' }}
                onClick={handleCardClick}
              >
                {title}
              </h3>

              {/* Authors */}
              <div className="text-sm text-gray-600">
                <span>{authorsText}</span>
              </div>

              {/* Meta Info: update_count/update_date and categories */}
              <div className="flex flex-wrap items-center gap-3">
                {/* Update Count or Update Date */}
                {update_count !== undefined && update_count !== null ? (
                  <span className="text-sm text-gray-600">
                    업데이트: {update_count}회
                  </span>
                ) : update_date ? (
                  <span className="text-sm text-gray-600">
                    업데이트: {update_date}
                  </span>
                ) : (
                  <span className="text-sm text-gray-400">
                    업데이트: -
                  </span>
                )}

                {/* Categories */}
                {categories && categories.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {categories.map((category, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                        style={{
                          backgroundColor: '#EAF4FA',
                          color: '#4FA3D1',
                        }}
                      >
                        {category}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* View Original Button */}
              {showExternalLink && externalUrl && (
                <div className="pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-[#215285] text-[#215285] hover:bg-[#215285] hover:text-white"
                    onClick={() => window.open(externalUrl, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    원문 보기
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Compact variant: 컴팩트 형태
  if (variant === 'compact') {
    return (
      <Card className={`transition-all hover:shadow-md hover:border-[#4FA3D1] relative ${className || ''}`}>
        <CardContent className="p-4 md:p-5">
          {renderBookmark()}
          
          <div className="flex gap-4">
            {/* Left: Icon */}
            <div className="flex-shrink-0">
              <div
                className="w-12 h-12 md:w-14 md:h-14 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: '#EAF4FA' }}
              >
                <FileText className="h-6 w-6 md:h-7 md:w-7" style={{ color: '#4FA3D1' }} />
              </div>
            </div>

            {/* Middle: Content */}
            <div className="flex-1 min-w-0 flex flex-col justify-between">
              <div>
                <h3
                  className="line-clamp-2 mb-2 cursor-pointer hover:text-[#4FA3D1] transition-colors"
                  style={{ color: '#215285' }}
                  onClick={handleCardClick}
                >
                  {title}
                </h3>

                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-600">
                  <span className="truncate">{authorsText}</span>
                  <span className="text-gray-400">•</span>
                  <span>{publisher}</span>
                  {yearText && (
                    <>
                      <span className="text-gray-400">•</span>
                      <span>{yearText}</span>
                    </>
                  )}
                </div>
              </div>

              {/* 자세히 보기 링크 */}
              <div className="flex justify-end mt-2">
                <button
                  onClick={handleCardClick}
                  className="flex items-center gap-1 text-sm transition-colors"
                  style={{ color: '#2563eb' }}
                  onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
                  onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
                >
                  자세히 보기
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Recommended variant: 추천 논문 형태
  if (variant === 'recommended') {
    return (
      <Card className={`transition-all hover:shadow-md hover:border-[#4FA3D1] relative ${className || ''}`}>
        <CardContent className="p-5 flex flex-col h-full">
          {renderBookmark()}

          <div className="flex items-start mb-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: '#EAF4FA' }}
            >
              <FileText className="h-5 w-5" style={{ color: '#4FA3D1' }} />
            </div>
          </div>

          <h4
            onClick={handleCardClick}
            className="line-clamp-2 min-h-[3rem] mb-3 cursor-pointer hover:text-[#4FA3D1] transition-colors pr-6"
            style={{ color: '#215285' }}
          >
            {title}
          </h4>

          {/* Summary */}
          {showSummary && summary && (
            <p className="text-sm text-gray-600 line-clamp-3 mb-4">{summary}</p>
          )}

          {/* 자세히 보기 링크 */}
          <div className="mt-auto flex justify-end">
            <button
              onClick={handleCardClick}
              className="flex items-center gap-1 text-sm transition-colors hover:underline"
              style={{ color: '#2563eb' }}
            >
              자세히 보기
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Default/List variant: 목록 형태 (가장 많이 사용됨)
  return (
    <Card className={`transition-shadow hover:shadow-md relative ${className || ''}`}>
      <CardContent className="p-4 md:p-6">
        {renderBookmark()}

        <div className="flex gap-4">
          {/* Left: Icon/Thumbnail */}
          <div className="flex-shrink-0">
            <div
              className="w-16 h-16 md:w-20 md:h-20 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: '#EAF4FA' }}
            >
              <FileText className="h-8 w-8 md:h-10 md:w-10" style={{ color: '#4FA3D1' }} />
            </div>
          </div>

          {/* Right: Content */}
          <div className="flex-1 min-w-0 flex flex-col">
            {/* 제목 - 클릭 가능한 링크 */}
            <h3
              onClick={handleCardClick}
              className="line-clamp-2 cursor-pointer hover:text-[#4FA3D1] transition-colors mb-2"
              style={{ color: '#215285' }}
            >
              {title}
            </h3>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600 mb-2">
              <div className="flex items-center gap-1">
                <User className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">{authorsText}</span>
              </div>

              <div className="flex items-center gap-1">
                <BookOpen className="h-4 w-4 flex-shrink-0" />
                <span>{publisher}</span>
              </div>

              {pages && <span className="text-gray-500">{pages}</span>}
              {yearText && !pages && <span className="text-gray-500">{yearText}</span>}
            </div>

            {/* Summary */}
            {showSummary && summary && (
              <p className="text-sm text-gray-600 line-clamp-2 mb-3">{summary}</p>
            )}

            {/* 자세히 보기 링크 */}
            <div className="mt-auto flex justify-end">
              <button
                onClick={handleCardClick}
                className="flex items-center gap-1 text-sm transition-colors"
                style={{ color: '#2563eb' }}
                onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
                onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
              >
                자세히 보기
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

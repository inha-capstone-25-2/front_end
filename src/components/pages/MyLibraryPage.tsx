import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Header } from '../layout/Header';
import { Footer } from '../layout/Footer';
import { SearchHeader } from '../layout/SearchHeader';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Bookmark, ArrowUpDown, Loader2 } from 'lucide-react';
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
import { Paper } from '../../lib/api';

export function MyLibraryPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const searchQuery = searchParams.get('q') || '';
  const [sortBy, setSortBy] = useState<'recent' | 'title' | 'year'>('recent');
  const { handlePaperClick, handleBookmark } = usePaperActions();
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  
  const { data: bookmarks = [], isLoading, isError, error } = useBookmarksQuery();

  // BookmarkItem[]을 Paper[]로 변환 (논문 정보가 있는 것만)
  const bookmarkedPapers = bookmarks
    .filter(bookmark => bookmark.paper) // 논문 정보가 있는 북마크만 필터링
    .map(bookmark => bookmark.paper!); // 논문 정보가 있으므로 non-null assertion 사용

  // 검색어 필터
  const filteredPapers = bookmarkedPapers.filter(paper => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const authors = Array.isArray(paper.authors) ? paper.authors.join(', ') : paper.authors;
    return (
      paper.title.toLowerCase().includes(query) ||
      authors.toLowerCase().includes(query)
    );
  });

  // 정렬
  const sortedPapers = [...filteredPapers].sort((a, b) => {
    switch (sortBy) {
      case 'title':
        return a.title.localeCompare(b.title);
      case 'year':
        const yearA = typeof a.year === 'string' ? parseInt(a.year) : a.year;
        const yearB = typeof b.year === 'string' ? parseInt(b.year) : b.year;
        return yearB - yearA;
      case 'recent':
      default:
        return 0; // 최근 추가 순 (현재는 ID 순)
    }
  });

  const handleSearch = (query: string) => {
    setSearchParams({ q: query });
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
      <SearchHeader initialQuery={searchQuery} onSearch={handleSearch} />
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
              <Select value={sortBy} onValueChange={(value: 'recent' | 'title' | 'year') => setSortBy(value)}>
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
                <div className="space-y-4">
                  {sortedPapers.map((paper) => (
                    <Card key={paper.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <UnifiedPaperCard
                              paperId={paper.id}
                              title={paper.title}
                              authors={Array.isArray(paper.authors) ? paper.authors.join(', ') : paper.authors}
                              year={typeof paper.year === 'string' ? paper.year : String(paper.year)}
                              publisher={paper.publisher}
                              variant="compact"
                              onPaperClick={handlePaperClick}
                            />
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleBookmark(paper.id)}
                            className="ml-4"
                          >
                            <Bookmark
                              className="h-5 w-5"
                              style={{
                                color: '#4FA3D1',
                                fill: '#4FA3D1',
                              }}
                            />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="p-12 text-center">
                    <Bookmark className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-600 text-lg mb-2">
                      {searchQuery ? '검색 결과가 없습니다.' : '북마크한 논문이 없습니다.'}
                    </p>
                    <p className="text-gray-500 text-sm">
                      {searchQuery ? '다른 검색어를 시도해보세요.' : '관심 있는 논문을 북마크해보세요.'}
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

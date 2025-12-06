import React, { useState, useEffect, useCallback } from 'react';
import { Search, X } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { ScrollArea, ScrollBar } from '../ui/scroll-area';
import { useAuthStore } from '../../store/authStore';
import { loadRecentSearches, saveSearchKeyword, removeSearchKeyword } from '../../utils/localSearchHistory';

/**
 * SearchHeader 컴포넌트 Props
 */
interface SearchHeaderProps {
  /** 초기 검색어 */
  initialQuery?: string;
  /** 검색 실행 핸들러 */
  onSearch: (query: string) => void;
  /** 입력 필드 플레이스홀더 */
  placeholder?: string;
  /** 최근 검색어 표시 여부 */
  showRecentSearches?: boolean;
  /** 최대 최근 검색어 개수 */
  maxRecentSearches?: number;
  /** 추가 CSS 클래스 */
  className?: string;
  /** 자동 포커스 여부 */
  autoFocus?: boolean;
  /** 비활성화 상태 */
  disabled?: boolean;
}

/**
 * 검색 헤더 컴포넌트
 * 
 * 검색 입력 필드와 최근 검색어를 표시합니다.
 * 
 * @example
 * ```tsx
 * <SearchHeader
 *   initialQuery="BERT"
 *   onSearch={(query) => handleSearch(query)}
 *   autoFocus={true}
 *   showRecentSearches={true}
 * />
 * ```
 */
export function SearchHeader({ 
  initialQuery = '', 
  onSearch,
  placeholder = '논문 제목 또는 키워드를 입력하세요',
  showRecentSearches = true,
  maxRecentSearches = 8,
  className,
  autoFocus = false,
  disabled = false
}: SearchHeaderProps) {
  const [searchValue, setSearchValue] = useState(initialQuery);
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  // 마운트 시 localStorage에서 최근 검색어 로드
  useEffect(() => {
    setRecentSearches(loadRecentSearches(maxRecentSearches));
  }, [maxRecentSearches]);

  // Optimistic Update로 검색 기록 즉시 추가
  const handleSearch = useCallback(() => {
    if (searchValue.trim()) {
      const trimmedValue = searchValue.trim();

      // localStorage 기반으로 최근 검색어 관리
      const updated = saveSearchKeyword(trimmedValue, maxRecentSearches);
      setRecentSearches(updated);

      onSearch(trimmedValue);
    }
  }, [searchValue, onSearch, maxRecentSearches]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  }, [handleSearch]);

  // localStorage에서만 제거
  const removeSearch = useCallback((searchToRemove: string) => {
    const updated = removeSearchKeyword(searchToRemove, maxRecentSearches);
    setRecentSearches(updated);
  }, [maxRecentSearches]);

  return (
    <div className={`sticky top-0 z-40 w-full bg-white border-b border-gray-200 shadow-sm ${className || ''}`}>
      <div className="max-w-[1200px] mx-auto px-4 md:px-6 lg:px-10 py-4">
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
            <div className="flex-1 relative">
              <Input
                id="search-header"
                name="search-header"
                type="text"
                placeholder={placeholder}
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                onKeyPress={handleKeyPress}
                autoFocus={autoFocus}
                disabled={disabled}
                className="w-full pr-12 py-8 text-base md:text-lg border-gray-300 focus:border-[#4FA3D1] focus:ring-[#4FA3D1] disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  borderRadius: "var(--input-border-radius)",
                }}
              />
              {/* Mobile Search Icon */}
              <button
                onClick={handleSearch}
                disabled={disabled}
                className="absolute right-3 top-1/2 -translate-y-1/2 sm:hidden p-2 rounded-full hover:bg-gray-100 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ color: "#4FA3D1" }}
                aria-label="검색"
              >
                <Search className="h-5 w-5" />
              </button>
            </div>
            {/* Desktop Search Button */}
            <Button
              size="lg"
              onClick={handleSearch}
              disabled={disabled}
              className="hidden sm:flex text-white px-10 py-8 text-base md:text-lg items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: "#4FA3D1" }}
            >
              <Search className="h-6 w-6" />
              검색
            </Button>
          </div>

          {/* Recent Searches */}
          {showRecentSearches && isLoggedIn && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500 whitespace-nowrap">최근 검색:</span>
              {recentSearches.length > 0 ? (
                <ScrollArea className="w-full max-h-[40px]">
                  <div className="flex gap-2 pb-2 pr-2">
                    {recentSearches.map((search, index) => (
                      <button
                        key={`${search}-${index}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-100 hover:bg-gray-200 text-sm text-gray-700 whitespace-nowrap transition-colors flex-shrink-0"
                        onClick={() => {
                          setSearchValue(search);
                          onSearch(search);
                        }}
                      >
                        {search}
                        <X
                          className="h-3 w-3 hover:text-red-500 transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeSearch(search);
                          }}
                        />
                      </button>
                    ))}
                  </div>
                  <ScrollBar orientation="horizontal" />
                </ScrollArea>
              ) : (
                <span className="text-sm text-gray-400">검색 기록이 없습니다</span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect, useMemo } from 'react';
import { Search, X } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { ScrollArea, ScrollBar } from '../ui/scroll-area';
import { useSearchHistory } from '../../hooks/api';
import { useAuthStore } from '../../store/authStore';
import { useQueryClient } from '@tanstack/react-query';

interface SearchHeaderProps {
  initialQuery?: string;
  onSearch: (query: string) => void;
  placeholder?: string;
  showRecentSearches?: boolean;
  maxRecentSearches?: number;
  className?: string;
}

export function SearchHeader({ 
  initialQuery = '', 
  onSearch,
  placeholder = '논문 제목 또는 키워드를 입력하세요',
  showRecentSearches = true,
  maxRecentSearches = 8,
  className
}: SearchHeaderProps) {
  const [searchValue, setSearchValue] = useState(initialQuery);
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const queryClient = useQueryClient();
  
  // 백엔드에서 검색 기록 가져오기
  const { data: searchHistoryData, isLoading: isLoadingHistory } = useSearchHistory(undefined, maxRecentSearches);
  
  // 검색어 키워드만 추출
  const recentSearches = useMemo(() => {
    if (!searchHistoryData) return [];
    return searchHistoryData.map(item => item.query).filter(Boolean);
  }, [searchHistoryData]);

  useEffect(() => {
    if (initialQuery) {
      // 검색 기록 갱신
      queryClient.invalidateQueries({ queryKey: ['searchHistory'] });
    }
  }, [initialQuery, queryClient]);

  const handleSearch = () => {
    if (searchValue.trim()) {
      const trimmedValue = searchValue.trim();
      
      // 검색 기록 갱신 (백엔드에 저장됨)
      queryClient.invalidateQueries({ queryKey: ['searchHistory'] });
      
      onSearch(trimmedValue);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const removeSearch = (searchToRemove: string) => {
    // 프론트에서만 제거 (백엔드 삭제 API가 있다면 추가 가능)
    // 현재는 UI에서만 제거하고, 새로고침 시 다시 나타날 수 있음
    queryClient.invalidateQueries({ queryKey: ['searchHistory'] });
  };

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
                className="w-full pr-12 py-8 text-base md:text-lg border-gray-300 focus:border-[#4FA3D1] focus:ring-[#4FA3D1]"
                style={{
                  borderRadius: "var(--input-border-radius)",
                }}
              />
              {/* Mobile Search Icon */}
              <button
                onClick={handleSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 sm:hidden p-2 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
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
              className="hidden sm:flex text-white px-10 py-8 text-base md:text-lg items-center gap-2 cursor-pointer"
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
              {isLoadingHistory ? (
                <span className="text-sm text-gray-400">로딩 중...</span>
              ) : recentSearches.length > 0 ? (
                <ScrollArea className="w-full max-h-[40px]">
                  <div className="flex gap-2 pb-2 pr-2">
                    {recentSearches.map((search, index) => (
                      <button
                        key={index}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-100 hover:bg-gray-200 text-sm text-gray-700 whitespace-nowrap transition-colors flex-shrink-0"
                        onClick={() => {
                          setSearchValue(search);
                          onSearch(search);
                        }}
                      >
                        {search}
                        <X
                          className="h-3 w-3 hover:text-red-500"
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

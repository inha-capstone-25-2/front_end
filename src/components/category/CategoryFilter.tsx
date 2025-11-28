import { useState } from 'react';
import { ChevronRight, ChevronDown, Filter } from 'lucide-react';
import { Button } from '../ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from '../ui/sheet';
import { ScrollArea } from '../ui/scroll-area';
import { Card, CardContent } from '../ui/card';
import { Checkbox } from '../ui/checkbox';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';

interface SubCategory {
  name: string;
  code: string;
}

interface Category {
  id: string;
  name: string;
  subCategories: SubCategory[];
}

interface CategoryFilterProps {
  selectedCategories?: string[];
  onCategorySelect: (categoryCode: string) => void;
  onRemoveCategory?: (categoryCode: string) => void;
}

const categories: Category[] = [
  {
    id: 'ai',
    name: '인공지능',
    subCategories: [
      { name: '인공지능', code: 'cs.AI' },
      { name: '기계학습', code: 'cs.LG' },
      { name: '신경 및 진화 계산', code: 'cs.NE' },
      { name: '자연어 처리', code: 'cs.CL' },
      { name: '컴퓨터 비전', code: 'cs.CV' },
      { name: '멀티미디어', code: 'cs.MM' },
      { name: '정보 검색', code: 'cs.IR' },
    ],
  },
  {
    id: 'database',
    name: '데이터베이스',
    subCategories: [
      { name: '데이터베이스', code: 'cs.DB' },
      { name: '디지털 라이브러리', code: 'cs.DL' },
      { name: '컴퓨터와 사회', code: 'cs.CY' },
    ],
  },
  {
    id: 'systems',
    name: '시스템',
    subCategories: [
      { name: '운영체제', code: 'cs.OS' },
      { name: '분산 및 병렬 컴퓨팅', code: 'cs.DC' },
      { name: '네트워크 및 인터넷 아키텍처', code: 'cs.NI' },
      { name: '제어 시스템', code: 'cs.SY' },
      { name: '소프트웨어 공학', code: 'cs.SE' },
      { name: '프로그래밍 언어', code: 'cs.PL' },
      { name: '하드웨어 아키텍처', code: 'cs.AR' },
      { name: '컴퓨터 공학', code: 'cs.CE' },
      { name: '기타 컴퓨터 과학 일반', code: 'cs.OH' },
    ],
  },
  {
    id: 'security',
    name: '보안',
    subCategories: [
      { name: '암호학 및 보안', code: 'cs.CR' },
      { name: '정보 이론', code: 'cs.IT' },
    ],
  },
  {
    id: 'theory',
    name: '계산 이론',
    subCategories: [
      { name: '계산 복잡도', code: 'cs.CC' },
      { name: '형식 언어 및 자동자', code: 'cs.FL' },
      { name: '수리 논리', code: 'cs.LO' },
      { name: '자료구조 및 알고리즘', code: 'cs.DS' },
      { name: '이산수학', code: 'cs.DM' },
      { name: '성능 및 형식 검증', code: 'cs.PF' },
    ],
  },
  {
    id: 'graphics',
    name: '그래픽스',
    subCategories: [
      { name: '계산 기하학', code: 'cs.CG' },
      { name: '그래픽스', code: 'cs.GR' },
      { name: '기하 위상학', code: 'cs.GT' },
      { name: '수학적 소프트웨어', code: 'cs.MS' },
      { name: '일반 문헌/기하 모델링', code: 'cs.GL' },
    ],
  },
  {
    id: 'simulation',
    name: '시뮬레이션',
    subCategories: [
      { name: '수치 해석', code: 'cs.NA' },
      { name: '공학 응용', code: 'cs.ET' },
      { name: '과학적 계산', code: 'cs.SC' },
      { name: '음향 및 신호 처리', code: 'cs.SD' },
      { name: '시뮬레이션 및 모델링', code: 'cs.SI' },
      { name: '로봇공학', code: 'cs.RO' },
      { name: '계산생물학', code: 'cs.MA' },
    ],
  },
  {
    id: 'hci',
    name: '인간-컴퓨터',
    subCategories: [
      { name: '인간-컴퓨터 상호작용', code: 'cs.HC' },
    ],
  },
];

// 카테고리 코드로 이름 찾기
export function getCategoryNameByCode(code: string): string {
  for (const category of categories) {
    const subCategory = category.subCategories.find(sub => sub.code === code);
    if (subCategory) {
      return subCategory.name;
    }
  }
  return code;
}

function CategoryTreeContent({ selectedCategories = [], onCategorySelect }: CategoryFilterProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  return (
    <div className="space-y-1">
      {categories.map((category) => {
        const isExpanded = expandedCategories.has(category.id);

        return (
          <div key={category.id}>
            {/* 상위 카테고리 */}
            <button
              onClick={() => toggleCategory(category.id)}
              className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-gray-50 rounded-md transition-colors"
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 flex-shrink-0" style={{ color: '#4FA3D1' }} />
              ) : (
                <ChevronRight className="h-4 w-4 flex-shrink-0" style={{ color: '#666' }} />
              )}
              <span className="text-left" style={{ color: '#215285' }}>
                {category.name}
              </span>
            </button>

            {/* 하위 카테고리 */}
            {isExpanded && (
              <div className="ml-6 mt-1 space-y-1 animate-in fade-in slide-in-from-top-1 duration-200">
                <TooltipProvider>
                  {category.subCategories.map((subCategory) => {
                    const isSelected = selectedCategories.includes(subCategory.code);
                    return (
                      <Tooltip key={subCategory.code}>
                        <TooltipTrigger asChild>
                          <button
                            onClick={() => onCategorySelect(subCategory.code)}
                            className="w-full flex items-center gap-2 px-3 py-2 rounded-md transition-colors text-sm"
                            style={{
                              backgroundColor: isSelected ? '#EAF4FA' : 'transparent',
                              color: isSelected ? '#4FA3D1' : '#333',
                            }}
                            onMouseEnter={(e) => {
                              if (!isSelected) {
                                e.currentTarget.style.backgroundColor = '#f3f4f6';
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!isSelected) {
                                e.currentTarget.style.backgroundColor = 'transparent';
                              }
                            }}
                          >
                            <Checkbox 
                              checked={isSelected}
                              className="pointer-events-none"
                              style={{
                                borderColor: isSelected ? '#4FA3D1' : '#cbd5e1',
                              }}
                            />
                            <span className="flex-1">{subCategory.name}</span>
                          </button>
                        </TooltipTrigger>
                        <TooltipContent
                          side="right"
                          className="bg-gray-800 text-white border-none"
                        >
                          <p>{subCategory.code}</p>
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                </TooltipProvider>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function CategoryFilter({ 
  selectedCategories, 
  onCategorySelect,
}: CategoryFilterProps) {
  const totalFiltersCount = selectedCategories?.length || 0;
  return (
    <>
      {/* Desktop - 좌측 사이드바 */}
      <Card className="hidden lg:block transition-shadow hover:shadow-md">
        <CardContent className="p-4 md:p-6">
          <h3 className="mb-4 flex items-center gap-2" style={{ color: '#215285' }}>
            <Filter className="h-5 w-5" style={{ color: '#4FA3D1' }} />
            카테고리 필터
            {selectedCategories && selectedCategories.length > 0 && (
              <span className="ml-auto text-sm px-2 py-0.5 rounded-full" style={{ backgroundColor: '#4FA3D1', color: 'white' }}>
                {selectedCategories.length}
              </span>
            )}
          </h3>
          <ScrollArea className="h-[400px]">
            <CategoryTreeContent
              selectedCategories={selectedCategories}
              onCategorySelect={onCategorySelect}
            />
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Mobile - 필터 버튼 및 오버레이 Sheet */}
      <div className="lg:hidden fixed bottom-6 right-6 z-50">
        <Sheet>
          <SheetTrigger asChild>
            <Button
              className="rounded-full shadow-lg h-14 w-14 p-0 relative"
              style={{ backgroundColor: '#4FA3D1' }}
            >
              <Filter className="h-6 w-6 text-white" />
              {totalFiltersCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {totalFiltersCount}
                </span>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-80">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2" style={{ color: '#215285' }}>
                <Filter className="h-5 w-5" style={{ color: '#4FA3D1' }} />
                필터
                {totalFiltersCount > 0 && (
                  <span className="ml-auto text-sm px-2 py-0.5 rounded-full" style={{ backgroundColor: '#4FA3D1', color: 'white' }}>
                    {totalFiltersCount}
                  </span>
                )}
              </SheetTitle>
              <SheetDescription className="sr-only">
                논문 카테고리와 연도를 선택하여 검색 결과를 필터링합니다
              </SheetDescription>
            </SheetHeader>
            <div className="mt-6 space-y-6">
              {/* 카테고리 필터 */}
              <div>
                <h4 className="mb-3 px-2" style={{ color: '#215285' }}>카테고리</h4>
                <ScrollArea className="h-[calc(100vh-280px)]">
                  <CategoryTreeContent
                    selectedCategories={selectedCategories}
                    onCategorySelect={onCategorySelect}
                  />
                </ScrollArea>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}



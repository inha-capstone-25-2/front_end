import { useState } from 'react';
import { Heart } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { ScrollArea } from '../ui/scroll-area';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../ui/tooltip';

interface SubCategory {
  name: string;
  code: string;
}

interface Category {
  id: string;
  name: string;
  subCategories: SubCategory[];
}

interface CategorySearchProps {
  onCategorySelect: (categoryCode: string) => void;
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

export function CategorySearch({ onCategorySelect }: CategorySearchProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>('ai');

  const handleCategoryClick = (categoryId: string) => {
    setSelectedCategory(categoryId === selectedCategory ? null : categoryId);
  };

  const selectedCategoryData = categories.find(
    (cat) => cat.id === selectedCategory
  );

  return (
    <section className="w-full py-16 md:py-20 bg-white">
      <div className="max-w-[1200px] mx-auto px-4 md:px-6 lg:px-10">
        {/* Header with Icon and Title */}
        <div className="flex items-center gap-3 mb-8">
          <Heart className="h-7 w-7" style={{ color: '#4FA3D1' }} />
          <h2 className="text-[28px]">카테고리로 검색</h2>
        </div>

        {/* Main Card Container */}
        <Card className="transition-shadow hover:shadow-md">
          <CardContent className="p-4 md:p-6">
            <p className="text-gray-600 mb-6">
              관심있는 분야의 논문을 빠르게 찾아보세요
            </p>

            {/* 1차 카테고리 - 가로 배열 */}
            <div className="mb-6">
              <ScrollArea className="w-full whitespace-nowrap">
                <div className="flex flex-wrap gap-2 pb-2">
                  {categories.map((category) => {
                    const isSelected = selectedCategory === category.id;
                    return (
                      <Button
                        key={category.id}
                        onClick={() => handleCategoryClick(category.id)}
                        variant="outline"
                        className="h-10 px-4 transition-all"
                        style={{
                          backgroundColor: isSelected ? '#4FA3D1' : 'transparent',
                          color: isSelected ? '#fff' : '#333',
                          border: isSelected
                            ? '1px solid #4FA3D1'
                            : '1px solid #e5e7eb',
                          borderRadius: '8px',
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
                        {category.name}
                      </Button>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>

            {/* 2차 카테고리 - 하위 영역에 펼침 */}
            {selectedCategoryData && (
              <div
                className="border-t border-gray-200 pt-6 animate-in fade-in slide-in-from-top-2 duration-300"
                key={selectedCategory}
              >
                <h3 className="mb-4" style={{ color: '#215285' }}>
                  {selectedCategoryData.name} 세부 분야
                </h3>
                <TooltipProvider>
                  <div className="flex flex-wrap gap-2">
                    {selectedCategoryData.subCategories.map((subCategory) => (
                      <Tooltip key={subCategory.code}>
                        <TooltipTrigger asChild>
                          <button
                            onClick={() => onCategorySelect(subCategory.code)}
                            className="h-10 px-4 transition-all"
                            style={{
                              backgroundColor: 'transparent',
                              color: '#333',
                              border: '1px solid #e5e7eb',
                              borderRadius: '8px',
                              cursor: 'pointer',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = '#f3f4f6';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent';
                            }}
                          >
                            {subCategory.name}
                          </button>
                        </TooltipTrigger>
                        <TooltipContent
                          side="top"
                          className="bg-gray-800 text-white border-none"
                        >
                          <p>{subCategory.code}</p>
                        </TooltipContent>
                      </Tooltip>
                    ))}
                  </div>
                </TooltipProvider>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}



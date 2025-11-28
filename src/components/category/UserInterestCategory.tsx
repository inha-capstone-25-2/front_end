import { useState, useEffect } from 'react';
import { Heart, X, Loader2 } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { toast } from 'sonner';
import { useInterestCategories, useAddInterestCategories, useDeleteInterestCategory } from '../../hooks/api/useInterestCategories';

interface SubCategory {
  name: string;
  code: string;
}

interface Category {
  id: string;
  name: string;
  subCategories: SubCategory[];
}

const categories: Category[] = [
  {
    id: 'ai-learning',
    name: '인공지능 및 학습',
    subCategories: [
      { name: '인공지능', code: 'cs.AI' },
      { name: '기계학습', code: 'cs.LG' },
      { name: '신경 및 진화 계산', code: 'cs.NE' },
      { name: '다중 에이전트 시스템', code: 'cs.MA' },
      { name: '자연어 처리', code: 'cs.CL' },
      { name: '컴퓨터 비전', code: 'cs.CV' },
      { name: '멀티미디어 처리', code: 'cs.MM' },
      { name: '인간-컴퓨터 상호작용', code: 'cs.HC' },
    ],
  },
  {
    id: 'systems',
    name: '시스템',
    subCategories: [
      { name: '운영체제', code: 'cs.OS' },
      { name: '분산·병렬·클러스터 컴퓨팅', code: 'cs.DC' },
      { name: '시스템 및 제어', code: 'cs.SY' },
      { name: '소프트웨어 공학', code: 'cs.SE' },
      { name: '성능 분석 및 최적화', code: 'cs.PF' },
    ],
  },
  {
    id: 'network',
    name: '네트워크',
    subCategories: [
      { name: '네트워크 및 인터넷 아키텍처', code: 'cs.NI' },
      { name: '사회 및 정보 네트워크', code: 'cs.SI' },
    ],
  },
  {
    id: 'security',
    name: '보안',
    subCategories: [
      { name: '암호학 및 보안', code: 'cs.CR' },
      { name: '정보 프라이버시 및 정책', code: 'cs.CY' },
      { name: '하드웨어 보안 아키텍처', code: 'cs.AR' },
    ],
  },
  {
    id: 'data-info',
    name: '데이터 및 정보',
    subCategories: [
      { name: '데이터베이스', code: 'cs.DB' },
      { name: '정보 검색', code: 'cs.IR' },
      { name: '데이터 구조 및 알고리즘', code: 'cs.DS' },
      { name: '디지털 라이브러리', code: 'cs.DL' },
    ],
  },
  {
    id: 'theory-math',
    name: '계산 이론 및 수학',
    subCategories: [
      { name: '계산 복잡도', code: 'cs.CC' },
      { name: '논리학', code: 'cs.LO' },
      { name: '형식언어', code: 'cs.FL' },
      { name: '이산 수학', code: 'cs.DM' },
      { name: '게임 이론', code: 'cs.GT' },
      { name: '상징 계산', code: 'cs.SC' },
      { name: '수학 소프트웨어', code: 'cs.MS' },
      { name: '일반 문헌', code: 'cs.GL' },
    ],
  },
  {
    id: 'computational-science',
    name: '계산 과학 및 수치 해석',
    subCategories: [
      { name: '수치 해석', code: 'cs.NA' },
      { name: '계산 공학', code: 'cs.CE' },
      { name: '정보 이론', code: 'cs.IT' },
      { name: '신흥 기술', code: 'cs.ET' },
    ],
  },
  {
    id: 'robotics-engineering',
    name: '로보틱스 및 응용 공학',
    subCategories: [
      { name: '로보틱스', code: 'cs.RO' },
      { name: '컴퓨터 그래픽스', code: 'cs.GR' },
      { name: '사운드·음향 처리', code: 'cs.SD' },
    ],
  },
  {
    id: 'programming-hardware',
    name: '프로그래밍 언어 및 하드웨어',
    subCategories: [
      { name: '프로그래밍 언어', code: 'cs.PL' },
      { name: '하드웨어 아키텍처', code: 'cs.AR' },
    ],
  },
  {
    id: 'human-social',
    name: '인간 및 사회 시스템',
    subCategories: [
      { name: '인간-컴퓨터 상호작용', code: 'cs.HC' },
      { name: '컴퓨터와 사회', code: 'cs.CY' },
    ],
  },
  {
    id: 'other',
    name: '기타 및 융합 분야',
    subCategories: [
      { name: '기타 컴퓨터 과학', code: 'cs.OH' },
      { name: '디지털 라이브러리 및 정보 보존', code: 'cs.DL' },
      { name: '신흥 기술', code: 'cs.ET' },
    ],
  },
];

const MAX_SELECTIONS = 5;

export function UserInterestCategory() {
  const [selectedCategories, setSelectedCategories] = useState<SubCategory[]>([]);
  const [expandedCategory, setExpandedCategory] = useState<string | null>('ai-learning');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  // 초기 서버에서 받은 카테고리 코드 저장 (삭제 추적용)
  const [initialCategoryCodes, setInitialCategoryCodes] = useState<string[]>([]);
  
  // React Query 훅 사용
  const { data: interestCategoriesData, isLoading: isLoadingInterests } = useInterestCategories();
  const addMutation = useAddInterestCategories();
  const deleteMutation = useDeleteInterestCategory();

  // 카테고리 코드를 SubCategory 객체로 변환하는 헬퍼 함수
  const mapCategoryCodesToSubCategories = (categoryCodes: string[]): SubCategory[] => {
    const mappedCategories: SubCategory[] = [];
    
    for (const code of categoryCodes) {
      // categories 배열에서 해당 코드 찾기
      for (const category of categories) {
        const subCategory = category.subCategories.find(sub => sub.code === code);
        if (subCategory) {
          mappedCategories.push(subCategory);
          break; // 찾았으면 다음 코드로
        }
      }
    }
    
    return mappedCategories;
  };

  // React Query 데이터를 사용하여 선택된 카테고리 설정
  useEffect(() => {
    if (interestCategoriesData) {
      let categoryCodes: string[] = [];
      
      // 1. items 배열이 있으면 각 항목의 code 추출 (서버 응답 형식)
      if (interestCategoriesData.items && interestCategoriesData.items.length > 0) {
        categoryCodes = interestCategoriesData.items
          .map(item => item.code)
          .filter((code): code is string => !!code);
      }
      // 2. category_codes가 있으면 그대로 사용 (기존 방식)
      else if (interestCategoriesData.category_codes && interestCategoriesData.category_codes.length > 0) {
        categoryCodes = interestCategoriesData.category_codes;
      }
      // 3. categories 배열이 있으면 각 항목의 category_code 추출
      else if (interestCategoriesData.categories && interestCategoriesData.categories.length > 0) {
        categoryCodes = interestCategoriesData.categories
          .map(cat => cat.category_code)
          .filter((code): code is string => !!code);
      }
      // 4. category_ids만 있는 경우 (서버에서 변환 정보 제공 필요)
      else if (interestCategoriesData.category_ids && interestCategoriesData.category_ids.length > 0) {
        // 서버에서 카테고리 정보를 함께 반환하지 않는 경우
        // 이 경우 서버 API가 카테고리 정보를 함께 반환하도록 수정 필요
        console.warn('category_ids만 반환되었습니다. 서버에서 category_codes 또는 categories 정보를 함께 반환해야 합니다.');
        // 일단 빈 배열로 처리 (서버 수정 필요)
        categoryCodes = [];
      }
      
      // 초기 카테고리 코드 저장 (삭제 추적용)
      setInitialCategoryCodes(categoryCodes);
      
      // 카테고리 코드를 SubCategory 객체로 변환
      const mappedCategories = mapCategoryCodesToSubCategories(categoryCodes);
      
      setSelectedCategories(mappedCategories);
      setHasUnsavedChanges(false); // 서버와 동기화된 상태
    }
  }, [interestCategoriesData]);

  const handleCategoryClick = (subCategory: SubCategory) => {
    const isAlreadySelected = selectedCategories.some(cat => cat.code === subCategory.code);

    // 선택 해제
    if (isAlreadySelected) {
      const newCategories = selectedCategories.filter(cat => cat.code !== subCategory.code);
      setSelectedCategories(newCategories);
      setHasUnsavedChanges(true);
      toast.info('카테고리가 제거되었습니다. 저장 버튼을 눌러 변경사항을 반영하세요.');
    } else {
      // 새로 선택
      if (selectedCategories.length >= MAX_SELECTIONS) {
        toast.error(`최대 ${MAX_SELECTIONS}개까지만 선택할 수 있습니다.`);
        return;
      }
      const newCategories = [...selectedCategories, subCategory];
      setSelectedCategories(newCategories);
      setHasUnsavedChanges(true);
      toast.info('카테고리가 추가되었습니다. 저장 버튼을 눌러 변경사항을 반영하세요.');
    }
  };

  const handleRemoveCategory = (code: string) => {
    const newCategories = selectedCategories.filter(cat => cat.code !== code);
    setSelectedCategories(newCategories);
    setHasUnsavedChanges(true);
    toast.info('카테고리가 삭제되었습니다. 저장 버튼을 눌러 변경사항을 반영하세요.');
  };

  const handleSave = async () => {
    if (selectedCategories.length === 0) {
      toast.error('선택한 카테고리가 없습니다.');
      return;
    }

    const currentCategoryCodes = selectedCategories.map(cat => cat.code);
    
    // 삭제된 카테고리 찾기 (초기에는 있었지만 현재는 없는 것)
    const deletedCodes = initialCategoryCodes.filter(
      code => !currentCategoryCodes.includes(code)
    );
    
    // 추가된 카테고리 찾기 (초기에는 없었지만 현재는 있는 것)
    const addedCodes = currentCategoryCodes.filter(
      code => !initialCategoryCodes.includes(code)
    );

    try {
      // 1. 삭제된 카테고리들을 서버에서 삭제
      if (deletedCodes.length > 0) {
        await Promise.all(
          deletedCodes.map(code => 
            new Promise<void>((resolve, reject) => {
              deleteMutation.mutate(code, {
                onSuccess: () => resolve(),
                onError: (error) => reject(error),
              });
            })
          )
        );
      }

      // 2. 추가된 카테고리들을 서버에 추가
      if (addedCodes.length > 0) {
        await new Promise<void>((resolve, reject) => {
          addMutation.mutate(addedCodes, {
            onSuccess: () => resolve(),
            onError: (error) => reject(error),
          });
        });
      }

      // 3. 성공 시 초기 카테고리 코드 업데이트
      setInitialCategoryCodes(currentCategoryCodes);
      setHasUnsavedChanges(false);
      toast.success('관심 카테고리가 저장되었습니다.');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '관심 카테고리 저장 중 오류가 발생했습니다.';
      toast.error(errorMessage);
    }
  };

  const isCategorySelected = (code: string) => {
    return selectedCategories.some(cat => cat.code === code);
  };

  const handleMainCategoryClick = (categoryId: string) => {
    setExpandedCategory(categoryId === expandedCategory ? null : categoryId);
  };

  const expandedCategoryData = categories.find(cat => cat.id === expandedCategory);

  return (
    <Card className="mb-8 shadow-md" style={{ borderRadius: '12px' }}>
      <CardContent className="p-4 md:p-6">
        <div className="mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <Heart className="w-6 h-6" style={{ color: '#4FA3D1' }} />
              <h2 className="text-[20px] md:text-[24px]" style={{ color: '#215285' }}>관심 카테고리 선택</h2>
            </div>
            <span className="text-sm text-gray-600">
              {selectedCategories.length} / {MAX_SELECTIONS}개 선택됨
            </span>
          </div>
          <p className="text-sm text-gray-600">최대 5개까지 선택할 수 있습니다</p>
        </div>

        {/* 변경사항 경고 배너 */}
        {hasUnsavedChanges && (
          <div className="mb-4 p-3 bg-yellow-50 rounded-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
            <p className="text-sm text-yellow-800">
              변경사항이 있습니다. 저장 버튼을 눌러 변경사항을 반영하세요. 저장하지 않으면 변경사항이 손실될 수 있습니다.
            </p>
          </div>
        )}

        {/* 선택된 카테고리 표시 */}
        {isLoadingInterests ? (
          <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border border-blue-100">
            <p className="text-sm mb-3" style={{ color: '#215285' }}>
              ✓ 선택한 카테고리 ({selectedCategories.length} / {MAX_SELECTIONS})
            </p>
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" style={{ color: '#215285' }} />
              <span className="text-sm text-gray-600">관심 카테고리를 불러오는 중...</span>
            </div>
          </div>
        ) : (
          <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border border-blue-100">
            <p className="text-sm mb-3" style={{ color: '#215285' }}>
              ✓ 선택한 카테고리 ({selectedCategories.length} / {MAX_SELECTIONS})
            </p>
            {selectedCategories.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {selectedCategories.map((category) => (
                  <div
                    key={category.code}
                    className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm shadow-sm hover:shadow-md transition-all"
                    style={{ 
                      backgroundColor: '#215285', 
                      color: '#ffffff',
                    }}
                  >
                    <span>{category.name}</span>
                    <button
                      onClick={() => handleRemoveCategory(category.code)}
                      className="hover:bg-white/20 rounded-full p-0.5 transition-colors"
                      aria-label="삭제"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">선택한 카테고리가 없습니다.</p>
            )}
          </div>
        )}

        {/* 1차 카테고리 - 가로 정렬 버튼형 */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => {
              const isExpanded = expandedCategory === category.id;
              return (
                <Button
                  key={category.id}
                  onClick={() => handleMainCategoryClick(category.id)}
                  variant="outline"
                  className="h-10 px-4 transition-all"
                  style={{
                    backgroundColor: isExpanded ? '#4FA3D1' : 'transparent',
                    color: isExpanded ? '#fff' : '#333',
                    border: isExpanded ? '1px solid #4FA3D1' : '1px solid #e5e7eb',
                    borderRadius: '8px',
                  }}
                  onMouseEnter={(e) => {
                    if (!isExpanded) {
                      e.currentTarget.style.backgroundColor = '#f3f4f6';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isExpanded) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  {category.name}
                </Button>
              );
            })}
          </div>
        </div>

        {/* 2차 카테고리 - 하위 세부 카테고리 */}
        {expandedCategoryData && (
          <div className="border-t border-gray-200 pt-6 animate-in fade-in slide-in-from-top-2 duration-300">
            <h3 className="mb-4" style={{ color: '#215285' }}>
              {expandedCategoryData.name} 세부 분야
            </h3>
            <div className="flex flex-wrap gap-2">
              {expandedCategoryData.subCategories.map((subCategory) => {
                const isSelected = isCategorySelected(subCategory.code);
                const isDisabled = !isSelected && selectedCategories.length >= MAX_SELECTIONS;

                return (
                  <button
                    key={subCategory.code}
                    onClick={() => handleCategoryClick(subCategory)}
                    disabled={isDisabled}
                    className="px-4 py-2 rounded-full text-sm shadow-sm transition-all"
                    style={{
                      backgroundColor: isSelected ? '#4FA3D1' : '#E0EAF2',
                      color: isSelected ? '#fff' : '#215285',
                      border: 'none',
                      opacity: isDisabled ? 0.4 : 1,
                      cursor: isDisabled ? 'not-allowed' : 'pointer',
                    }}
                    onMouseEnter={(e) => {
                      if (!isDisabled) {
                        if (isSelected) {
                          e.currentTarget.style.backgroundColor = '#3B8AB8';
                        } else {
                          e.currentTarget.style.backgroundColor = '#C8D9E6';
                        }
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isDisabled) {
                        e.currentTarget.style.backgroundColor = isSelected ? '#4FA3D1' : '#E0EAF2';
                      }
                    }}
                  >
                    {subCategory.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 저장 버튼 */}
        <div className="flex justify-end mt-6">
          <Button
            onClick={handleSave}
            className="text-white hover:opacity-90 transition-all"
            style={{ 
              backgroundColor: hasUnsavedChanges ? '#f59e0b' : '#215285',
              boxShadow: hasUnsavedChanges ? '0 0 0 3px rgba(245, 158, 11, 0.2)' : 'none',
            }}
            disabled={selectedCategories.length === 0 || addMutation.isPending || deleteMutation.isPending}
          >
            {addMutation.isPending || deleteMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                저장 중...
              </>
            ) : (
              <>
                <Heart className="w-4 h-4 mr-2" />
                {hasUnsavedChanges ? '변경사항 저장' : '관심 카테고리 저장'}
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}



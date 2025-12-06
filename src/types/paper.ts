export interface Paper {
  id: number;
  title: string;
  authors: string | string[];
  pages?: string;
  publisher: string;
  year?: number | string;
  // 상세 API와 카드 모두에서 summary가 문자열 또는 { en, ko } 객체로 올 수 있음
  summary?: string | { en?: string; ko?: string | null };
  translatedSummary?: string;
  conference?: string;
  keywords?: string[];
  externalUrl?: string;
  categories?: string[];
}

export interface PaperHandlers {
  onPaperClick: (paperId: number) => void;
  onToggleBookmark: (paperId: number) => void;
  onSearch: (query: string) => void;
}

/**
 * 통합 PaperCard 컴포넌트를 위한 기본 Props
 */
export interface BasePaperCardProps {
  /** 논문 ID (문자열 또는 숫자) */
  paperId: number | string;
  /** 논문 제목 */
  title: string;
  /** 저자 (문자열 또는 배열) */
  authors: string | string[];
  /** 출판사 */
  publisher?: string;
  /** 출판 연도 */
  year?: number | string;
  /** 페이지 수 */
  pages?: string;
  /** 요약 (문자열 또는 { en, ko } 객체) */
  summary?: string | { en?: string; ko?: string | null };
  /** 번역된 요약 */
  translatedSummary?: string;
  /** 외부 링크 URL */
  externalUrl?: string;
  /** 업데이트 횟수 */
  update_count?: number;
  /** 업데이트 날짜 */
  update_date?: string;
  /** 카테고리 배열 */
  categories?: string[];
  /** 저널 정보 */
  journal?: string;
  /** 북마크 여부 */
  isBookmarked?: boolean;
  /** 북마크 토글 핸들러 */
  onToggleBookmark?: (paperId: number | string) => void;
  /** 논문 클릭 핸들러 */
  onPaperClick?: (paperId: number | string, recommendationId?: string) => void;
  /** 추천 논문 ID (추천 논문인 경우 클릭 기록용) */
  recommendationId?: string;
}

/**
 * PaperCard variant 옵션
 */
export interface PaperCardVariant {
  /** 카드 스타일 variant */
  variant?: 'default' | 'list' | 'search' | 'compact' | 'recommended';
  /** 요약 표시 여부 */
  showSummary?: boolean;
  /** 번역된 요약 표시 여부 */
  showTranslatedSummary?: boolean;
  /** 북마크 버튼 표시 여부 */
  showBookmark?: boolean;
  /** 외부 링크 버튼 표시 여부 */
  showExternalLink?: boolean;
  /** 저널 표시 여부 */
  showJournal?: boolean;
  /** 카테고리 표시 여부 */
  showCategories?: boolean;
  /** 추가 CSS 클래스 */
  className?: string;
}

/**
 * 통합 PaperCard Props (BasePaperCardProps + PaperCardVariant)
 */
export type UnifiedPaperCardProps = BasePaperCardProps & PaperCardVariant;


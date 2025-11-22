export interface Paper {
  id: number;
  title: string;
  authors: string | string[];
  pages?: string;
  publisher: string;
  year?: number | string;
  summary?: string;
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

export interface PaperListCardProps {
  paper: Paper;
  variant?: 'default' | 'compact' | 'detailed';
  showBookmark?: boolean;
}

/**
 * 통합 PaperCard 컴포넌트를 위한 기본 Props
 */
export interface BasePaperCardProps {
  paperId: number;
  title: string;
  authors: string | string[];
  publisher?: string;
  year?: number | string;
  pages?: string;
  summary?: string;
  translatedSummary?: string;
  externalUrl?: string;
  update_count?: number; // 업데이트 횟수
  categories?: string[]; // 카테고리 배열
  isBookmarked?: boolean;
  onToggleBookmark?: (paperId: number) => void;
  onPaperClick?: (paperId: number) => void;
}

/**
 * PaperCard variant 옵션
 */
export interface PaperCardVariant {
  variant?: 'default' | 'list' | 'search' | 'compact' | 'recommended';
  showSummary?: boolean;
  showTranslatedSummary?: boolean;
  showBookmark?: boolean;
  showExternalLink?: boolean;
  className?: string;
}

/**
 * 통합 PaperCard Props (BasePaperCardProps + PaperCardVariant)
 */
export type UnifiedPaperCardProps = BasePaperCardProps & PaperCardVariant;


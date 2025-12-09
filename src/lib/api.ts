// API 통신 모듈
import axios, { AxiosError } from 'axios';
import { LoginRequest, LoginResponse, RegisterRequest, RegisterResponse, UsernameExistsResponse, UserProfile } from '../types/auth';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://44.234.58.137';

// Axios 인스턴스 생성 및 설정
export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
  transformRequest: [
    (data, headers) => {
      if (headers && headers['Content-Type'] === 'application/x-www-form-urlencoded') {
        if (data instanceof URLSearchParams) {
          return data.toString();
        }
        if (data && typeof data === 'object') {
          const params = new URLSearchParams();
          Object.keys(data).forEach((key) => {
            params.append(key, data[key]);
          });
          return params.toString();
        }
      }
      if (data && typeof data === 'object' && !(data instanceof URLSearchParams)) {
        return JSON.stringify(data);
      }
      return data;
    },
  ],
});

// Request Interceptor: 인증 토큰 자동 주입
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: 에러 처리 및 401 자동 로그아웃
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data as any;
      
      if (status === 401) {
        localStorage.removeItem('access_token');
        import('../store/authStore').then(({ useAuthStore }) => {
          useAuthStore.getState().logout();
        });
        window.location.href = '/login';
      }
      
      const errorMessage = data?.message || data?.error || `요청 처리 중 오류가 발생했습니다. (${status})`;
      return Promise.reject(new Error(errorMessage));
    }
    
    if (error.request) {
      return Promise.reject(new Error('네트워크 오류가 발생했습니다. 서버에 연결할 수 없습니다.'));
    }
    
    return Promise.reject(error);
  }
);

// API 엔드포인트 정의
export const endpoints = {
  auth: {
    login: '/auth/login',
    register: '/auth/register',
    signup: '/auth/signup',
    logout: '/auth/logout',
    currentUser: '/auth/me',
  },
  papers: {
    search: '/papers/search',
    detail: (id: string | number) => `/papers/${id}`,
    bookmarks: '/papers/bookmarks',
    toggleBookmark: (id: number) => `/papers/${id}/bookmark`,
    searchHistory: '/papers/search-history',
    viewed: '/papers/viewed',
  },
  bookmarks: '/bookmarks',
  userInterests: '/user-interests',
  recommendations: '/recommendations',
};

// 인증 관련 API 함수
// 로그인
export const login = (body: LoginRequest): Promise<LoginResponse> => {
  const params = new URLSearchParams();
  params.append('username', body.username);
  params.append('password', body.password);
  
  return api.post<LoginResponse>(
    '/auth/login',
    params,
    {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    }
  ).then(response => response.data);
};

// 회원가입
export const register = (body: RegisterRequest): Promise<RegisterResponse> =>
  api.post<RegisterResponse>('/auth/register', body).then(response => response.data);

// 아이디 중복 확인
export const checkUsernameExists = (username: string): Promise<boolean> =>
  api.get<UsernameExistsResponse>('/auth/username-exists', { params: { username } })
    .then(res => res.data.exists);

// 사용자 프로필 조회
export const fetchMyProfile = (): Promise<UserProfile> =>
  api.get<UserProfile>('/auth/me').then(res => res.data);

// 로그아웃
export const logout = (): Promise<void> =>
  api.post('/auth/logout').then(() => undefined);

// 회원 탈퇴
export const quitAccount = (): Promise<void> =>
  api.delete('/auth/quit').then(() => undefined);

// 논문 관련 API 함수

// 논문 검색
// API 명세: GET /papers/search?categories=cs.Al&q=transformer&sort_by=view_count&page=1
export const searchPapers = (
  q?: string,
  page: number = 1,
  categories?: string | string[],
  sort_by?: string
): Promise<SearchPapersResponse> => {
  const params: Record<string, string | number> = {};
  
  // page는 항상 포함 (기본값 1)
  params.page = page;
  
  // q가 있을 때만 추가
  if (q && q.trim() !== '') {
    params.q = q.trim();
  }
  
  // categories가 있을 때만 추가 (배열이면 쉼표로 구분된 문자열로 변환)
  if (categories) {
    if (Array.isArray(categories)) {
      const filteredCategories = categories.filter(c => c && c.trim() !== '');
      if (filteredCategories.length > 0) {
        params.categories = filteredCategories.join(',');
      }
    } else if (categories.trim() !== '') {
      params.categories = categories.trim();
    }
  }
  
  // sort_by가 있을 때만 추가
  if (sort_by && sort_by.trim() !== '') {
    params.sort_by = sort_by.trim();
  }
  
  // API 응답 구조 (이미지 명세 기준)
  type ServerResponse = {
    items: Paper[];  // API 명세에 따라 items 배열 사용
    page: number;
    page_size: number;
    total: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
    is_approximate: boolean;
  };

  return api.get<ServerResponse>(endpoints.papers.search, {
    params,
    timeout: 180000,
  }).then(res => {
    const serverData = res.data as ServerResponse;
    
    // API 명세에 맞춰 items 배열 사용
    const response: SearchPapersResponse = {
      papers: serverData.items || [],
      total: serverData.total || 0,
      page: serverData.page || page,
      pageSize: serverData.page_size || 10,
      totalPages: serverData.total_pages,
      hasNext: serverData.has_next,
      hasPrev: serverData.has_prev,
      isApproximate: serverData.is_approximate,
    };
    
    return response;
  });
};

// 논문 상세 조회
export const getPaperDetail = (paperId: string | number): Promise<Paper> => {
  return api.get<Paper>(endpoints.papers.detail(paperId)).then(response => response.data);
};

// 논문 상세 조회 별칭
export const getPaperById = (id: string): Promise<Paper> => {
  return getPaperDetail(id);
};

// 추천 논문 조회: 상세 페이지 논문 기반 유사 논문 추천 (GET /recommendations/rl)
export const getRecommendations = (
  paperId: string | number,
  topK: number = 6,
  candidateK: number = 100
): Promise<Paper[]> => {
  type ServerResponse = {
    // 추천 API 전용 필드
    recommendations?: any[];
    // 기타 리스트형 응답 필드
    papers?: Paper[];
    results?: Paper[];
    data?: Paper[];
    items?: Paper[];
  };

  return api.get<ServerResponse | Paper[]>(`${endpoints.recommendations}/rl`, {
    params: {
      top_k: topK,
      candidate_k: candidateK,
      base_paper_id: paperId,
    },
    timeout: 420000, // 추천 논문 조회는 최대 7분까지 대기
  }).then(res => {
    const response = res.data;
    
    // 응답이 배열인 경우 (Paper[]라고 가정)
    if (Array.isArray(response)) {
      return response as Paper[];
    }
    
    // 응답이 객체인 경우
    if (response && typeof response === 'object') {
      const serverData = response as ServerResponse;

      // 1) 추천 전용 구조: { recommendations: [...] }
      if (Array.isArray(serverData.recommendations)) {
        return serverData.recommendations.map((item: any) => {
          const id = item.paper_id || item.id || item._id || '';

          const authors =
            Array.isArray(item.authors) ? item.authors :
            typeof item.authors === 'string'
              ? item.authors.split(',').map((s: string) => s.trim())
              : [];

          const categories =
            Array.isArray(item.categories) ? item.categories :
            typeof item.categories === 'string'
              ? [item.categories]
              : [];

          const paper: Paper = {
            id,
            title: item.title || '',
            authors,
            categories,
            update_date: item.update_date,
            // summary를 우선 사용, 없으면 abstract 사용
            summary: (item as any).summary || (item as any).abstract,
            abstract: (item as any).abstract,
            // recommendation_id가 있으면 포함 (추천 논문 클릭 기록용)
            recommendation_id: item.recommendation_id || item._id || item.id,
          };

          return paper;
        });
      }

      // 2) 일반적인 리스트 구조 (papers / results / data / items)
      const papersArray =
        serverData.papers ||
        serverData.results ||
        serverData.data ||
        serverData.items ||
        [];

      return papersArray as Paper[];
    }
    
    // 알 수 없는 응답 형식인 경우 빈 배열
    return [];
  }).catch((error: AxiosError) => {
    if (error.response?.data) {
      const errorData = error.response.data as any;
      if (errorData.error) {
        throw new Error(errorData.error);
      }
      if (errorData.message) {
        throw new Error(errorData.message);
      }
    }
    throw error;
  });
};

// 추천 논문 클릭 기록: 추천 논문 클릭 시 서버에 기록 전송 (POST /recommendations/{recommendation_id}/click)
export const recordRecommendationClick = (recommendationId: string): Promise<void> => {
  return api.post(`${endpoints.recommendations}/${recommendationId}/click`)
    .then(() => undefined)
    .catch((error: AxiosError) => {
      if (error.response?.data) {
        const errorData = error.response.data as any;
        if (errorData.error) {
          throw new Error(errorData.error);
        }
        if (errorData.message) {
          throw new Error(errorData.message);
        }
      }
      throw error;
    });
};

// 추천 논문 상호작용 결과 저장: 체류 시간, 스크롤 깊이, 북마크 등 사용자 상호작용 저장 (POST /recommendations/{recommendation_id}/interactions)
export const recordRecommendationInteraction = (
  recommendationId: string,
  interaction: RecommendationInteractionRequest
): Promise<void> => {
  return api.post(
    `${endpoints.recommendations}/${recommendationId}/interactions`,
    {
      recommendation_id: recommendationId,
      ...interaction,
    }
  )
    .then(() => undefined)
    .catch((error: AxiosError) => {
      if (error.response?.data) {
        const errorData = error.response.data as any;
        if (errorData.error) {
          throw new Error(errorData.error);
        }
        if (errorData.message) {
          throw new Error(errorData.message);
        }
      }
      throw error;
    });
};

// 검색 기록 조회
export const fetchSearchHistory = (userId: string, limit: number = 20): Promise<SearchHistoryResponse> =>
  api.get<SearchHistoryResponse>(endpoints.papers.searchHistory, {
    params: { user_id: userId, limit },
  }).then(res => res.data);

// 조회한 논문 조회
export const fetchViewedPapers = (page: number = 1, limit: number = 10): Promise<SearchPapersResponse> => {
  type ServerResponse = {
    papers?: Paper[];
    results?: Paper[];
    data?: Paper[];
    items?: Paper[];
    total?: number;
    page?: number;
    page_size?: number;
    pageSize?: number;
    total_pages?: number;
    has_next?: boolean;
    has_prev?: boolean;
    is_approximate?: boolean;
  };

  return api.get<SearchPapersResponse | ServerResponse>(endpoints.papers.viewed, {
    params: { page, limit },
  }).then(res => {
    const serverData = (res.data || {}) as ServerResponse;
    
    const papersArray = serverData.papers || 
                       serverData.results || 
                       serverData.data || 
                       serverData.items || 
                       [];
    
    const response: SearchPapersResponse = {
      papers: papersArray,
      total: serverData.total || 0,
      page: serverData.page || page,
      pageSize: serverData.page_size || serverData.pageSize || limit,
      totalPages: serverData.total_pages,
      hasNext: serverData.has_next,
      hasPrev: serverData.has_prev,
      isApproximate: serverData.is_approximate,
    };
    
    return response;
  });
};

// 북마크 관련 API 함수

// 북마크 조회
export const fetchBookmarks = (): Promise<BookmarkItem[]> => {
  return api.get<any>(endpoints.bookmarks).then(response => {
    const data = response.data;
    
    // 응답이 { items: [...] } 형식인지 확인
    let bookmarksArray: any[] = [];
    if (Array.isArray(data)) {
      bookmarksArray = data;
    } else if (data && typeof data === 'object' && Array.isArray(data.items)) {
      bookmarksArray = data.items;
    } else {
      return [];
    }
    
    // 북마크 배열을 BookmarkItem 형식으로 변환
    return bookmarksArray.map((item: any) => {
      // doi를 paper_id로 사용 (paper의 _id가 doi이므로)
      const paperId = item.doi || item.paper_id || '';
      
      return {
        id: item._id || item.id || '',
        paper_id: paperId,
        notes: item.notes,
        // 논문 정보가 포함된 경우 paper 필드에 설정
        paper: item.paper ? {
          id: item.paper._id || item.paper.id || paperId,
          title: item.paper.title || '',
          authors: item.paper.authors || '',
          categories: item.paper.categories,
          update_date: item.paper.update_date,
          summary: item.paper.summary,
          abstract: item.paper.abstract,
        } : undefined,
      } as BookmarkItem;
    });
  });
};

// 관심 카테고리 관련 API 함수

// 관심 카테고리 조회
export const getInterestCategories = (): Promise<UserInterestsResponse> =>
  api.get<UserInterestsResponse>(endpoints.userInterests).then(res => res.data);

// 관심 카테고리 추가
export const addInterestCategories = (category_codes: string[]): Promise<void> =>
  api.post(endpoints.userInterests, { category_codes }).then(() => undefined);

// 관심 카테고리 삭제
export const deleteInterestCategory = (code: string): Promise<void> =>
  api.delete(endpoints.userInterests, {
    params: { codes: code },
  }).then(() => undefined);

// 북마크 추가
export const addBookmark = (paperId: string, notes?: string): Promise<AddBookmarkResponse> => {
  const body: AddBookmarkRequest = {
    doi: paperId,
  };
  
  if (notes) {
    body.notes = notes;
  }
  
    return api.post<AddBookmarkResponse>(endpoints.bookmarks, body)
    .then(response => response.data)
    .catch((error: AxiosError) => {
      if (error.response?.data) {
        const errorData = error.response.data as any;
        if (errorData.error) {
          throw new Error(errorData.error);
        }
        if (errorData.message) {
          throw new Error(errorData.message);
        }
      }
      throw error;
    });
};

// 북마크 삭제
export const deleteBookmark = (bookmarkId: string): Promise<void> => {
  return api.delete(`${endpoints.bookmarks}/${bookmarkId}`).then(() => undefined);
};


// 타입 정의

export interface SignupRequest {
  name: string;
  username: string;
  email: string;
  password: string;
}

export interface SignupResponse {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export interface User {
  id: string;
  name: string;
  email: string;
  username: string;
}

export interface Paper {
  id: string | number;
  title: string;
  authors: string | string[];
  year?: number | string;
  publisher?: string;
  abstract?: string;
  keywords?: string[];
  categories?: string[];
  externalUrl?: string;
  translatedSummary?: string;
  summary?: string | { en?: string; ko?: string | null };
  update_count?: number;
  update_date?: string;
  recommendation_id?: string;
}

export interface SearchPapersResponse {
  papers: Paper[];
  total: number;
  page: number;
  pageSize: number;
  totalPages?: number;
  hasNext?: boolean;
  hasPrev?: boolean;
  isApproximate?: boolean;
}

export interface BookmarkResponse {
  paperId: number;
  isBookmarked: boolean;
}

export interface AddBookmarkRequest {
  doi: string;
  notes?: string;
}

export interface AddBookmarkResponse {
  message?: string;
  bookmark?: {
    _id?: string;
    id?: string;
    user_id?: number;
    paper_id: string;
    notes?: string;
    bookmarked_at?: string;
    created_at?: string;
  };
  error?: string;
}

export interface BookmarkListItem {
  paper_id: string;
  notes?: string;
  id?: string;
}

export type BookmarksListResponse = BookmarkListItem[] | { bookmarks: BookmarkListItem[] };

export interface BookmarkItem {
  id: string;
  paper_id: string;
  notes?: string;
  paper?: Paper;
}

export interface UpdateBookmarkResponse {
  message?: string;
  bookmark?: {
    id: string;
    paper_id: string;
    notes?: string;
    updated_at?: string;
  };
}

export interface SearchHistoryResponse {
  papers: Paper[];
}

export interface SearchQueryHistoryItem {
  query: string;
  searched_at?: string;
}

export interface SearchQueryHistoryResponse {
  queries?: SearchQueryHistoryItem[];
  search_history?: SearchQueryHistoryItem[];
  data?: SearchQueryHistoryItem[];
}

export interface CategoryInfo {
  category_id: number;
  category_code: string;
  name?: string;
}

export interface InterestCategoryItem {
  code: string;
  name_ko: string | null;
  name_en: string;
}

export interface UserInterestsResponse {
  items?: InterestCategoryItem[];
  category_ids?: number[];
  category_codes?: string[];
  categories?: CategoryInfo[];
}

export interface UserInterestsRequest {
  category_codes: string[];
}

export interface RecommendationInteractionRequest {
  dwell_time_seconds?: number;
  scroll_depth_percent?: number;
  read_abstract?: boolean;
  expanded_sections?: string[];
  bookmarked?: boolean;
  downloaded_pdf?: boolean;
  copied_citation?: boolean;
  shared?: boolean;
  device_type?: string;
}

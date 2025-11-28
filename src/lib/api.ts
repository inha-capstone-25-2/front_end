// API 통신 모듈
import axios, { AxiosError } from 'axios';
import { LoginRequest, LoginResponse, RegisterRequest, RegisterResponse, UsernameExistsResponse, UserProfile } from '../types/auth';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://35.94.93.225';

// Axios 인스턴스 생성
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

// Response Interceptor: 에러 처리
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
  },
  bookmarks: '/bookmarks',
  userInterests: '/user-interests',
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
export const searchPapers = (
  q: string,
  page: number = 1,
  categories?: string | string[],
  sort_by?: string
): Promise<SearchPapersResponse> => {
  const params: Record<string, string | number> = {
    q,
    page,
  };
  
  if (categories) {
    if (Array.isArray(categories)) {
      // 배열을 쉼표 구분 문자열로 변환
      params.categories = categories.join(',');
    } else {
      params.categories = categories;
    }
  }
  
  if (sort_by) {
    params.sort_by = sort_by;
  }
  
  type ServerResponse = {
    papers?: Paper[];
    results?: Paper[];
    data?: Paper[];
    items?: Paper[];
    total?: number;
    page?: number;
    page_size?: number;
    pageSize?: number;
  };

  return api.get<SearchPapersResponse | ServerResponse>(endpoints.papers.search, {
    params,
    timeout: 180000,
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
      page: serverData.page || 1,
      pageSize: serverData.page_size || serverData.pageSize || 10,
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

// 검색 기록 조회
export const fetchSearchHistory = (userId: string, limit: number = 20): Promise<SearchHistoryResponse> =>
  api.get<SearchHistoryResponse>(endpoints.papers.searchHistory, {
    params: { user_id: userId, limit },
  }).then(res => res.data);

// 검색어 기록 조회
export const getSearchHistory = (userId: number, limit: number = 20): Promise<SearchQueryHistoryItem[]> => {
  return api.get<any>(endpoints.papers.searchHistory, {
    params: { user_id: userId, limit },
  }).then(res => {
    const serverData = res.data;
    
    let queriesArray: any[] = [];
    
    if (Array.isArray(serverData)) {
      queriesArray = serverData;
    } else if (serverData && typeof serverData === 'object') {
      queriesArray = serverData.queries || 
                    serverData.search_history || 
                    serverData.data || 
                    serverData.items ||
                    serverData.results ||
                    [];
    } else {
      return [];
    }
    
    if (queriesArray.length === 0) {
      return [];
    }
    
    const sorted = [...queriesArray].sort((a, b) => {
      if (!a.searched_at && !b.searched_at) return 0;
      if (!a.searched_at) return 1;
      if (!b.searched_at) return -1;
      return new Date(b.searched_at).getTime() - new Date(a.searched_at).getTime();
    });
    
    const seen = new Set<string>();
    const unique: SearchQueryHistoryItem[] = [];
    
    for (const item of sorted) {
      const query = item.query?.trim() || 
                   item.search_query?.trim() || 
                   item.keyword?.trim() || 
                   '';
      
      if (query && !seen.has(query)) {
        seen.add(query);
        unique.push({
          query: query,
          searched_at: item.searched_at || item.searchedAt || item.created_at || item.createdAt,
        });
      }
    }
    
    return unique;
  }).catch(error => {
    console.error('검색 기록 조회 에러:', error);
    throw error;
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
        paper_id: paperId,  // doi를 paper_id로 저장
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
    doi: paperId,  // paper.id가 DOI 값이므로 doi로 전달
  };
  
  if (notes) {
    body.notes = notes;
  }
  
  return api.post<AddBookmarkResponse>(endpoints.bookmarks, body)
    .then(response => response.data)
    .catch((error: AxiosError) => {
      // 서버 응답에서 에러 메시지 추출
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

// 북마크 수정 (임시 비활성화)
export const updateBookmark = (_bookmarkId: string, _notes: string): Promise<UpdateBookmarkResponse> => {
  return Promise.reject(new Error('북마크 수정 기능이 임시로 비활성화되었습니다.'));
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
  summary?: string;
  update_count?: number;
  update_date?: string;
}

export interface SearchPapersResponse {
  papers: Paper[];
  total: number;
  page: number;
  pageSize: number;
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

// items 배열의 각 항목 타입
export interface InterestCategoryItem {
  code: string;
  name_ko: string | null;
  name_en: string;
}

export interface UserInterestsResponse {
  items?: InterestCategoryItem[];  // 서버 응답 형식: { items: [...] }
  category_ids?: number[];
  category_codes?: string[];
  categories?: CategoryInfo[];
}

export interface UserInterestsRequest {
  category_codes: string[];
}

/**
 * API 통신 모듈
 * 
 * 이 파일은 모든 API 요청을 처리하는 axios 인스턴스와 API 함수들을 정의합니다.
 * - Base URL 설정 및 axios 인스턴스 생성
 * - Request/Response 인터셉터를 통한 인증 토큰 자동 주입 및 에러 처리
 * - 인증 관련 API 함수 (로그인, 회원가입, 로그아웃 등)
 * - 논문 관련 API 엔드포인트 정의
 */

import axios, { AxiosError } from 'axios';
import { LoginRequest, LoginResponse, RegisterRequest, RegisterResponse, UsernameExistsResponse, UserProfile } from '../types/auth';

/**
 * API Base URL 설정
 * 환경 변수 VITE_API_BASE_URL이 설정되어 있으면 사용하고, 없으면 기본값 사용
 */
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://35.94.93.225';

/**
 * Axios 인스턴스 생성
 * 모든 API 요청의 기본 설정을 포함합니다.
 * - baseURL: 서버 주소
 * - timeout: 요청 타임아웃 (10초) - 개별 요청에서 timeout을 지정하면 그 값이 우선 적용됨
 * - withCredentials: 쿠키 기반 인증을 위한 설정
 * - transformRequest: form-urlencoded 요청을 위한 변환 로직
 * 
 * 주의: 검색 API는 응답 시간이 길어 개별 요청에서 timeout: 120000 (120초)로 설정함
 */
export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000, // 기본 타임아웃 (개별 요청의 timeout이 우선 적용됨)
  withCredentials: true, // 쿠키 기반 인증을 위한 설정
  headers: {
    'Content-Type': 'application/json',
  },
  // form-urlencoded 요청을 위한 transformRequest 설정
  transformRequest: [
    (data, headers) => {
      // form-urlencoded 요청인 경우
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
      // 기본 JSON 요청
      if (data && typeof data === 'object' && !(data instanceof URLSearchParams)) {
        return JSON.stringify(data);
      }
      return data;
    },
  ],
});

/**
 * Request Interceptor
 * 모든 요청 전에 실행되며, 인증 토큰을 자동으로 헤더에 추가합니다.
 * - localStorage에서 'access_token'을 가져와 Authorization 헤더에 추가
 * - 토큰이 없으면 헤더에 추가하지 않음
 */
api.interceptors.request.use(
  (config) => {
    // authStore에서 token 가져오기
    // localStorage에서 직접 가져오기 (authStore는 순환 참조 방지를 위해)
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

/**
 * Response Interceptor
 * 모든 응답에 대해 에러를 처리하고 표준화합니다.
 * - 401 에러: 자동 로그아웃 처리 및 로그인 페이지로 리다이렉트
 * - 네트워크 오류: 사용자 친화적인 에러 메시지 반환
 * - 기타 에러: 서버에서 받은 에러 메시지 또는 기본 메시지 반환
 */
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // 표준화된 에러 응답 처리
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data as any;
      
      // 401 Unauthorized - 로그인 페이지로 리다이렉트
      if (status === 401) {
        localStorage.removeItem('access_token');
        // authStore는 동적 import로 처리
        import('../store/authStore').then(({ useAuthStore }) => {
          useAuthStore.getState().logout();
        });
        window.location.href = '/login';
      }
      
      // 에러 메시지 표준화
      const errorMessage = data?.message || data?.error || `요청 처리 중 오류가 발생했습니다. (${status})`;
      return Promise.reject(new Error(errorMessage));
    }
    
    // 네트워크 오류
    if (error.request) {
      return Promise.reject(new Error('네트워크 오류가 발생했습니다. 서버에 연결할 수 없습니다.'));
    }
    
    // 기타 오류
    return Promise.reject(error);
  }
);

/**
 * API 엔드포인트 정의
 * 모든 API 엔드포인트를 중앙에서 관리합니다.
 * - auth: 인증 관련 엔드포인트
 * - papers: 논문 관련 엔드포인트
 */
export const endpoints = {
  auth: {
    login: '/auth/login',
    register: '/auth/register',
    signup: '/auth/signup', // 기존 호환성 유지
    logout: '/auth/logout',
    currentUser: '/auth/me',
  },
  papers: {
    search: '/papers/search',
    detail: (id: number) => `/papers/${id}`,
    bookmarks: '/papers/bookmarks',
    toggleBookmark: (id: number) => `/papers/${id}/bookmark`,
    searchHistory: '/papers/search-history',
  },
  bookmarks: '/bookmarks',
  userInterests: '/user-interests',
};

/**
 * 로그인 API 함수
 * 
 * @param body - 로그인 요청 데이터 (username, password)
 * @returns Promise<LoginResponse> - access_token, username, userId를 포함한 응답
 * 
 * 주의사항:
 * - Content-Type: application/x-www-form-urlencoded로 전송
 * - URLSearchParams를 사용하여 form-urlencoded 형식으로 변환
 */
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

/**
 * 회원가입 API 함수
 * 
 * @param body - 회원가입 요청 데이터 (email, username, name, password)
 * @returns Promise<RegisterResponse> - 회원가입 결과
 * 
 * 주의사항:
 * - Authorization 헤더가 필요할 수 있음 (관리자 전용일 수 있음)
 * - JSON 형식으로 전송
 */
export const register = (body: RegisterRequest): Promise<RegisterResponse> =>
  api.post<RegisterResponse>('/auth/register', body).then(response => response.data);

/**
 * 아이디 중복 확인 API 함수
 * 
 * @param username - 확인할 아이디
 * @returns Promise<boolean> - 아이디가 존재하면 true, 없으면 false
 * 
 * 주의사항:
 * - Authorization 헤더 필요
 * - Query parameter로 전송
 */
export const checkUsernameExists = (username: string): Promise<boolean> =>
  api.get<UsernameExistsResponse>('/auth/username-exists', { params: { username } })
    .then(res => res.data.exists);

/**
 * 사용자 프로필 조회 API 함수
 * 
 * @returns Promise<UserProfile> - 현재 로그인한 사용자의 프로필 정보
 * 
 * 주의사항:
 * - Authorization 헤더 필요
 * - 401 에러 시 자동으로 로그인 페이지로 리다이렉트됨
 */
export const fetchMyProfile = (): Promise<UserProfile> =>
  api.get<UserProfile>('/auth/me').then(res => res.data);

/**
 * 로그아웃 API 함수
 * 
 * @returns Promise<void> - 성공 시 아무 값도 반환하지 않음
 * 
 * 주의사항:
 * - Authorization 헤더 필요
 * - 성공 시 서버에서 세션/토큰을 무효화
 */
export const logout = (): Promise<void> =>
  api.post('/auth/logout').then(() => undefined);

/**
 * 북마크 조회 API 함수
 * 
 * @returns Promise<BookmarksListResponse> - 북마크 목록
 * 
 * 주의사항:
 * - Authorization 헤더 필요
 * - GET 요청
 * - 응답 형식: BookmarkListItem[] 또는 { bookmarks: BookmarkListItem[] }
 */
export const fetchBookmarks = (): Promise<BookmarksListResponse> =>
  api.get<BookmarksListResponse>(endpoints.bookmarks).then(res => res.data);

/**
 * 관심 카테고리 조회 API 함수
 * 
 * @returns Promise<UserInterestsResponse> - 사용자의 관심 카테고리 코드 배열
 * 
 * 주의사항:
 * - Authorization 헤더 필요
 * - GET 요청
 */
export const fetchUserInterests = (): Promise<UserInterestsResponse> =>
  api.get<UserInterestsResponse>(endpoints.userInterests).then(res => res.data);

/**
 * 검색 기록 조회 API 함수
 * 
 * @param userId - 사용자 ID
 * @param limit - 조회할 검색 기록 개수 (기본값: 20)
 * @returns Promise<SearchHistoryResponse> - 검색 기록 배열
 * 
 * 주의사항:
 * - Authorization 헤더 필요
 * - GET 요청
 * - params: { user_id: string, limit: number }
 */
export const fetchSearchHistory = (userId: string, limit: number = 20): Promise<SearchHistoryResponse> =>
  api.get<SearchHistoryResponse>(endpoints.papers.searchHistory, {
    params: { user_id: userId, limit },
  }).then(res => res.data);

/**
 * 북마크 추가 API 함수
 * 
 * @param paperId - 논문 ID (문자열)
 * @param notes - 북마크 메모 (선택)
 * @returns Promise<AddBookmarkResponse> - 북마크 추가 결과
 * 
 * 주의사항:
 * - Authorization 헤더 필요
 * - JSON 형식으로 전송
 * - body: { "paper_id": string, "notes"?: string }
 */
export const addBookmark = (paperId: string, notes?: string): Promise<AddBookmarkResponse> => {
  const body: AddBookmarkRequest = {
    paper_id: paperId,
  };
  
  if (notes) {
    body.notes = notes;
  }
  
  return api.post<AddBookmarkResponse>(endpoints.bookmarks, body).then(res => res.data);
};

/**
 * 북마크 삭제 API 함수
 * 
 * @param bookmarkId - 북마크 ID
 * @returns Promise<void> - 성공 시 아무 값도 반환하지 않음
 * 
 * 주의사항:
 * - Authorization 헤더 필요
 * - DELETE 요청
 */
export const deleteBookmark = (bookmarkId: string): Promise<void> =>
  api.delete(`${endpoints.bookmarks}/${bookmarkId}`).then(() => undefined);

/**
 * 북마크 수정 API 함수
 * 
 * @param bookmarkId - 북마크 ID
 * @param notes - 수정할 메모
 * @returns Promise<UpdateBookmarkResponse> - 북마크 수정 결과
 * 
 * 주의사항:
 * - Authorization 헤더 필요
 * - PUT 요청
 * - body: { "notes": string }
 */
export const updateBookmark = (bookmarkId: string, notes: string): Promise<UpdateBookmarkResponse> =>
  api.put<UpdateBookmarkResponse>(`${endpoints.bookmarks}/${bookmarkId}`, { notes }).then(res => res.data);

/**
 * 관심 카테고리 추가 API 함수
 * 
 * @param categoryCodes - 추가할 카테고리 코드 배열 (예: ["cs.AI", "cs.LG"])
 * @returns Promise<void> - 성공 시 아무 값도 반환하지 않음
 * 
 * 주의사항:
 * - Authorization 헤더 필요
 * - JSON 형식으로 전송
 * - body: { "category_codes": string[] }
 */
export const addUserInterests = (categoryCodes: string[]): Promise<void> =>
  api.post(endpoints.userInterests, { category_codes: categoryCodes }).then(() => undefined);

/**
 * ============================================
 * 타입 정의
 * ============================================
 */

// 회원가입 요청 타입 (기존 호환성 유지)
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

/**
 * 논문 데이터 타입
 * 
 * @property id - 논문 고유 ID
 * @property title - 논문 제목
 * @property authors - 저자 (문자열 또는 배열로 올 수 있음)
 * @property year - 출판 연도 (숫자 또는 문자열로 올 수 있음)
 * @property publisher - 출판사
 * @property abstract - 초록 (선택)
 * @property keywords - 키워드 배열 (선택)
 * @property categories - 카테고리 배열 (선택)
 * @property externalUrl - 외부 링크 (선택)
 * @property translatedSummary - 번역된 요약 (선택)
 * @property update_count - 업데이트 횟수 (선택)
 */
export interface Paper {
  id: number;
  title: string;
  authors: string | string[]; // API에서 문자열 또는 배열로 올 수 있음
  year: number | string; // API에서 숫자 또는 문자열로 올 수 있음
  publisher: string;
  abstract?: string;
  keywords?: string[];
  categories?: string[];
  externalUrl?: string;
  translatedSummary?: string;
  update_count?: number; // 업데이트 횟수
}

/**
 * 논문 검색 응답 타입
 * 
 * @property papers - 검색된 논문 배열
 * @property total - 전체 논문 개수
 * @property page - 현재 페이지 번호
 * @property pageSize - 페이지당 논문 개수
 */
export interface SearchPapersResponse {
  papers: Paper[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * 북마크 응답 타입
 * 
 * @property paperId - 논문 ID
 * @property isBookmarked - 북마크 여부
 */
export interface BookmarkResponse {
  paperId: number;
  isBookmarked: boolean;
}

/**
 * 북마크 추가 요청 타입
 * 
 * @property paper_id - 논문 ID (문자열)
 * @property notes - 북마크 메모 (선택)
 */
export interface AddBookmarkRequest {
  paper_id: string;
  notes?: string;
}

/**
 * 북마크 추가 응답 타입
 * 
 * 서버 응답 형식에 맞게 조정 필요
 */
export interface AddBookmarkResponse {
  message?: string;
  bookmark?: {
    id: string;
    paper_id: string;
    notes?: string;
    created_at?: string;
  };
}

/**
 * 북마크 조회 응답 아이템 타입
 * 
 * @property paper_id - 논문 ID
 * @property notes - 북마크 메모 (선택)
 * @property id - 북마크 ID (선택, 서버에서 제공하는 경우)
 */
export interface BookmarkListItem {
  paper_id: string;
  notes?: string;
  id?: string;
}

/**
 * 북마크 조회 응답 타입
 * 
 * 서버 응답 형식에 맞게 조정 필요
 * - 배열 형식: BookmarkListItem[]
 * - 또는 객체 형식: { bookmarks: BookmarkListItem[] }
 */
export type BookmarksListResponse = BookmarkListItem[] | { bookmarks: BookmarkListItem[] };

/**
 * 북마크 아이템 타입 (논문 정보 포함)
 * 
 * @property id - 북마크 ID
 * @property paper_id - 논문 ID
 * @property notes - 북마크 메모 (선택)
 * @property paper - 논문 정보 (또는 논문 ID만 있을 수 있음)
 */
export interface BookmarkItem {
  id: string;
  paper_id: string;
  notes?: string;
  paper?: Paper;
  // 또는 논문 정보가 별도로 올 수 있음
}

/**
 * 북마크 수정 응답 타입
 * 
 * 서버 응답 형식에 맞게 조정 필요
 */
export interface UpdateBookmarkResponse {
  message?: string;
  bookmark?: {
    id: string;
    paper_id: string;
    notes?: string;
    updated_at?: string;
  };
}

/**
 * 검색 기록 조회 응답 타입
 * 
 * @property papers - 검색 기록에 포함된 논문 배열
 */
export interface SearchHistoryResponse {
  papers: Paper[];
}

/**
 * 관심 카테고리 조회 응답 타입
 * 
 * @property category_codes - 카테고리 코드 배열
 */
export interface UserInterestsResponse {
  category_codes: string[];
}

/**
 * 관심 카테고리 요청 타입
 * 
 * @property category_codes - 카테고리 코드 배열
 */
export interface UserInterestsRequest {
  category_codes: string[];
}

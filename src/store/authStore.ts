// 인증 상태 관리 Store: 로그인/로그아웃, 토큰, 사용자 정보 관리 및 localStorage 영속화
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// 인증 상태 인터페이스
interface AuthState {
  isLoggedIn: boolean;
  token: string | null;
  username: string | null;
  name: string | null;
  userId: string | null;
  
  // Actions
  login: (token: string, username: string) => void;
  logout: () => void;
  loadFromStorage: () => void;
  setUserInfo: (name: string, userId: string) => void;
  updateUserId: (userId: string) => void;
}

// localStorage 키 상수
const STORAGE_KEY = 'auth-storage';
const TOKEN_KEY = 'access_token';
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isLoggedIn: false,
      token: null,
      username: null,
      name: null,
      userId: null,

      // 로그인 액션: 토큰을 localStorage에 저장하고 store 상태 업데이트
      login: (token: string, username: string) => {
        set({
          isLoggedIn: true,
          token,
          username,
        });
        localStorage.setItem(TOKEN_KEY, token);
      },

      // 로그아웃 액션: 모든 인증 관련 상태 초기화 및 localStorage에서 토큰 제거
      logout: () => {
        set({
          isLoggedIn: false,
          token: null,
          username: null,
          name: null,
          userId: null,
        });
        localStorage.removeItem(TOKEN_KEY);
      },

      // 사용자 정보 설정 액션: 회원가입 후 또는 프로필 조회 후 사용자 정보 업데이트
      setUserInfo: (name: string, userId: string) => {
        set((state) => ({
          ...state,
          name,
          userId,
          username: userId,
        }));
      },

      // 사용자 ID 업데이트 액션: 로그인 후 서버에서 받은 userId 업데이트
      updateUserId: (userId: string) => {
        set((state) => ({
          ...state,
          userId,
          username: userId,
        }));
      },

      // localStorage에서 인증 정보 복원: 앱 시작 시 또는 새로고침 시 호출
      loadFromStorage: () => {
        const token = localStorage.getItem(TOKEN_KEY);
        const stored = localStorage.getItem(STORAGE_KEY);
        
        if (token && stored) {
          try {
            const parsed = JSON.parse(stored);
            if (parsed.state?.token && parsed.state?.username) {
              set({
                isLoggedIn: true,
                token: parsed.state.token,
                username: parsed.state.username,
                name: parsed.state.name || null,
                userId: parsed.state.userId || parsed.state.username || null,
              });
            }
          } catch (e) {
            // 파싱 실패 시 초기화
            localStorage.removeItem(TOKEN_KEY);
            localStorage.removeItem(STORAGE_KEY);
          }
        } else if (token) {
          const stored = localStorage.getItem(STORAGE_KEY);
          if (stored) {
            try {
              const parsed = JSON.parse(stored);
              if (parsed.state?.username) {
                set({
                  isLoggedIn: true,
                  token: token,
                  username: parsed.state.username,
                  name: parsed.state.name || null,
                  userId: parsed.state.userId || parsed.state.username || null,
                });
              }
            } catch (e) {
              localStorage.removeItem(TOKEN_KEY);
              localStorage.removeItem(STORAGE_KEY);
            }
          }
        }
      },
    }),
    {
      name: STORAGE_KEY,
    }
  )
);

# 논문 검색 서비스 프론트엔드

논문 검색, 필터링, 북마크 기능을 제공하는 React + TypeScript 기반 웹 애플리케이션입니다.

## 📋 목차

- [주요 기능](#주요-기능)
- [기술 스택](#기술-스택)
- [시작하기](#시작하기)
- [프로젝트 구조](#프로젝트-구조)
- [주요 페이지](#주요-페이지)
- [환경 변수](#환경-변수)
- [배포](#배포)
- [주요 컴포넌트](#주요-컴포넌트)
- [스크립트](#스크립트)

## ✨ 주요 기능

- 🔍 **논문 검색**: 제목, 키워드로 논문 검색
- 🏷️ **카테고리 필터링**: `CategoryFilter`와 URL 쿼리 기반 카테고리 필터
- 🔖 **북마크**: 관심 논문 북마크 및 내 서재 관리
- 👤 **사용자 인증**: 회원가입, 로그인, 마이페이지
- 📚 **내 서재**: 북마크한 논문 모아보기 및 정렬(제목, 연도, 최근 추가)
- ⏰ **최근 본 논문**: 최근 조회한 논문 목록 및 상세 페이지 연동
- 💡 **추천 논문**: 상세 페이지 진입 시 현재 논문을 기반으로 하는 추천 논문 섹션
- 📱 **반응형 디자인**: 모바일, 태블릿, 데스크톱 지원

## 🛠 기술 스택

### 핵심 기술
- **React** - UI 라이브러리
- **TypeScript** - 타입 안정성
- **Vite** - 빌드 도구 및 개발 서버

### 상태 관리 및 데이터 페칭
- **Zustand** - 클라이언트 상태 관리 (`authStore`, `useAppStore`)
- **TanStack Query (React Query)** - 서버 상태 관리 및 캐싱 (`hooks/api/*`)

### 라우팅
- **React Router DOM** - 클라이언트 사이드 라우팅

### UI 컴포넌트
- **Radix UI 기반 커스텀 컴포넌트** (`src/components/ui/*`)
- **Tailwind CSS** - 유틸리티 기반 CSS 프레임워크
- **Lucide React** - 아이콘 라이브러리

### 기타
- **React Hook Form** - 폼 상태 관리
- **Axios** - HTTP 클라이언트 (`lib/api.ts`)

## 🚀 시작하기

### 필요 조건

- **Node.js** 18.x 이상
- **npm**

### 설치

```bash
# 의존성 설치
npm install
```

### 개발 서버 실행

```bash
# 개발 서버 시작 (기본 포트 3000)
npm run dev
```

브라우저에서 `http://localhost:3000`으로 접속하세요.

### 빌드

```bash
# 프로덕션 빌드
npm run build
```

빌드 결과물은 `build/` 폴더에 생성됩니다.

## 📁 프로젝트 구조

```text
front_end/
├── public/                 # 정적 파일 (현재 비어 있음 / 선택 사용)
├── src/
│   ├── components/         # React 컴포넌트
│   │   ├── category/       # 카테고리 관련 컴포넌트
│   │   │   ├── CategoryFilter.tsx        # 검색 결과용 카테고리 필터
│   │   │   ├── CategorySearch.tsx        # 메인 페이지 "카테고리로 검색"
│   │   │   └── UserInterestCategory.tsx  # 마이페이지 관심 카테고리 설정
│   │   ├── layout/        # 레이아웃 (헤더, 푸터, Hero, ScrollToTopButton 등)
│   │   ├── pages/         # 페이지 컴포넌트
│   │   ├── papers/        # 논문 카드, 인기 논문, 최근 본 논문 등
│   │   └── ui/            # 재사용 가능한 UI 컴포넌트 (Button, Card, Dialog, Select 등)
│   ├── hooks/             # 커스텀 훅
│   │   ├── api/           # React Query 기반 API 훅 (usePapers, useLogin, useMyProfile 등)
│   │   ├── useNavigation.ts      # 라우팅/페이지 이동 헬퍼 훅
│   │   └── usePaperActions.ts    # 논문 클릭·북마크 공통 액션 훅
│   ├── lib/               # 유틸리티 및 설정
│   │   ├── api.ts         # Axios 인스턴스, 엔드포인트, 순수 API 함수
│   │   └── queryClient.ts # React Query 클라이언트 설정
│   ├── store/             # Zustand 스토어 (authStore, useAppStore)
│   ├── styles/            # 전역 스타일 (globals.css)
│   ├── types/             # TypeScript 타입 정의 (paper, user, navigation 등)
│   ├── App.tsx            # 라우팅 및 전역 레이아웃
│   └── main.tsx           # 엔트리 포인트
├── index.html             # HTML 템플릿
├── package.json           # 프로젝트 의존성
├── tsconfig.json          # TypeScript 설정
├── vite.config.ts         # Vite 설정
└── README.md              # 프로젝트 문서
```

## 📄 주요 페이지

- **/** - 홈 페이지 (히어로 섹션, 인기 논문, 최근 조회 논문, 카테고리로 검색)
- **/search** - 검색 결과 페이지 (카테고리 필터, 검색 결과 리스트, 페이지네이션)
- **/paper/:id** - 논문 상세 페이지 (요약/Abstract, 추천 논문, 북마크)
- **/login** - 로그인 페이지
- **/signup** - 회원가입 페이지
- **/mypage** - 마이페이지 (내 정보, 관심 카테고리 설정)
- **/library** - 내 서재 (북마크 목록 + 정렬/페이지네이션)
- **/recent** - 최근 본 논문 전체 보기
- **/intro** - 서비스 소개
- **/guide** - 이용 가이드

## 🔧 환경 변수

프로젝트 루트에 `.env` 파일을 생성하고 다음 변수를 설정하세요:

```env
# API Base URL
VITE_API_BASE_URL=http://your-api-url.com
```

환경 변수가 설정되지 않으면 기본값 `http://35.94.93.225`가 사용됩니다.  
(`src/lib/api.ts`의 `BASE_URL` 참고)

## 📦 배포

### GitHub에 코드 저장

1. GitHub에 새 저장소 생성
2. 프로젝트 디렉토리에서 Git 초기화 및 푸시:

```bash
cd front_end
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/your-username/your-repo.git
git branch -M main
git push -u origin main
```

### Vercel 배포

1. [Vercel](https://vercel.com)에 로그인
2. "Add New Project" 클릭
3. GitHub 저장소 선택 및 Import
4. 프로젝트 설정:
   - **Root Directory**: `front_end`
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `build`
   - **Install Command**: `npm install`
5. 환경 변수 설정:
   - `VITE_API_BASE_URL` 추가 (프로덕션 API URL)
6. "Deploy" 클릭

배포 완료 후 자동으로 생성된 URL로 접속할 수 있습니다.

### 자동 배포

GitHub 저장소와 Vercel을 연결하면:
- `main` 브랜치에 푸시 → 프로덕션 자동 배포
- 다른 브랜치에 푸시 → Preview 배포
- Pull Request 생성 → Preview URL 자동 생성

## 🎨 주요 컴포넌트

### UnifiedPaperCard
통합 논문 카드 컴포넌트로 다양한 variant를 지원합니다:
- `default` - 기본 카드 레이아웃
- `list` - 목록 형태
- `search` - 검색 결과 형태
- `compact` - 컴팩트 형태
- `recommended` - 추천 논문 형태

요약/번역 요약, 카테고리, 북마크 버튼, 외부 링크 버튼 등을 옵션으로 제어할 수 있습니다.

### CategoryFilter (`components/category/CategoryFilter.tsx`)
- 검색 결과 페이지 좌측/모바일 시트에서 사용하는 **트리 구조 카테고리 필터**입니다.
- 상위 카테고리(인공지능, 시스템 등)를 펼치고, 하위 카테고리 코드(`cs.AI` 등)를 체크박스로 선택합니다.

### CategorySearch (`components/category/CategorySearch.tsx`)
- 홈 메인 섹션의 **"카테고리로 검색"** UI입니다.
- 1차/2차 카테고리를 선택해 해당 카테고리 코드로 검색 페이지로 이동할 때 사용할 수 있습니다.

### UserInterestCategory (`components/category/UserInterestCategory.tsx`)
- 마이페이지에서 **관심 카테고리(선호 분야)**를 설정/저장하는 컴포넌트입니다.
- React Query와 서버 API를 사용해 선택된 카테고리를 조회/추가/삭제합니다.

## 📝 스크립트

- `npm run dev` - 개발 서버 실행
- `npm run build` - 프로덕션 빌드

---

**참고**: 이 프로젝트는 논문 검색 서비스의 프론트엔드 애플리케이션입니다. 실제 데이터는 별도의 백엔드 API 서버에서 제공합니다.


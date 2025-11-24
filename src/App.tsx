// 메인 App 컴포넌트
import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import { useAuthStore } from './store/authStore';
import { HomePage } from './components/pages/HomePage';
import { LoginPage } from './components/pages/LoginPage';
import { SignupPage } from './components/pages/SignupPage';
import { SearchResultsListPage } from './components/pages/SearchResultsListPage';
import { PaperDetailPage } from './components/pages/PaperDetailPage';
import { ServiceIntroPage } from './components/pages/ServiceIntroPage';
import { UserGuidePage } from './components/pages/UserGuidePage';
import { MyPage } from './components/pages/MyPage';
import { RecentlyViewedListPage } from './components/pages/RecentlyViewedListPage';
import { MyLibraryPage } from './components/pages/MyLibraryPage';
import { QuitAccountPage } from './components/pages/QuitAccountPage';
import { Toaster } from './components/ui/sonner';
import { ScrollToTop } from './components/ScrollToTop';

function AppContent() {
  const loadFromStorage = useAuthStore((state) => state.loadFromStorage);

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  return (
    <BrowserRouter>
      <ScrollToTop />
      <Toaster />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/search" element={<SearchResultsListPage />} />
        <Route path="/paper/:id" element={<PaperDetailPage />} />
        <Route path="/intro" element={<ServiceIntroPage />} />
        <Route path="/guide" element={<UserGuidePage />} />
        <Route path="/mypage" element={<MyPage />} />
        <Route path="/recent" element={<RecentlyViewedListPage />} />
        <Route path="/library" element={<MyLibraryPage />} />
        <Route path="/quit" element={<QuitAccountPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}

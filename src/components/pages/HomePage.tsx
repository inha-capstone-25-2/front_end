import { Header } from '../layout/Header';
import { HeroSection } from '../layout/HeroSection';
import { RecentlyViewedPapers } from '../papers/RecentlyViewedPapers';
import { CategorySearch } from '../category/CategorySearch';
import { PopularPapers } from '../papers/PopularPapers';
import { Footer } from '../layout/Footer';
import { ScrollToTopButton } from '../layout/ScrollToTopButton';
import { useNavigation } from '../../hooks/useNavigation';
import { useAuthStore } from '../../store/authStore';
import { useAppStore } from '../../store/useAppStore';
import { usePaperActions } from '../../hooks/usePaperActions';

export function HomePage() {
  const { goToLogin, goToSearch, goToCategorySearch } = useNavigation();
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const bookmarkedPaperIds = useAppStore((state) => state.bookmarkedPaperIds);
  const { handlePaperClick, handleBookmark } = usePaperActions();

  const handleCategorySelect = (categoryCode: string) => {
    if (!isLoggedIn) {
      goToLogin();
      return;
    }
    goToCategorySearch(categoryCode);
  };

  const handleSearch = (query: string) => {
    if (!isLoggedIn) {
      goToLogin();
      return;
    }
    goToSearch(query);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <HeroSection onSearch={handleSearch} />
        {isLoggedIn && (
          <RecentlyViewedPapers 
            onPaperClick={handlePaperClick} 
            bookmarkedPaperIds={bookmarkedPaperIds.map(id => parseInt(id))}
            onToggleBookmark={handleBookmark}
          />
        )}
        <CategorySearch onCategorySelect={handleCategorySelect} />
        {isLoggedIn && (
          <PopularPapers 
            onToggleBookmark={handleBookmark}
            onPaperClick={handlePaperClick}
          />
        )}
      </main>
      <Footer />
      <ScrollToTopButton />
    </div>
  );
}

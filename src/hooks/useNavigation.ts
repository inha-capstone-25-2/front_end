import { useNavigate, useParams, useSearchParams } from 'react-router-dom';

export function useNavigation() {
  const navigate = useNavigate();
  const params = useParams();
  const [searchParams] = useSearchParams();

  return {
    navigate,
    params,
    searchParams,
    goToLogin: () => navigate('/login'),
    goToSignup: () => navigate('/signup'),
    goToHome: () => {
      // 메인 페이지로 이동하면서 새로고침
      window.location.href = '/';
    },
    goToService: () => navigate('/intro'),
    goToGuide: () => navigate('/guide'),
    goToMyPage: () => navigate('/mypage'),
    goToRecentPapers: () => navigate('/recent'),
    goToMyLibrary: () => navigate('/library'),
    goToQuitAccount: () => navigate('/quit'),
    goToPaper: (paperId: string | number) => navigate(`/paper/${paperId}`),
    goToSearch: (query: string) => navigate(`/search?q=${encodeURIComponent(query)}`),
    goToCategorySearch: (categoryCode: string) => navigate(`/search?categories=${encodeURIComponent(categoryCode)}`),
    goBack: () => navigate(-1),
  };
}

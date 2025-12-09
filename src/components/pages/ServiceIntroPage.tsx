import { Header } from '../layout/Header';
import { Footer } from '../layout/Footer';
import { BookOpen, Globe, Zap, Search, FileText, TrendingUp } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { ScrollToTopButton } from '../layout/ScrollToTopButton';

export function ServiceIntroPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        {/* Features */}
        <section className="w-full py-20 bg-white">
          <div className="max-w-[1200px] mx-auto px-4 md:px-6 lg:px-10">
            <h2 className="text-3xl font-bold text-center mb-12" style={{ color: '#215285' }}>
              주요 기능
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card className="text-center">
                <CardContent className="p-6">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ backgroundColor: '#EAF4FA' }}>
                    <Search className="h-8 w-8" style={{ color: '#4FA3D1' }} />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">스마트 검색</h3>
                  <p className="text-gray-600">
                    키워드, 카테고리, 연도 등 다양한 조건으로 논문을 검색할 수 있습니다
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardContent className="p-6">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ backgroundColor: '#EAF4FA' }}>
                    <Globe className="h-8 w-8" style={{ color: '#4FA3D1' }} />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">자동 번역</h3>
                  <p className="text-gray-600">
                    영어 논문을 한국어로 자동 번역하여 더 쉽게 이해할 수 있습니다
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardContent className="p-6">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ backgroundColor: '#EAF4FA' }}>
                    <FileText className="h-8 w-8" style={{ color: '#4FA3D1' }} />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">자동 요약</h3>
                  <p className="text-gray-600">
                    AI가 논문의 핵심 내용을 요약하여 빠르게 파악할 수 있습니다
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Benefits */}
        <section className="w-full py-20 bg-gray-50">
          <div className="max-w-[1200px] mx-auto px-4 md:px-6 lg:px-10">
            <h2 className="text-3xl font-bold text-center mb-12" style={{ color: '#215285' }}>
              서비스 장점
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#EAF4FA' }}>
                      <Zap className="h-6 w-6" style={{ color: '#4FA3D1' }} />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold mb-2">빠른 검색</h3>
                      <p className="text-gray-600">
                        대용량 논문 데이터베이스를 빠르게 검색하여 원하는 논문을 쉽게 찾을 수 있습니다
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#EAF4FA' }}>
                      <TrendingUp className="h-6 w-6" style={{ color: '#4FA3D1' }} />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold mb-2">인기 논문 추천</h3>
                      <p className="text-gray-600">
                        인기 있는 논문과 최신 논문을 추천하여 연구 동향을 파악할 수 있습니다
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#EAF4FA' }}>
                      <BookOpen className="h-6 w-6" style={{ color: '#4FA3D1' }} />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold mb-2">개인화된 서재</h3>
                      <p className="text-gray-600">
                        관심 있는 논문을 북마크하여 나만의 서재를 만들고 관리할 수 있습니다
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#EAF4FA' }}>
                      <FileText className="h-6 w-6" style={{ color: '#4FA3D1' }} />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold mb-2">최근 본 논문</h3>
                      <p className="text-gray-600">
                        최근에 본 논문을 기록하여 쉽게 다시 찾아볼 수 있습니다
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>
      <Footer />
      <ScrollToTopButton />
    </div>
  );
}

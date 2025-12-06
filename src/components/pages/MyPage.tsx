import React, { useState, useRef } from 'react';
import { Eye, EyeOff, User, Key, Clock, Bookmark, ChevronRight, LogOut, Camera } from 'lucide-react';
import { Header } from '../layout/Header';
import { Footer } from '../layout/Footer';
import { Card, CardContent, CardHeader } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { ScrollToTopButton } from '../layout/ScrollToTopButton';
import { useNavigation } from '../../hooks/useNavigation';
import { useAuthStore } from '../../store/authStore';
import { useUsernameExistsQuery } from '../../hooks/api/useUsernameExists';
import { useMyProfileQuery } from '../../hooks/api/useMyProfile';
import { UserProfile } from '../../types/auth';
import { useLogoutMutation } from '../../hooks/api/useLogout';
import { UserInterestCategory } from '../category/UserInterestCategory';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export function MyPage() {
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [showIdChange, setShowIdChange] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [newUserId, setNewUserId] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isHoveringProfile, setIsHoveringProfile] = useState(false);
  const [profileImage, setProfileImage] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const updateUserId = useAuthStore((state) => state.updateUserId);
  const { goToRecentPapers, goToMyLibrary, goToQuitAccount } = useNavigation();

  // 사용자 프로필 정보 가져오기
  const { data: profile, isLoading, isError } = useMyProfileQuery();
  
  // 프로필 데이터가 있으면 사용, 없으면 store에서 가져오기
  const name = (profile as UserProfile | undefined)?.name || '';
  const userId = (profile as UserProfile | undefined)?.username || '';

  // 아이디 중복 확인 (새 아이디 입력 시)
  const usernameExistsQuery = useUsernameExistsQuery(
    newUserId,
    showIdChange && newUserId.length > 0 && newUserId !== userId
  );

  // 로그아웃 mutation
  const { mutate: handleLogout, isPending: isLoggingOut } = useLogoutMutation();

  const handleProfileImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // 이미지 미리보기
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result as string);
      };
      reader.readAsDataURL(file);
      toast.success('프로필 사진이 변경되었습니다');
    }
  };

  const handleIdChange = () => {
    if (!newUserId || newUserId === userId) {
      toast.error('새 아이디를 입력해주세요');
      return;
    }

    if (usernameExistsQuery.isLoading) {
      toast.info('아이디 확인 중...');
      return;
    }

    if (usernameExistsQuery.data === true) {
      toast.error('이미 사용 중인 아이디입니다');
      return;
    }

    if (usernameExistsQuery.data === false) {
      updateUserId(newUserId);
      setNewUserId('');
      setShowIdChange(false);
      toast.success('아이디가 변경되었습니다');
    }
  };

  const handlePasswordChange = () => {
    if (!newPassword || !confirmPassword) {
      toast.error('비밀번호를 입력해주세요');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('비밀번호가 일치하지 않습니다');
      return;
    }

    setNewPassword('');
    setConfirmPassword('');
    setShowPasswordChange(false);
    toast.success('비밀번호가 변경되었습니다');
  };

  // 로딩 중
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 bg-gray-50 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin" style={{ color: '#4FA3D1' }} />
            <p className="text-gray-600">사용자 정보를 불러오는 중...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // 에러 발생 시 (401은 useMyProfileQuery에서 처리)
  if (isError && !isLoggedIn) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-600 mb-4">로그인이 필요한 페이지입니다.</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 bg-gray-50">
        <div className="max-w-[1200px] mx-auto px-4 md:px-6 lg:px-10 py-8">
          <Card className="mb-8 shadow-md" style={{ borderRadius: '12px' }}>
            <CardHeader className="pb-4">
              <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                {/* 프로필 사진 */}
                <div className="relative">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div 
                          className="relative"
                          onMouseEnter={() => setIsHoveringProfile(true)}
                          onMouseLeave={() => setIsHoveringProfile(false)}
                        >
                          <Avatar 
                            className="w-24 h-24 border-2 border-gray-300 cursor-pointer"
                            onClick={handleProfileImageClick}
                          >
                            <AvatarImage src={profileImage} alt={name} />
                            <AvatarFallback style={{ backgroundColor: '#4FA3D1' }}>
                              <User className="w-12 h-12 text-white" />
                            </AvatarFallback>
                          </Avatar>
                          
                          {/* 카메라 아이콘 오버레이 */}
                          {isHoveringProfile && (
                            <div 
                              className="absolute bottom-0 right-0 w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition-opacity"
                              style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
                              onClick={handleProfileImageClick}
                            >
                              <Camera className="w-4 h-4 text-white" />
                            </div>
                          )}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>사진 변경</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  
                  {/* 숨겨진 파일 입력 */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/jpg"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>
                {/* 사용자 정보 텍스트 */}
                <div className="flex-1 text-center md:text-left">
                  <h2 className="text-[24px]" style={{ color: '#215285' }}>사용자 정보</h2>
                  <p className="text-sm text-gray-600 mt-1">계정 정보를 확인하고 변경할 수 있습니다</p>
                </div>
                {/* 로그아웃 버튼 */}
                <div className="w-full md:w-auto flex justify-center md:justify-end md:self-start">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleLogout()}
                    disabled={isLoggingOut}
                    className="border-red-200 text-red-500 hover:bg-red-50 hover:text-red-600 text-sm px-3 py-1"
                  >
                    <LogOut className="w-4 h-4 mr-1.5" />
                    {isLoggingOut ? '로그아웃 중...' : '로그아웃'}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 사용자 이름 */}
              <div>
                <Label className="text-gray-700">이름</Label>
                <div className="mt-2 px-4 py-3 bg-gray-50 rounded-md border border-gray-200">
                  <p>{name}</p>
                </div>
              </div>

              {/* 아이디 */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-gray-700">아이디</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowIdChange(!showIdChange);
                      if (showIdChange) {
                        setNewUserId('');
                      }
                    }}
                    style={{ borderColor: '#215285', color: '#215285' }}
                    className="hover:bg-[#215285] hover:text-white"
                  >
                    아이디 변경
                  </Button>
                </div>
                {!showIdChange ? (
                  <div className="px-4 py-3 bg-gray-50 rounded-md border border-gray-200">
                    <p>{userId}</p>
                  </div>
                ) : (
                  <div className="space-y-3 p-4 bg-gray-50 rounded-md border border-gray-200">
                    <Input
                      id="newUserId"
                      name="newUserId"
                      type="text"
                      placeholder="새 아이디를 입력하세요"
                      value={newUserId}
                      onChange={(e) => setNewUserId(e.target.value)}
                      className="h-10"
                    />
                    {/* 아이디 중복 확인 메시지 */}
                    {newUserId && newUserId !== userId && (
                      <div className="text-sm">
                        {usernameExistsQuery.isLoading && (
                          <p className="text-gray-500">아이디 확인 중...</p>
                        )}
                        {usernameExistsQuery.isError && (
                          <p className="text-red-600">아이디 확인 중 오류가 발생했습니다.</p>
                        )}
                        {usernameExistsQuery.data !== undefined && !usernameExistsQuery.isLoading && (
                          <p className={usernameExistsQuery.data ? 'text-red-600' : 'text-green-600'}>
                            {usernameExistsQuery.data 
                              ? '이미 사용 중인 아이디입니다' 
                              : '사용 가능한 아이디입니다'}
                          </p>
                        )}
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Button
                        onClick={handleIdChange}
                        className="flex-1 text-white"
                        style={{ backgroundColor: '#215285' }}
                        disabled={usernameExistsQuery.isLoading || usernameExistsQuery.data === true || !newUserId || newUserId === userId}
                      >
                        저장
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowIdChange(false);
                          setNewUserId('');
                        }}
                        className="flex-1"
                      >
                        취소
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* 비밀번호 */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-gray-700">비밀번호</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowPasswordChange(!showPasswordChange);
                      if (showPasswordChange) {
                        setNewPassword('');
                        setConfirmPassword('');
                      }
                    }}
                    style={{ borderColor: '#215285', color: '#215285' }}
                    className="hover:bg-[#215285] hover:text-white"
                  >
                    <Key className="w-4 h-4 mr-2" />
                    비밀번호 변경
                  </Button>
                </div>
                {!showPasswordChange ? (
                  <div className="px-4 py-3 bg-gray-50 rounded-md border border-gray-200">
                    <p>••••••••</p>
                  </div>
                ) : (
                  <div className="space-y-3 p-4 bg-gray-50 rounded-md border border-gray-200">
                    <div>
                      <Label htmlFor="newPassword" className="text-sm">새 비밀번호</Label>
                      <div className="relative mt-1">
                        <Input
                          id="newPassword"
                          type={showNewPassword ? 'text' : 'password'}
                          placeholder="새 비밀번호를 입력하세요"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="h-10 pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        >
                          {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="confirmPassword" className="text-sm">비밀번호 확인</Label>
                      <div className="relative mt-1">
                        <Input
                          id="confirmPassword"
                          type={showConfirmPassword ? 'text' : 'password'}
                          placeholder="비밀번호를 다시 입력하세요"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="h-10 pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        >
                          {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={handlePasswordChange}
                        className="flex-1 text-white"
                        style={{ backgroundColor: '#215285' }}
                      >
                        저장
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowPasswordChange(false);
                          setNewPassword('');
                          setConfirmPassword('');
                        }}
                        className="flex-1"
                      >
                        취소
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 관심 카테고리 선택 */}
          <UserInterestCategory />

          {/* Quick Actions - 최근 본 논문과 내 서재만 표시 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={goToRecentPapers}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Clock className="h-8 w-8 mb-2" style={{ color: '#4FA3D1' }} />
                    <h3 className="font-semibold mb-1">최근 본 논문</h3>
                    <p className="text-sm text-gray-600">최근에 조회한 논문 보기</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={goToMyLibrary}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Bookmark className="h-8 w-8 mb-2" style={{ color: '#4FA3D1' }} />
                    <h3 className="font-semibold mb-1">내 서재</h3>
                    <p className="text-sm text-gray-600">북마크한 논문 관리</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 회원 탈퇴 버튼 */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <Button
                variant="outline"
                className="w-full border-red-200 text-red-500 hover:bg-red-50 hover:text-red-600"
                onClick={goToQuitAccount}
              >
                회원 탈퇴
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
      <ScrollToTopButton />
    </div>
  );
}

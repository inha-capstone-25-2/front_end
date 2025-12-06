import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Checkbox } from '../ui/checkbox';
import { Card, CardContent, CardHeader } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';
import { ScrollToTopButton } from '../layout/ScrollToTopButton';
import { useNavigation } from '../../hooks/useNavigation';
import { useLoginMutation } from '../../hooks/api/useLogin';
import { toast } from 'sonner';
import logo from '../../assets/logo.png';

// Google 로고 SVG 컴포넌트
function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M19.6 10.227c0-.709-.064-1.39-.182-2.045H10v3.868h5.382a4.6 4.6 0 01-1.996 3.018v2.51h3.232c1.891-1.742 2.982-4.305 2.982-7.35z" fill="#4285F4"/>
      <path d="M10 20c2.7 0 4.964-.895 6.618-2.423l-3.232-2.509c-.895.6-2.04.955-3.386.955-2.605 0-4.81-1.76-5.595-4.123H1.064v2.59A9.996 9.996 0 0010 20z" fill="#34A853"/>
      <path d="M4.405 11.9c-.2-.6-.314-1.24-.314-1.9 0-.66.114-1.3.314-1.9V5.51H1.064A9.996 9.996 0 000 10c0 1.614.386 3.14 1.064 4.49L4.405 11.9z" fill="#FBBC05"/>
      <path d="M10 3.977c1.468 0 2.786.505 3.823 1.496l2.868-2.868C14.959.99 12.695 0 10 0 6.09 0 2.71 2.24 1.064 5.51l3.34 2.59C5.19 5.736 7.395 3.977 10 3.977z" fill="#EA4335"/>
    </svg>
  );
}

export function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const { goToSignup, goToHome } = useNavigation();
  const navigate = useNavigate();
  const loginMutation = useLoginMutation();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate(
      { username, password },
      {
        onSuccess: () => {
          toast.success('로그인 성공');
          navigate('/');
        },
        onError: (error: Error) => {
          toast.error('로그인 실패', {
            description: error.message || '사용자 이름 또는 비밀번호를 확인해주세요.',
          });
        },
      }
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-8 h-24 md:h-28">
          <img 
            src={logo} 
            alt="RSRS Logo" 
            className="h-full w-auto object-contain cursor-pointer" 
            style={{ maxHeight: '100%' }}
            onClick={goToHome}
          />
        </div>

        {/* Login Card */}
        <Card className="shadow-lg" style={{ borderRadius: '12px' }}>
          <CardHeader className="text-center pb-4">
            <h2 className="text-[24px]">로그인</h2>
            <p className="text-gray-600 mt-2">계정에 로그인하여 서비스를 이용하세요</p>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            {/* 에러 메시지 표시 */}
            {loginMutation.isError && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>
                  {loginMutation.error?.message || '로그인 중 오류가 발생했습니다.'}
                </AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">아이디</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="아이디를 입력하시오"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="h-12"
                  required
                  disabled={loginMutation.isPending}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">비밀번호</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="비밀번호를 입력하세요"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12 pr-10"
                    required
                    disabled={loginMutation.isPending}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    disabled={loginMutation.isPending}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="remember"
                    checked={rememberMe}
                    onCheckedChange={(checked) => setRememberMe(checked === true)}
                    disabled={loginMutation.isPending}
                  />
                  <Label htmlFor="remember" className="text-sm cursor-pointer">
                    로그인 상태 유지
                  </Label>
                </div>
                <button
                  type="button"
                  className="text-sm text-blue-600 hover:underline"
                  disabled={loginMutation.isPending}
                >
                  비밀번호 찾기
                </button>
              </div>

              <Button
                type="submit"
                className="w-full h-12 text-white transition-colors"
                style={{ backgroundColor: '#215285' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1A3E66'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#215285'}
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? '로그인 중...' : '로그인'}
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-gray-500">또는</span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full h-12"
                onClick={() => {
                  // Google 로그인 로직
                }}
                disabled={loginMutation.isPending}
              >
                <GoogleIcon />
                <span className="ml-2">Google로 로그인</span>
              </Button>
            </form>

            <div className="mt-6 text-center text-sm">
              <span className="text-gray-600">계정이 없으신가요? </span>
              <button
                onClick={goToSignup}
                className="text-blue-600 hover:underline font-medium"
                disabled={loginMutation.isPending}
              >
                회원가입
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
      <ScrollToTopButton />
    </div>
  );
}

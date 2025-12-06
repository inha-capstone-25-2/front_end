import React, { useState, useCallback } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardHeader } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';
import { Header } from '../layout/Header';
import { Footer } from '../layout/Footer';
import { ScrollToTopButton } from '../layout/ScrollToTopButton';
import { useNavigation } from '../../hooks/useNavigation';
import { useQuitAccountMutation } from '../../hooks/api/useQuitAccount';
import { useMyProfileQuery } from '../../hooks/api/useMyProfile';
import { login } from '../../lib/api';
import { toast } from 'sonner';
import logo from '../../assets/logo.png';

// 상수 정의
const BUTTON_HEIGHT = 'h-12';
const RED_BUTTON_STYLE = 'flex-1 h-12 border-red-600 text-red-600 hover:bg-red-50 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent';
const CANCEL_BUTTON_STYLE = 'flex-1 h-12';

const DELETE_WARNING_ITEMS = [
  '프로필 정보',
  '북마크한 논문',
  '검색 기록',
];

export function QuitAccountPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showFinalConfirm, setShowFinalConfirm] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  
  const { goToMyPage, goToHome } = useNavigation();
  const { data: profile } = useMyProfileQuery();
  const quitAccountMutation = useQuitAccountMutation();

  const userId = profile?.username || '';
  const isDisabled = isVerifying || quitAccountMutation.isPending;
  const isFormValid = Boolean(username && password);

  // 상태 초기화 함수
  const resetForm = useCallback(() => {
    setUsername('');
    setPassword('');
    setShowPassword(false);
    setShowFinalConfirm(false);
  }, []);

  // 아이디/비밀번호 검증
  const validateInputs = useCallback((): boolean => {
    if (!username || !password) {
      toast.error('아이디와 비밀번호를 모두 입력해주세요');
      return false;
    }

    if (username !== userId) {
      toast.error('아이디가 일치하지 않습니다');
      return false;
    }

    return true;
  }, [username, password, userId]);

  // 아이디/비밀번호 확인 처리
  const handleVerification = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateInputs()) {
      return;
    }

    setIsVerifying(true);
    try {
      await login({ username, password });
      setShowFinalConfirm(true);
    } catch (error) {
      toast.error('비밀번호가 일치하지 않습니다');
    } finally {
      setIsVerifying(false);
    }
  }, [username, password, validateInputs]);

  // 최종 탈퇴 처리
  const handleFinalQuit = useCallback(() => {
    quitAccountMutation.mutate();
  }, [quitAccountMutation]);

  // 취소 버튼 클릭 처리
  const handleCancel = useCallback(() => {
    if (showFinalConfirm) {
      resetForm();
    } else {
      goToMyPage();
    }
  }, [showFinalConfirm, resetForm, goToMyPage]);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-1 flex items-center justify-center px-4 py-12">
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

          {/* Quit Account Card */}
          <Card className="shadow-lg" style={{ borderRadius: '12px' }}>
            <CardHeader className="text-center pb-4">
              <h2 className="text-[24px] mb-2">회원 탈퇴</h2>
              <p className="text-gray-600 mt-2">
                {showFinalConfirm ? (
                  '정말 탈퇴하시겠습니까?'
                ) : (
                  <>
                    탈퇴를 진행하려면 아이디와 비밀번호를 입력해주세요.
                    <br />
                    탈퇴 후에는 모든 데이터가 삭제되며 복구할 수 없습니다.
                  </>
                )}
              </p>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              {!showFinalConfirm ? (
                <VerificationForm
                  username={username}
                  password={password}
                  showPassword={showPassword}
                  isDisabled={isDisabled}
                  isFormValid={isFormValid}
                  onUsernameChange={setUsername}
                  onPasswordChange={setPassword}
                  onTogglePasswordVisibility={() => setShowPassword(prev => !prev)}
                  onSubmit={handleVerification}
                  onCancel={handleCancel}
                />
              ) : (
                <FinalConfirmation
                  isPending={quitAccountMutation.isPending}
                  onConfirm={handleFinalQuit}
                  onCancel={handleCancel}
                />
              )}
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
      <ScrollToTopButton />
    </div>
  );
}

// 검증 폼 컴포넌트
interface VerificationFormProps {
  username: string;
  password: string;
  showPassword: boolean;
  isDisabled: boolean;
  isFormValid: boolean;
  onUsernameChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onTogglePasswordVisibility: () => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}

function VerificationForm({
  username,
  password,
  showPassword,
  isDisabled,
  isFormValid,
  onUsernameChange,
  onPasswordChange,
  onTogglePasswordVisibility,
  onSubmit,
  onCancel,
}: VerificationFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="username">아이디</Label>
        <Input
          id="username"
          type="text"
          placeholder="아이디를 입력하세요"
          value={username}
          onChange={(e) => onUsernameChange(e.target.value)}
          className={BUTTON_HEIGHT}
          required
          disabled={isDisabled}
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
            onChange={(e) => onPasswordChange(e.target.value)}
            className={`${BUTTON_HEIGHT} pr-10`}
            required
            disabled={isDisabled}
          />
          <button
            type="button"
            onClick={onTogglePasswordVisibility}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
            disabled={isDisabled}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          className={CANCEL_BUTTON_STYLE}
          onClick={onCancel}
          disabled={isDisabled}
        >
          취소
        </Button>
        <Button
          type="submit"
          variant="outline"
          className={RED_BUTTON_STYLE}
          disabled={isDisabled || !isFormValid}
        >
          확인
        </Button>
      </div>
    </form>
  );
}

// 최종 확인 컴포넌트
interface FinalConfirmationProps {
  isPending: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

function FinalConfirmation({
  isPending,
  onConfirm,
  onCancel,
}: FinalConfirmationProps) {
  return (
    <div className="space-y-4">
      <Alert variant="destructive">
        <AlertDescription>
          회원 탈퇴를 진행하시면 다음 정보가 모두 삭제됩니다:
          <br />
          {DELETE_WARNING_ITEMS.map((item, index) => (
            <React.Fragment key={index}>
              • {item}
              <br />
            </React.Fragment>
          ))}
          <br />
          이 작업은 되돌릴 수 없습니다.
        </AlertDescription>
      </Alert>

      <div className="flex gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          className={CANCEL_BUTTON_STYLE}
          onClick={onCancel}
          disabled={isPending}
        >
          취소
        </Button>
        <Button
          type="button"
          variant="outline"
          className={RED_BUTTON_STYLE}
          onClick={onConfirm}
          disabled={isPending}
        >
          {isPending ? '탈퇴 중...' : '탈퇴하기'}
        </Button>
      </div>
    </div>
  );
}

import { useState, type FormEvent, type ChangeEvent } from 'react';
import { Eye, EyeOff, Check, X } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardHeader } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';
import { ScrollToTopButton } from '../layout/ScrollToTopButton';
import { useNavigation } from '../../hooks/useNavigation';
import { useRegisterMutation } from '../../hooks/api/useRegister';
import { useUsernameExistsQuery } from '../../hooks/api/useUsernameExists';
import logo from '../../assets/logo.png';

export function SignupPage() {
  const { goToLogin, goToHome } = useNavigation();
  const registerMutation = useRegisterMutation();
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    password: '',
    passwordConfirm: '',
    email: '',
  });
  
  // 아이디 중복 확인
  const usernameExistsQuery = useUsernameExistsQuery(
    formData.username,
    formData.username.length > 0 // username이 있을 때만 확인
  );

  const [touched, setTouched] = useState({
    name: false,
    username: false,
    password: false,
    passwordConfirm: false,
    email: false,
  });

  // Password validation
  const passwordValidation = {
    length: formData.password.length >= 8,
    hasNumber: /\d/.test(formData.password),
    hasLetter: /[a-zA-Z]/.test(formData.password),
  };

  const isPasswordValid = Object.values(passwordValidation).every(Boolean);
  const passwordsMatch = formData.password === formData.passwordConfirm && formData.passwordConfirm !== '';
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email);

  // 아이디 중복 여부 확인
  const isUsernameAvailable = formData.username.length > 0 
    ? usernameExistsQuery.data === false 
    : null; // 아직 확인하지 않음
  
  const isUsernameValid = formData.username.length > 0 && (isUsernameAvailable === null || isUsernameAvailable === true);

  const isFormValid = 
    formData.name.length > 0 &&
    isUsernameValid &&
    isPasswordValid &&
    passwordsMatch &&
    emailValid;

  const handleInputChange = (field: string) => (e: ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [field]: e.target.value });
  };

  const handleBlur = (field: string) => () => {
    setTouched({ ...touched, [field]: true });
  };

  const handleSignup = (e: FormEvent) => {
    e.preventDefault();
    
    // 모든 필드를 touched 상태로 변경하여 유효성 검사 메시지 표시
    if (!isFormValid) {
      setTouched({
        name: true,
        username: true,
        password: true,
        passwordConfirm: true,
        email: true,
      });
      return;
    }
    
    registerMutation.mutate({
      email: formData.email,
      username: formData.username,
      name: formData.name,
      password: formData.password,
    });
  };

  const getInputClassName = (field: string, isValid: boolean) => {
    if (!touched[field as keyof typeof touched]) return 'h-12';
    return isValid 
      ? 'h-12 border-green-500 focus:border-green-500 focus:ring-green-500' 
      : 'h-12 border-red-500 focus:border-red-500 focus:ring-red-500';
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

        {/* Signup Card */}
        <Card className="shadow-lg" style={{ borderRadius: '12px' }}>
          <CardHeader className="text-center pb-4">
            <h2 className="text-[24px]">회원가입</h2>
            <p className="text-gray-600 mt-2">RSRS 계정을 만들어보세요</p>
          </CardHeader>

          <CardContent className="px-6 pb-6">
            {/* 에러 메시지 표시 */}
            {registerMutation.isError && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>
                  {registerMutation.error?.message || '회원가입 중 오류가 발생했습니다.'}
                </AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSignup} className="space-y-4">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name">이름</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="이름을 입력하세요"
                  value={formData.name}
                  onChange={handleInputChange('name')}
                  onBlur={handleBlur('name')}
                  className={getInputClassName('name', formData.name.length > 0)}
                  required
                  disabled={registerMutation.isPending}
                />
              </div>

              {/* Username */}
              <div className="space-y-2">
                <Label htmlFor="username">아이디</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="아이디를 입력하세요"
                  value={formData.username}
                  onChange={handleInputChange('username')}
                  onBlur={handleBlur('username')}
                  className={getInputClassName('username', isUsernameValid)}
                  required
                  disabled={registerMutation.isPending}
                />
                {/* 아이디 중복 확인 메시지 */}
                {formData.username.length > 0 && (
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
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password">비밀번호</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="비밀번호를 입력하세요"
                    value={formData.password}
                    onChange={handleInputChange('password')}
                    onBlur={handleBlur('password')}
                    className={getInputClassName('password', isPasswordValid) + ' pr-10'}
                    required
                    disabled={registerMutation.isPending}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>

                {/* Password Requirements */}
                {formData.password && (
                  <div className="space-y-1 text-sm">
                    <div className={`flex items-center gap-2 ${passwordValidation.length ? 'text-green-600' : 'text-gray-500'}`}>
                      {passwordValidation.length ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                      <span>8자 이상</span>
                    </div>
                    <div className={`flex items-center gap-2 ${passwordValidation.hasNumber ? 'text-green-600' : 'text-gray-500'}`}>
                      {passwordValidation.hasNumber ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                      <span>숫자 포함</span>
                    </div>
                    <div className={`flex items-center gap-2 ${passwordValidation.hasLetter ? 'text-green-600' : 'text-gray-500'}`}>
                      {passwordValidation.hasLetter ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                      <span>영문자 포함</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Password Confirm */}
              <div className="space-y-2">
                <Label htmlFor="passwordConfirm">비밀번호 재입력</Label>
                <div className="relative">
                  <Input
                    id="passwordConfirm"
                    type={showPasswordConfirm ? 'text' : 'password'}
                    placeholder="비밀번호를 다시 입력하세요"
                    value={formData.passwordConfirm}
                    onChange={handleInputChange('passwordConfirm')}
                    onBlur={handleBlur('passwordConfirm')}
                    className={getInputClassName('passwordConfirm', passwordsMatch) + ' pr-10'}
                    required
                    disabled={registerMutation.isPending}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPasswordConfirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {touched.passwordConfirm && formData.passwordConfirm && !passwordsMatch && (
                  <p className="text-sm text-red-600">비밀번호가 일치하지 않습니다</p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">이메일 주소</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="이메일 주소를 입력하세요"
                  value={formData.email}
                  onChange={handleInputChange('email')}
                  onBlur={handleBlur('email')}
                  className={getInputClassName('email', emailValid)}
                  required
                  disabled={registerMutation.isPending}
                />
              </div>

              {/* Signup Button */}
              <Button
                type="submit"
                className="w-full h-12 text-white transition-colors"
                style={{ backgroundColor: '#215285' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1A3E66'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#215285'}
                disabled={registerMutation.isPending || !isFormValid}
              >
                {registerMutation.isPending ? '회원가입 중...' : '회원가입'}
              </Button>
            </form>

            {/* Login Link */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                이미 계정이 있으신가요?{' '}
                <button
                  onClick={goToLogin}
                  className="text-[#4FA3D1] hover:underline"
                >
                  로그인
                </button>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
      <ScrollToTopButton />
    </div>
  );
}

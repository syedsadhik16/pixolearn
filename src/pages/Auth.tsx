import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Layout } from '@/components/layout/Layout';
import { supabase } from '@/integrations/supabase/client';
import pixoLogo from '@/assets/pixo-logo.png';
import { Eye, EyeOff, GraduationCap, Users, Loader2 } from 'lucide-react';
import { z } from 'zod';
import { useTranslation } from '@/hooks/useTranslation';

const authSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  fullName: z.string().min(2, 'Name must be at least 2 characters').optional(),
});

type UserRole = 'student' | 'parent';

export default function Auth() {
  const [searchParams] = useSearchParams();
  const [isSignUp, setIsSignUp] = useState(searchParams.get('signup') === 'true');
  const [isResetPassword, setIsResetPassword] = useState(false);
  const [email, setEmail] = useState(searchParams.get('email') || '');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('student');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [accountExistsNotice, setAccountExistsNotice] = useState(searchParams.get('exists') === 'true');

  const { signIn, signUp, resetPassword, user, profile, roles: userRoles, isMultiRole, activeRole } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation();

  // If redirected with exists=true, show sign-in mode with message
  useEffect(() => {
    if (searchParams.get('exists') === 'true') {
      setIsSignUp(false);
      setAccountExistsNotice(true);
    }
  }, [searchParams]);

  useEffect(() => {
    if (user && profile) {
      // Multi-role users go to role selection
      if (isMultiRole && !activeRole) {
        navigate('/role-select');
        return;
      }
      
      const effectiveRole = activeRole || profile.role;
      if (effectiveRole !== 'student') {
        const redirectPath = effectiveRole === 'admin' ? '/admin' : '/parent';
        navigate(redirectPath);
        return;
      }
      checkStudentFlowState();
    }
  }, [user, profile, roles, activeRole, navigate]);

  const checkStudentFlowState = async () => {
    if (!user) return;

    const { data: learnerProfile } = await supabase
      .from('learner_profiles')
      .select('onboarding_completed')
      .eq('student_id', user.id)
      .maybeSingle();

    if (!learnerProfile || !learnerProfile.onboarding_completed) {
      navigate('/onboarding');
      return;
    }

    const { data: entitlement } = await supabase
      .from('user_entitlements')
      .select('launch_check_completed, selected_level, is_paid, entitlement_status, entitlement_expiry_date')
      .eq('user_id', user.id)
      .maybeSingle();

    if (profile?.subscription_type === 'premium') {
      navigate('/student');
      return;
    }

    if (!entitlement || !entitlement.launch_check_completed) {
      navigate('/launch-check');
      return;
    }
    if (!entitlement.selected_level) {
      navigate('/level-selection');
      return;
    }
    if (!entitlement.is_paid || entitlement.entitlement_status !== 'active') {
      navigate('/pricing');
      return;
    }
    if (entitlement.entitlement_expiry_date && new Date(entitlement.entitlement_expiry_date) <= new Date()) {
      navigate('/pricing');
      return;
    }

    navigate('/student');
  };

  const validateForm = () => {
    try {
      if (isSignUp) {
        authSchema.parse({ email, password, fullName });
      } else if (isResetPassword) {
        z.object({ email: z.string().email() }).parse({ email });
      } else {
        authSchema.omit({ fullName: true }).parse({ email, password });
      }
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setAccountExistsNotice(false);

    try {
      if (isResetPassword) {
        const { error } = await resetPassword(email);
        if (error) throw error;
        toast({
          title: t('checkEmail'),
          description: t('resetLinkSent'),
        });
        setIsResetPassword(false);
      } else if (isSignUp) {
        // Directly attempt sign-up. Supabase will return an error if the email is already registered.
        const { error } = await signUp(email, password, fullName, selectedRole);
        if (error) {
          // Check if user already exists
          if (
            error.message.includes('already registered') ||
            error.message.includes('User already registered') ||
            error.message.includes('already been registered')
          ) {
            // Switch to sign-in mode with email prefilled
            setIsSignUp(false);
            setPassword('');
            setAccountExistsNotice(true);
            toast({
              title: t('accountExists') || 'Account already exists',
              description: t('accountExistsDesc') || 'This email is already registered. Please enter your password to sign in.',
            });
            setLoading(false);
            return;
          }
          // Check for email confirmation required (not a real error for user)
          if (error.message.includes('confirm')) {
            toast({
              title: t('checkEmail') || 'Check your email',
              description: 'Please check your email to confirm your account before signing in.',
            });
            setLoading(false);
            return;
          }
          throw error;
        }
        toast({
          title: t('welcomeToPIXO'),
          description: t('accountCreated'),
        });
      } else {
        const { error } = await signIn(email, password);
        if (error) {
          if (error.message.includes('Invalid login') || error.message.includes('invalid')) {
            throw new Error(t('invalidCredentials') || 'Invalid email or password. Please try again.');
          }
          if (error.message.includes('Email not confirmed')) {
            throw new Error('Please check your email and confirm your account first.');
          }
          throw error;
        }
        toast({
          title: t('welcomeBackGreeting'),
          description: t('signedInSuccess'),
        });
      }
    } catch (error) {
      toast({
        title: t('error'),
        description: error instanceof Error ? error.message : t('somethingWrong'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const roles = [
    {
      id: 'student' as UserRole,
      title: t('student'),
      description: t('iWantToLearn'),
      icon: GraduationCap,
    },
    {
      id: 'parent' as UserRole,
      title: t('parent'),
      description: t('iWantToMonitor'),
      icon: Users,
    },
  ];

  return (
    <Layout showNavbar={false}>
      <div className="min-h-screen flex">
        {/* Left side - Branding */}
        <div className="hidden lg:flex lg:w-1/2 gradient-bg items-center justify-center p-12">
          <div className="text-center space-y-8 animate-fade-in">
            <img src={pixoLogo} alt="PIXO" className="h-32 mx-auto animate-float" />
            <div className="space-y-4">
              <h1 className="text-4xl font-display font-bold text-white">
                {t('energyLearnGrow')}
              </h1>
              <p className="text-xl text-white/90 max-w-md">
                {t('heroDescription')}
              </p>
            </div>
            <div className="flex justify-center gap-6 text-white/80">
              <div className="text-center">
                <p className="text-3xl font-bold">1M+</p>
                <p className="text-sm">Students</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold">500+</p>
                <p className="text-sm">{t('lessons')}</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold">95%</p>
                <p className="text-sm">Success</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Auth Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
          <div className="w-full max-w-md space-y-8 animate-slide-up">
            <div className="lg:hidden text-center mb-8">
              <img src={pixoLogo} alt="PIXO" className="h-16 mx-auto" />
            </div>

            <div className="text-center space-y-2">
              <h2 className="text-3xl font-display font-bold">
                {isResetPassword
                  ? t('resetPassword')
                  : isSignUp
                  ? t('createAccount')
                  : t('welcomeBack')}
              </h2>
              <p className="text-muted-foreground">
                {isResetPassword
                  ? t('enterResetEmail')
                  : isSignUp
                  ? t('startJourneyToday')
                  : t('continueJourney')}
              </p>
            </div>

            {/* Account exists notice */}
            {accountExistsNotice && !isSignUp && (
              <div className="bg-primary/10 border border-primary/20 rounded-2xl p-4 text-center animate-fade-in">
                <p className="text-sm font-semibold text-primary">
                  {t('accountExists') || 'Account already exists'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {t('accountExistsDesc') || 'This email is already registered. Please enter your password to sign in.'}
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {isSignUp && !isResetPassword && (
                <>
                  {/* Role Selection */}
                  <div className="space-y-3">
                    <Label>{t('iAmA')}</Label>
                    <div className="grid grid-cols-2 gap-4">
                      {roles.map((role) => (
                        <button
                          key={role.id}
                          type="button"
                          onClick={() => setSelectedRole(role.id)}
                          className={`p-4 rounded-xl border-2 transition-all duration-300 text-left ${
                            selectedRole === role.id
                              ? 'border-primary bg-primary/5 shadow-pixo-md'
                              : 'border-border hover:border-primary/50'
                          }`}
                        >
                          <role.icon
                            className={`h-8 w-8 mb-2 ${
                              selectedRole === role.id
                                ? 'text-primary'
                                : 'text-muted-foreground'
                            }`}
                          />
                          <p className="font-semibold">{role.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {role.description}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Full Name */}
                  <div className="space-y-2">
                    <Label htmlFor="fullName">{t('fullName')}</Label>
                    <Input
                      id="fullName"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder={t('enterFullName')}
                      className={errors.fullName ? 'border-destructive' : ''}
                    />
                    {errors.fullName && (
                      <p className="text-sm text-destructive">{errors.fullName}</p>
                    )}
                  </div>
                </>
              )}

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">{t('email')}</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className={errors.email ? 'border-destructive' : ''}
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email}</p>
                )}
              </div>

              {/* Password */}
              {!isResetPassword && (
                <div className="space-y-2">
                  <Label htmlFor="password">{t('password')}</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={t('enterPassword')}
                      className={errors.password ? 'border-destructive pr-10' : 'pr-10'}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-sm text-destructive">{errors.password}</p>
                  )}
                </div>
              )}

              {/* Forgot Password Link */}
              {!isSignUp && !isResetPassword && (
                <button
                  type="button"
                  onClick={() => setIsResetPassword(true)}
                  className="text-sm text-primary hover:underline"
                >
                  {t('forgotPassword')}
                </button>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                variant="gradient"
                size="lg"
                className="w-full"
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : isResetPassword ? (
                  t('sendResetLink')
                ) : isSignUp ? (
                  t('createAccount')
                ) : (
                  t('signIn')
                )}
              </Button>
            </form>

            {/* Toggle Auth Mode */}
            <div className="text-center">
              {isResetPassword ? (
                <button
                  onClick={() => setIsResetPassword(false)}
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  {t('backToSignIn')}
                </button>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {isSignUp ? t('alreadyHaveAccount') : t('dontHaveAccount')}{' '}
                  <button
                    onClick={() => {
                      setIsSignUp(!isSignUp);
                      setAccountExistsNotice(false);
                    }}
                    className="text-primary font-semibold hover:underline"
                  >
                    {isSignUp ? t('signIn') : t('signUp')}
                  </button>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

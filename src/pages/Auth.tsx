import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Layout } from '@/components/layout/Layout';
import pixoLogo from '@/assets/pixo-logo.png';
import { Eye, EyeOff, GraduationCap, Users, Loader2 } from 'lucide-react';
import { z } from 'zod';

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
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('student');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { signIn, signUp, resetPassword, user, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (user && profile) {
      const redirectPath = profile.role === 'admin' 
        ? '/admin' 
        : profile.role === 'parent' 
        ? '/parent' 
        : '/student';
      navigate(redirectPath);
    }
  }, [user, profile, navigate]);

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

    try {
      if (isResetPassword) {
        const { error } = await resetPassword(email);
        if (error) throw error;
        toast({
          title: 'Check your email',
          description: 'We sent you a password reset link.',
        });
        setIsResetPassword(false);
      } else if (isSignUp) {
        const { error } = await signUp(email, password, fullName, selectedRole);
        if (error) {
          if (error.message.includes('already registered')) {
            throw new Error('This email is already registered. Please sign in instead.');
          }
          throw error;
        }
        toast({
          title: 'Welcome to PIXO! 🎉',
          description: 'Your account has been created successfully.',
        });
      } else {
        const { error } = await signIn(email, password);
        if (error) {
          if (error.message.includes('Invalid login')) {
            throw new Error('Invalid email or password. Please try again.');
          }
          throw error;
        }
        toast({
          title: 'Welcome back! 👋',
          description: 'You have signed in successfully.',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Something went wrong',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const roles = [
    {
      id: 'student' as UserRole,
      title: 'Student',
      description: 'I want to learn English',
      icon: GraduationCap,
    },
    {
      id: 'parent' as UserRole,
      title: 'Parent',
      description: 'I want to monitor my child',
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
                Energy. Learn. Grow.
              </h1>
              <p className="text-xl text-white/90 max-w-md">
                Master spoken English with AI-powered lessons designed to build your confidence.
              </p>
            </div>
            <div className="flex justify-center gap-6 text-white/80">
              <div className="text-center">
                <p className="text-3xl font-bold">1M+</p>
                <p className="text-sm">Students</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold">500+</p>
                <p className="text-sm">Lessons</p>
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
                  ? 'Reset Password'
                  : isSignUp
                  ? 'Create Account'
                  : 'Welcome Back'}
              </h2>
              <p className="text-muted-foreground">
                {isResetPassword
                  ? 'Enter your email to receive a reset link'
                  : isSignUp
                  ? 'Start your English learning journey today'
                  : 'Continue your learning journey'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {isSignUp && !isResetPassword && (
                <>
                  {/* Role Selection */}
                  <div className="space-y-3">
                    <Label>I am a...</Label>
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
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input
                      id="fullName"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Enter your full name"
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
                <Label htmlFor="email">Email</Label>
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
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
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
                  Forgot your password?
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
                  'Send Reset Link'
                ) : isSignUp ? (
                  'Create Account'
                ) : (
                  'Sign In'
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
                  Back to sign in
                </button>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
                  <button
                    onClick={() => setIsSignUp(!isSignUp)}
                    className="text-primary font-semibold hover:underline"
                  >
                    {isSignUp ? 'Sign In' : 'Sign Up'}
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

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useCompanion } from '@/hooks/useCompanion';
import { useTranslation } from '@/hooks/useTranslation';
import { CheckCircle2, ArrowRight, Sparkles, Crown, Calendar } from 'lucide-react';

export default function PaymentSuccess() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const companion = useCompanion();
  const { t } = useTranslation();
  const [showConfetti, setShowConfetti] = useState(true);

  const selectedPlan = sessionStorage.getItem('selectedPlan') || 'Premium';
  const selectedLevel = sessionStorage.getItem('selectedLevel') || 'Level 1';
  const expiryDate = sessionStorage.getItem('expiryDate');

  useEffect(() => {
    // Auto-redirect after 10 seconds
    const timer = setTimeout(() => navigate('/student'), 10000);
    return () => clearTimeout(timer);
  }, [navigate]);

  useEffect(() => {
    const confettiTimer = setTimeout(() => setShowConfetti(false), 5000);
    return () => clearTimeout(confettiTimer);
  }, []);

  const formattedExpiry = expiryDate
    ? new Date(expiryDate).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })
    : '';

  return (
    <Layout showNavbar={false}>
      <div className="min-h-screen gradient-bg flex items-center justify-center p-4 relative overflow-hidden">
        {/* Confetti animation */}
        {showConfetti && (
          <div className="absolute inset-0 pointer-events-none">
            {Array.from({ length: 40 }).map((_, i) => (
              <div
                key={i}
                className="absolute animate-bounce"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 2}s`,
                  animationDuration: `${1 + Math.random() * 2}s`,
                  fontSize: `${12 + Math.random() * 16}px`,
                }}
              >
                {['🎉', '⭐', '🎊', '✨', '🏆', '🌟'][Math.floor(Math.random() * 6)]}
              </div>
            ))}
          </div>
        )}

        <div className="w-full max-w-md space-y-8 animate-fade-in relative z-10">
          {/* Mascot celebration */}
          <div className="text-center">
            <img
              src={companion.image}
              alt={companion.name}
              className="w-28 h-28 mx-auto object-contain animate-float mb-4"
            />
          </div>

          {/* Success card */}
          <div className="bg-white/15 backdrop-blur-md rounded-3xl p-8 border border-white/20 text-center space-y-6">
            <div className="w-20 h-20 bg-pixo-green/20 rounded-full flex items-center justify-center mx-auto animate-scale-in">
              <CheckCircle2 className="h-12 w-12 text-pixo-green" />
            </div>

            <div className="space-y-2">
              <h1 className="text-3xl font-display font-bold text-white">
                {t('paymentSuccessful')}
              </h1>
              <p className="text-white/80 text-lg">
                {t('welcomeToPIXOExcited')}
              </p>
            </div>

            {/* Plan details */}
            <div className="bg-white/10 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/70 flex items-center gap-2">
                  <Crown className="h-4 w-4" /> {t('plan')}
                </span>
                <span className="text-white font-bold">{selectedPlan}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/70 flex items-center gap-2">
                  <Sparkles className="h-4 w-4" /> {t('level')}
                </span>
                <span className="text-white font-bold">{selectedLevel}</span>
              </div>
              {formattedExpiry && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/70 flex items-center gap-2">
                    <Calendar className="h-4 w-4" /> {t('validUntil')}
                  </span>
                  <span className="text-white font-bold">{formattedExpiry}</span>
                </div>
              )}
            </div>

            <Button
              size="lg"
              className="w-full bg-white text-primary hover:bg-white/90 font-bold text-lg py-6 rounded-2xl"
              onClick={() => navigate('/student')}
            >
              {t('startLearning')}
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>

            <p className="text-xs text-white/50">
              {t('autoRedirect')}
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Layout } from '@/components/layout/Layout';
import pixoLogo from '@/assets/pixo-logo.png';
import { Check, Loader2, ArrowRight, ArrowLeft, Sparkles } from 'lucide-react';
import pixelChar from '@/assets/characters/pixel.png';
import zestChar from '@/assets/characters/zest.png';
import bloomChar from '@/assets/characters/bloom.png';
import sparkChar from '@/assets/characters/spark.png';
import novaChar from '@/assets/characters/nova.png';
import terraChar from '@/assets/characters/terra.png';

const avatars = [
  { id: 'pixel', name: 'Pixel', image: pixelChar, trait: 'Curious & Clever', color: 'from-pixo-blue to-pixo-purple' },
  { id: 'zest', name: 'Zest', image: zestChar, trait: 'Energetic & Bold', color: 'from-pixo-orange to-pixo-yellow' },
  { id: 'bloom', name: 'Bloom', image: bloomChar, trait: 'Creative & Kind', color: 'from-pink-400 to-pixo-purple' },
  { id: 'spark', name: 'Spark', image: sparkChar, trait: 'Bright & Quick', color: 'from-pixo-yellow to-pixo-orange' },
  { id: 'nova', name: 'Nova', image: novaChar, trait: 'Brave & Dreamy', color: 'from-pixo-purple to-pixo-blue' },
  { id: 'terra', name: 'Terra', image: terraChar, trait: 'Calm & Wise', color: 'from-pixo-green to-teal-500' },
];

const ageGroups = [
  { id: '4-6', label: '4–6 years', desc: 'Preschool / Kindergarten' },
  { id: '6-8', label: '6–8 years', desc: 'Primary School (Grades 1–3)' },
  { id: '8-10', label: '8–10 years', desc: 'Upper Primary (Grades 4–6)' },
  { id: '10-12', label: '10–12 years', desc: 'Middle School (Grades 7–8)' },
  { id: '12+', label: '12+ years', desc: 'High School & Above' },
];

const stages = [
  { id: 'preschool', label: 'Preschool / Kindergarten' },
  { id: 'primary_lower', label: 'Primary School (Grades 1–3)' },
  { id: 'primary_upper', label: 'Upper Primary (Grades 4–6)' },
  { id: 'middle', label: 'Middle School (Grades 7–8)' },
  { id: 'other', label: 'Other / Not Sure' },
];

const goals = [
  { id: 'speaking', label: 'Speaking Confidence', emoji: '🗣️' },
  { id: 'reading', label: 'Reading & Phonics', emoji: '📖' },
  { id: 'vocabulary', label: 'Vocabulary Building', emoji: '📚' },
  { id: 'grammar', label: 'Grammar & Sentences', emoji: '✍️' },
  { id: 'school', label: 'School Performance', emoji: '🎓' },
  { id: 'communication', label: 'Overall Communication', emoji: '💬' },
];

export default function Onboarding() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [step, setStep] = useState(1);
  const [selectedAvatar, setSelectedAvatar] = useState('pixel');
  const [selectedAge, setSelectedAge] = useState('');
  const [selectedStage, setSelectedStage] = useState('');
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const totalSteps = 3;

  const toggleGoal = (goalId: string) => {
    setSelectedGoals(prev =>
      prev.includes(goalId) ? prev.filter(g => g !== goalId) : [...prev, goalId]
    );
  };

  const canProceed = () => {
    if (step === 1) return !!selectedAvatar;
    if (step === 2) return !!selectedAge && !!selectedStage;
    if (step === 3) return selectedGoals.length > 0;
    return false;
  };

  const handleFinish = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Upsert learner profile
      const { error } = await supabase
        .from('learner_profiles')
        .upsert({
          student_id: user.id,
          avatar_character: selectedAvatar,
          age_group: selectedAge,
          school_stage: selectedStage,
          learning_goals: selectedGoals,
          onboarding_completed: true,
        }, { onConflict: 'student_id' });

      if (error) throw error;

      toast({ title: 'Profile created! 🎉', description: 'Now let\'s check your English level.' });
      navigate('/launch-check');
    } catch (error) {
      console.error('Onboarding error:', error);
      toast({ title: 'Error', description: 'Failed to save profile', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout showNavbar={false}>
      <div className="min-h-screen gradient-bg flex items-center justify-center p-4 md:p-8">
        <div className="w-full max-w-2xl space-y-8 animate-fade-in">
          {/* Header */}
          <div className="text-center space-y-3">
            <img src={pixoLogo} alt="PIXO" className="h-14 mx-auto animate-float" />
            <h1 className="text-3xl md:text-4xl font-display font-bold text-white">
              Welcome Home, {profile?.full_name?.split(' ')[0] || 'Explorer'}! 🏠
            </h1>
            <p className="text-white/80 text-lg">Let's set up your learning world</p>
          </div>

          {/* Progress bar */}
          <div className="flex items-center gap-2 max-w-xs mx-auto">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div
                key={i}
                className={`h-2 flex-1 rounded-full transition-all duration-500 ${
                  i < step ? 'bg-white' : 'bg-white/30'
                }`}
              />
            ))}
          </div>

          {/* Step Content */}
          <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-6 md:p-8 border border-white/20">
            {/* Step 1: Avatar */}
            {step === 1 && (
              <div className="space-y-6 animate-fade-in">
                <div className="text-center">
                  <h2 className="text-2xl font-display font-bold text-white mb-2">
                    Choose Your Companion
                  </h2>
                  <p className="text-white/70">Pick a learning buddy who matches your vibe!</p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {avatars.map(avatar => (
                    <button
                      key={avatar.id}
                      onClick={() => setSelectedAvatar(avatar.id)}
                      className={`relative p-5 rounded-2xl border-2 transition-all duration-300 text-center group ${
                        selectedAvatar === avatar.id
                          ? 'border-white bg-white/20 scale-105 shadow-lg'
                          : 'border-white/20 hover:border-white/50 hover:bg-white/10'
                      }`}
                    >
                      {selectedAvatar === avatar.id && (
                        <div className="absolute top-2 right-2 w-6 h-6 bg-white rounded-full flex items-center justify-center">
                          <Check className="h-4 w-4 text-primary" />
                        </div>
                      )}
                      <img src={avatar.image} alt={avatar.name} className="w-16 h-16 mx-auto mb-2 object-contain" />
                      <p className="font-display font-bold text-white text-lg">{avatar.name}</p>
                      <p className="text-xs text-white/60 mt-1">{avatar.trait}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 2: Age & Stage */}
            {step === 2 && (
              <div className="space-y-6 animate-fade-in">
                <div className="text-center">
                  <h2 className="text-2xl font-display font-bold text-white mb-2">
                    Learning Launch Check 🚀
                  </h2>
                  <p className="text-white/70">Tell us about yourself so we can personalize your path</p>
                </div>

                <div className="space-y-4">
                  <label className="text-sm font-semibold text-white/90">Age Group</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {ageGroups.map(ag => (
                      <button
                        key={ag.id}
                        onClick={() => setSelectedAge(ag.id)}
                        className={`p-4 rounded-xl border-2 text-left transition-all ${
                          selectedAge === ag.id
                            ? 'border-white bg-white/20'
                            : 'border-white/20 hover:border-white/40'
                        }`}
                      >
                        <p className="font-semibold text-white">{ag.label}</p>
                        <p className="text-xs text-white/60">{ag.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-sm font-semibold text-white/90">Current Learning Stage</label>
                  <div className="space-y-2">
                    {stages.map(st => (
                      <button
                        key={st.id}
                        onClick={() => setSelectedStage(st.id)}
                        className={`w-full p-3 rounded-xl border-2 text-left transition-all ${
                          selectedStage === st.id
                            ? 'border-white bg-white/20'
                            : 'border-white/20 hover:border-white/40'
                        }`}
                      >
                        <p className="text-sm font-medium text-white">{st.label}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Goals */}
            {step === 3 && (
              <div className="space-y-6 animate-fade-in">
                <div className="text-center">
                  <h2 className="text-2xl font-display font-bold text-white mb-2">
                    What Would You Like to Improve? 🎯
                  </h2>
                  <p className="text-white/70">Select one or more goals (you can change later)</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {goals.map(goal => (
                    <button
                      key={goal.id}
                      onClick={() => toggleGoal(goal.id)}
                      className={`p-4 rounded-xl border-2 text-left transition-all flex items-center gap-3 ${
                        selectedGoals.includes(goal.id)
                          ? 'border-white bg-white/20'
                          : 'border-white/20 hover:border-white/40'
                      }`}
                    >
                      <span className="text-2xl">{goal.emoji}</span>
                      <span className="font-semibold text-white text-sm">{goal.label}</span>
                      {selectedGoals.includes(goal.id) && (
                        <Check className="h-4 w-4 text-white ml-auto" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              className="text-white hover:bg-white/10"
              onClick={() => step > 1 ? setStep(step - 1) : navigate('/auth')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>

            {step < totalSteps ? (
              <Button
                className="bg-white text-primary hover:bg-white/90 font-semibold"
                disabled={!canProceed()}
                onClick={() => setStep(step + 1)}
              >
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button
                className="bg-white text-primary hover:bg-white/90 font-semibold"
                disabled={!canProceed() || loading}
                onClick={handleFinish}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Build My Learning Path
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}

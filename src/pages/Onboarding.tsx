import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Layout } from '@/components/layout/Layout';
import pixoLogo from '@/assets/pixo-logo.png';
import { Check, Loader2, ArrowRight, ArrowLeft, Sparkles } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
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
  { id: '3-4', label: '3–4 years', emoji: '👶' },
  { id: '4-5', label: '4–5 years', emoji: '🧒' },
  { id: '5-6', label: '5–6 years', emoji: '🧒' },
  { id: '6-8', label: '6–8 years', emoji: '📚' },
  { id: '8-10', label: '8–10 years', emoji: '✏️' },
  { id: '10+', label: '10+ years', emoji: '🎓' },
];

const learningStages = [
  { id: 'preschool', label: 'Preschool / Kindergarten', emoji: '🌱' },
  { id: 'primary_lower', label: 'Primary School (Grades 1–3)', emoji: '📖' },
  { id: 'primary_upper', label: 'Upper Primary (Grades 4–6)', emoji: '✏️' },
  { id: 'middle', label: 'Middle School (Grades 7–8)', emoji: '🎓' },
  { id: 'other', label: 'Other / Not sure', emoji: '❓' },
];

const schoolBoards = [
  { id: 'state', label: 'State Board' },
  { id: 'cbse', label: 'CBSE' },
  { id: 'icse', label: 'ICSE' },
  { id: 'ib_igcse', label: 'IB / IGCSE' },
  { id: 'cambridge', label: 'Cambridge' },
  { id: 'homeschooling', label: 'Homeschooling' },
  { id: 'na', label: 'Not applicable' },
];

const englishLevels = [
  { id: 'beginner', label: 'Beginner', desc: 'Just starting to learn English', emoji: '🌱' },
  { id: 'early_reader', label: 'Early Reader', desc: 'Can read simple words and sentences', emoji: '📖' },
  { id: 'confident', label: 'Confident Speaker', desc: 'Speaks basic English with confidence', emoji: '🗣️' },
  { id: 'fluent', label: 'Fluent', desc: 'Speaks English well, wants to improve', emoji: '⭐' },
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
  const { t } = useTranslation();

  const [step, setStep] = useState(1);
  const [selectedAvatar, setSelectedAvatar] = useState('pixel');
  const [childName, setChildName] = useState('');
  const [selectedAge, setSelectedAge] = useState('');
  const [selectedStage, setSelectedStage] = useState('');
  const [selectedBoard, setSelectedBoard] = useState('');
  const [selectedEnglishLevel, setSelectedEnglishLevel] = useState('');
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const totalSteps = 5;

  const toggleGoal = (goalId: string) => {
    setSelectedGoals(prev => {
      if (prev.includes(goalId)) return prev.filter(g => g !== goalId);
      if (prev.length >= 2) return prev;
      return [...prev, goalId];
    });
  };

  const canProceed = () => {
    if (step === 1) return !!selectedAvatar;
    if (step === 2) return !!selectedAge && !!selectedStage && !!childName.trim();
    if (step === 3) return !!selectedEnglishLevel;
    if (step === 4) return selectedGoals.length > 0;
    if (step === 5) return true; // Board is optional
    return false;
  };

  const handleFinish = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from('learner_profiles')
        .upsert({
          student_id: user.id,
          avatar_character: selectedAvatar,
          child_name: childName.trim(),
          age_group: selectedAge,
          school_stage: selectedStage,
          english_level: selectedEnglishLevel,
          learning_goals: selectedGoals,
          onboarding_completed: true,
        } as any, { onConflict: 'student_id' });

      if (error) throw error;

      // Also save school board to profile if selected
      if (selectedBoard) {
        await supabase.from('learner_profiles')
          .update({ school_stage: `${selectedStage}|${selectedBoard}` } as any)
          .eq('student_id', user.id);
      }

      toast({ title: t('profileCreated'), description: 'Choose to take an assessment or go directly to plans.' });
      navigate('/pricing');
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
              {t('welcomeHome')}{profile?.full_name ? `, ${profile.full_name.split(' ')[0]}` : ''}! 🏠
            </h1>
            <p className="text-white/80 text-lg">{t('setupLearningWorld')}</p>
          </div>

          {/* Progress bar */}
          <div className="flex items-center gap-2 max-w-xs mx-auto">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div
                key={i}
                className={`h-2.5 flex-1 rounded-full transition-all duration-500 ${
                  i < step ? 'bg-white' : 'bg-white/30'
                }`}
              />
            ))}
          </div>

          {/* Step Content */}
          <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-6 md:p-8 border border-white/20">
            {/* Step 1: Avatar Selection */}
            {step === 1 && (
              <div className="space-y-6 animate-fade-in">
                <div className="text-center">
                  <h2 className="text-2xl font-display font-bold text-white mb-2">
                    {t('chooseLearningBuddy')}
                  </h2>
                  <p className="text-white/70">{t('pickCompanion')}</p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {avatars.map(avatar => (
                    <button
                      key={avatar.id}
                      onClick={() => setSelectedAvatar(avatar.id)}
                      className={`relative p-5 rounded-2xl border-2 transition-all duration-300 text-center group ${
                        selectedAvatar === avatar.id
                          ? 'border-white bg-white/25 scale-105 shadow-xl shadow-white/10'
                          : 'border-white/20 hover:border-white/50 hover:bg-white/10 hover:scale-[1.02]'
                      }`}
                    >
                      {selectedAvatar === avatar.id && (
                        <div className="absolute top-2 right-2 w-7 h-7 bg-pixo-green rounded-full flex items-center justify-center animate-scale-in">
                          <Check className="h-4 w-4 text-white" />
                        </div>
                      )}
                      <img 
                        src={avatar.image} 
                        alt={avatar.name} 
                        className={`w-20 h-20 mx-auto mb-3 object-contain transition-transform duration-300 ${
                          selectedAvatar === avatar.id ? 'animate-float' : 'group-hover:animate-bounce-gentle'
                        }`}
                      />
                      <p className="font-display font-bold text-white text-lg">{avatar.name}</p>
                      <p className="text-xs text-white/60 mt-1">{avatar.trait}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 2: Child Name + Age + Learning Stage */}
            {step === 2 && (
              <div className="space-y-6 animate-fade-in">
                <div className="text-center">
                  <h2 className="text-2xl font-display font-bold text-white mb-2">
                    {t('learningLaunchCheck')}
                  </h2>
                  <p className="text-white/70">{t('personalizeJourney')}</p>
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-semibold text-white/90">Child's Name *</label>
                  <input
                    type="text"
                    value={childName}
                    onChange={(e) => setChildName(e.target.value)}
                    placeholder="Enter child's name"
                    className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-white/40 focus:border-white/50 focus:outline-none"
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-semibold text-white/90">{t('childAgeGroup')} *</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {ageGroups.map(ag => (
                      <button
                        key={ag.id}
                        onClick={() => setSelectedAge(ag.id)}
                        className={`p-3 rounded-xl border-2 text-center transition-all ${
                          selectedAge === ag.id
                            ? 'border-white bg-white/20 shadow-lg'
                            : 'border-white/20 hover:border-white/40 hover:bg-white/5'
                        }`}
                      >
                        <span className="text-xl">{ag.emoji}</span>
                        <p className="font-semibold text-white text-sm mt-1">{ag.label}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-semibold text-white/90">{t('currentLearningStage')} *</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {learningStages.map(st => (
                      <button
                        key={st.id}
                        onClick={() => setSelectedStage(st.id)}
                        className={`p-3 rounded-xl border-2 text-left transition-all flex items-center gap-3 ${
                          selectedStage === st.id
                            ? 'border-white bg-white/20 shadow-lg'
                            : 'border-white/20 hover:border-white/40 hover:bg-white/5'
                        }`}
                      >
                        <span className="text-xl">{st.emoji}</span>
                        <p className="font-semibold text-white text-sm">{st.label}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: English Level (Card Selection) */}
            {step === 3 && (
              <div className="space-y-6 animate-fade-in">
                <div className="text-center">
                  <h2 className="text-2xl font-display font-bold text-white mb-2">
                    Current English Use Level *
                  </h2>
                  <p className="text-white/70">Select the level that best describes your child</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {englishLevels.map(level => (
                    <button
                      key={level.id}
                      onClick={() => setSelectedEnglishLevel(level.id)}
                      className={`p-5 rounded-2xl border-2 text-left transition-all ${
                        selectedEnglishLevel === level.id
                          ? 'border-white bg-white/25 shadow-lg scale-[1.02]'
                          : 'border-white/20 hover:border-white/40 hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl">{level.emoji}</span>
                        <p className="font-display font-bold text-white text-lg">{level.label}</p>
                        {selectedEnglishLevel === level.id && (
                          <div className="ml-auto w-6 h-6 bg-pixo-green rounded-full flex items-center justify-center">
                            <Check className="h-3.5 w-3.5 text-white" />
                          </div>
                        )}
                      </div>
                      <p className="text-sm text-white/60">{level.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 4: Goals (max 2) */}
            {step === 4 && (
              <div className="space-y-6 animate-fade-in">
                <div className="text-center">
                  <h2 className="text-2xl font-display font-bold text-white mb-2">
                    {t('whatShouldWeImprove')}
                  </h2>
                  <p className="text-white/70">Select up to 2 improvement goals</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {goals.map(goal => (
                    <button
                      key={goal.id}
                      onClick={() => toggleGoal(goal.id)}
                      className={`p-4 rounded-xl border-2 text-left transition-all flex items-center gap-3 ${
                        selectedGoals.includes(goal.id)
                          ? 'border-white bg-white/20 shadow-lg'
                          : selectedGoals.length >= 2 && !selectedGoals.includes(goal.id)
                          ? 'border-white/10 opacity-50 cursor-not-allowed'
                          : 'border-white/20 hover:border-white/40 hover:bg-white/5'
                      }`}
                    >
                      <span className="text-2xl">{goal.emoji}</span>
                      <span className="font-semibold text-white text-sm flex-1">{goal.label}</span>
                      {selectedGoals.includes(goal.id) && (
                        <div className="w-6 h-6 bg-pixo-green rounded-full flex items-center justify-center">
                          <Check className="h-3.5 w-3.5 text-white" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
                <p className="text-center text-xs text-white/50">
                  {selectedGoals.length}/2 selected
                </p>
              </div>
            )}

            {/* Step 5: School Board (Optional) */}
            {step === 5 && (
              <div className="space-y-6 animate-fade-in">
                <div className="text-center">
                  <h2 className="text-2xl font-display font-bold text-white mb-2">
                    {t('schoolBoardOptional')}
                  </h2>
                  <p className="text-white/70">{t('alignCurriculum')}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {schoolBoards.map(board => (
                    <button
                      key={board.id}
                      onClick={() => setSelectedBoard(selectedBoard === board.id ? '' : board.id)}
                      className={`p-4 rounded-xl border-2 text-center transition-all ${
                        selectedBoard === board.id
                          ? 'border-white bg-white/20 shadow-lg'
                          : 'border-white/20 hover:border-white/40 hover:bg-white/5'
                      }`}
                    >
                      <p className="font-semibold text-white">{board.label}</p>
                    </button>
                  ))}
                </div>
                <p className="text-center text-xs text-white/50">
                  {t('skipOptional')}
                </p>
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
              {t('back')}
            </Button>

            {step < totalSteps ? (
              <Button
                className="bg-white text-primary hover:bg-white/90 font-semibold px-8 py-6 text-lg rounded-2xl"
                disabled={!canProceed()}
                onClick={() => setStep(step + 1)}
              >
                {t('next')}
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            ) : (
              <Button
                className="bg-white text-primary hover:bg-white/90 font-semibold px-8 py-6 text-lg rounded-2xl"
                disabled={loading}
                onClick={handleFinish}
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <Sparkles className="h-5 w-5 mr-2" />
                    {t('buildLearningPath')}
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

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Layout } from '@/components/layout/Layout';
import pixoLogo from '@/assets/pixo-logo.png';
import { BookOpen, MessageSquare, Check, Loader2 } from 'lucide-react';

const levels = [
  {
    id: 'beginner',
    title: 'Level 1: Phonics Foundation',
    subtitle: 'Perfect for beginners',
    description: 'Master the building blocks of English with phonics, consonants, vowels, and CVC words.',
    duration: '6 months • 144 lessons',
    features: [
      'Introduction to phonics & sounds',
      'Consonant & vowel practice',
      'CVC word formation',
      'Blending & digraphs',
      'Word families & patterns',
    ],
    icon: BookOpen,
    color: 'from-primary to-accent',
    ageGroup: 'Ages 4-13',
  },
  {
    id: 'intermediate',
    title: 'Level 2: English Communication',
    subtitle: 'For confident speakers',
    description: 'Develop advanced grammar, vocabulary, and public speaking skills.',
    duration: '6 months • 144 lessons',
    features: [
      'Grammar & tenses mastery',
      'Vocabulary building',
      'Public speaking skills',
      'Reading & writing',
      'Interview preparation',
    ],
    icon: MessageSquare,
    color: 'from-accent to-secondary',
    ageGroup: 'Ages 10-18',
  },
];

export default function LevelSelection() {
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleContinue = async () => {
    if (!selectedLevel || !user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('student_progress')
        .update({ 
          current_level: selectedLevel as 'beginner' | 'intermediate',
          current_day: 1 
        })
        .eq('student_id', user.id);

      if (error) throw error;

      toast({
        title: 'Level selected! 🎉',
        description: `You're starting ${selectedLevel === 'beginner' ? 'Level 1: Phonics Foundation' : 'Level 2: English Communication'}`,
      });

      navigate('/student');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save your level selection. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout showNavbar={false}>
      <div className="min-h-screen gradient-bg flex items-center justify-center p-4 md:p-8">
        <div className="w-full max-w-4xl space-y-8 animate-fade-in">
          {/* Header */}
          <div className="text-center space-y-4">
            <img src={pixoLogo} alt="PIXO" className="h-16 mx-auto animate-float" />
            <h1 className="text-3xl md:text-4xl font-display font-bold text-white">
              Choose Your Learning Level
            </h1>
            <p className="text-white/80 text-lg max-w-xl mx-auto">
              Select the level that best matches your current English skills. You can always change this later.
            </p>
          </div>

          {/* Level Cards */}
          <div className="grid md:grid-cols-2 gap-6">
            {levels.map((level) => (
              <button
                key={level.id}
                onClick={() => setSelectedLevel(level.id)}
                className={`relative p-6 rounded-2xl bg-white/10 backdrop-blur-sm border-2 transition-all duration-300 text-left group hover:bg-white/20 ${
                  selectedLevel === level.id
                    ? 'border-white shadow-pixo-lg scale-[1.02]'
                    : 'border-white/20 hover:border-white/50'
                }`}
              >
                {/* Selected indicator */}
                {selectedLevel === level.id && (
                  <div className="absolute top-4 right-4 w-8 h-8 bg-white rounded-full flex items-center justify-center animate-scale-in">
                    <Check className="h-5 w-5 text-primary" />
                  </div>
                )}

                {/* Icon & Title */}
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${level.color} flex items-center justify-center mb-4`}>
                  <level.icon className="h-7 w-7 text-white" />
                </div>

                <div className="space-y-2 mb-4">
                  <span className="text-sm text-white/60">{level.ageGroup}</span>
                  <h3 className="text-xl font-display font-bold text-white">
                    {level.title}
                  </h3>
                  <p className="text-white/80 text-sm">
                    {level.description}
                  </p>
                  <p className="text-sm text-accent font-medium">
                    {level.duration}
                  </p>
                </div>

                {/* Features */}
                <ul className="space-y-2">
                  {level.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm text-white/70">
                      <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </button>
            ))}
          </div>

          {/* Continue Button */}
          <div className="flex justify-center">
            <Button
              onClick={handleContinue}
              disabled={!selectedLevel || loading}
              size="lg"
              className="min-w-[200px] bg-white text-primary hover:bg-white/90 font-semibold"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Start Learning'
              )}
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
}

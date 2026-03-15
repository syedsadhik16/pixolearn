import { ChildData } from '@/pages/ParentDashboard';
import { Progress } from '@/components/ui/progress';
import { BookOpen, Target, TrendingUp, Sparkles, Volume2, CheckCircle2, Clock, ArrowRight } from 'lucide-react';

interface PhonicsProgressDiagnosticsProps {
  child: ChildData | null;
}

const phonicsPhases = [
  { name: 'Sound Awareness', range: [1, 30], emoji: '👂', skills: ['Letter sounds', 'Rhyming', 'Beginning sounds'] },
  { name: 'Letter-Sound Connection', range: [31, 60], emoji: '🔤', skills: ['Vowels', 'Consonants', 'Sound blending'] },
  { name: 'CVC Words & Reading', range: [61, 90], emoji: '📖', skills: ['CVC words', 'Short vowels', 'Sight words'] },
  { name: 'Digraphs & Blends', range: [91, 120], emoji: '🚀', skills: ['SH, CH, TH', 'Blends', 'Fluency'] },
  { name: 'Vocabulary & Grammar', range: [121, 150], emoji: '🧠', skills: ['Verbs', 'Adjectives', 'Sentences'] },
  { name: 'Story Mastery', range: [151, 180], emoji: '🎓', skills: ['Reading fluency', 'Comprehension', 'Expression'] },
];

function getWeakSounds(completions: ChildData['completions']): { sound: string; status: 'weak' | 'improving' | 'strong' }[] {
  // Infer weak sounds from scores
  const avgPronunciation = completions.length > 0
    ? completions.reduce((s, c) => s + (c.pronunciation_score || 0), 0) / completions.length
    : 0;
  const avgFluency = completions.length > 0
    ? completions.reduce((s, c) => s + (c.fluency_score || 0), 0) / completions.length
    : 0;
  const avgClarity = completions.length > 0
    ? completions.reduce((s, c) => s + (c.clarity_score || 0), 0) / completions.length
    : 0;

  const sounds = [
    { sound: 'Short vowels (/a/, /e/, /i/)', score: avgPronunciation },
    { sound: 'Consonant blends', score: avgFluency },
    { sound: 'Word clarity', score: avgClarity },
    { sound: 'Sentence fluency', score: (avgFluency + avgClarity) / 2 },
  ];

  return sounds.map(s => ({
    sound: s.sound,
    status: s.score >= 75 ? 'strong' : s.score >= 50 ? 'improving' : 'weak',
  }));
}

export function PhonicsProgressDiagnostics({ child }: PhonicsProgressDiagnosticsProps) {
  if (!child) return null;

  const currentDay = child.progress?.current_day || 1;
  const currentPhaseIndex = phonicsPhases.findIndex(p => currentDay >= p.range[0] && currentDay <= p.range[1]);
  const currentPhase = phonicsPhases[currentPhaseIndex >= 0 ? currentPhaseIndex : 0];
  const weakSounds = getWeakSounds(child.completions);

  // Calculate mastery gate status
  const getMasteryStatus = (phaseIndex: number) => {
    const phase = phonicsPhases[phaseIndex];
    const phaseCompletions = child.completions.filter(c => {
      // Simple heuristic: check if lesson_id falls in range based on completion order
      return true; // We'll use day-based logic instead
    });
    
    if (currentDay < phase.range[0]) return 'not_started';
    if (currentDay > phase.range[1]) return 'completed';
    const progress = ((currentDay - phase.range[0]) / (phase.range[1] - phase.range[0] + 1)) * 100;
    if (progress >= 80) return 'ready';
    return 'in_progress';
  };

  // Recommended next action
  const getRecommendation = () => {
    if (child.completions.length === 0) return 'Start the first lesson to begin the phonics journey!';
    const weakOnes = weakSounds.filter(s => s.status === 'weak');
    if (weakOnes.length > 0) return `Practice ${weakOnes[0].sound.toLowerCase()} — needs more support`;
    if (currentDay <= 30) return 'Complete today\'s sound awareness activity';
    if (currentDay <= 60) return 'Practice letter-sound connections today';
    return `Continue Day ${currentDay} — ${currentPhase.name}`;
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center gap-2 mb-1">
        <BookOpen className="h-5 w-5 text-primary" />
        <h3 className="font-display font-bold text-lg">Phonics Progress</h3>
      </div>

      {/* Current Phase */}
      <div className="rounded-xl border bg-gradient-to-r from-primary/5 to-accent/5 p-4">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-2xl">{currentPhase.emoji}</span>
          <div>
            <p className="font-bold text-sm">Current Phase: {currentPhase.name}</p>
            <p className="text-xs text-muted-foreground">Day {currentDay} of {currentPhase.range[1]}</p>
          </div>
        </div>
        <Progress 
          value={((currentDay - currentPhase.range[0]) / (currentPhase.range[1] - currentPhase.range[0] + 1)) * 100} 
          className="h-2.5" 
        />
        <div className="flex flex-wrap gap-1.5 mt-3">
          {currentPhase.skills.map(skill => (
            <span key={skill} className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
              {skill}
            </span>
          ))}
        </div>
      </div>

      {/* Phase Progress Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
        {phonicsPhases.map((phase, i) => {
          const status = getMasteryStatus(i);
          return (
            <div key={i} className={`rounded-xl border p-3 text-center ${
              i === currentPhaseIndex ? 'border-primary/50 bg-primary/5' : 'border-border'
            }`}>
              <span className="text-lg">{phase.emoji}</span>
              <p className="text-[11px] font-bold mt-1 truncate">{phase.name}</p>
              <div className="mt-1.5">
                {status === 'completed' && (
                  <span className="inline-flex items-center gap-0.5 text-[10px] text-secondary font-medium">
                    <CheckCircle2 className="h-3 w-3" /> Done
                  </span>
                )}
                {status === 'in_progress' && (
                  <span className="inline-flex items-center gap-0.5 text-[10px] text-primary font-medium">
                    <Clock className="h-3 w-3" /> In Progress
                  </span>
                )}
                {status === 'ready' && (
                  <span className="inline-flex items-center gap-0.5 text-[10px] text-pixo-green font-medium">
                    <TrendingUp className="h-3 w-3" /> Ready
                  </span>
                )}
                {status === 'not_started' && (
                  <span className="text-[10px] text-muted-foreground">🔒 Locked</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Weak Sounds */}
      <div className="rounded-xl border p-4">
        <div className="flex items-center gap-2 mb-3">
          <Volume2 className="h-4 w-4 text-pixo-orange" />
          <p className="font-bold text-sm">Sound Skills</p>
        </div>
        <div className="space-y-2.5">
          {weakSounds.map((s, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{s.sound}</p>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                s.status === 'strong' ? 'bg-secondary/15 text-secondary' :
                s.status === 'improving' ? 'bg-pixo-yellow/15 text-pixo-yellow' :
                'bg-pixo-orange/15 text-pixo-orange'
              }`}>
                {s.status === 'strong' ? '💪 Strong' : s.status === 'improving' ? '📈 Improving' : '🔄 Needs Practice'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Recommended Next */}
      <div className="rounded-xl border bg-secondary/5 p-4">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="h-4 w-4 text-secondary" />
          <p className="font-bold text-sm">Recommended Next</p>
        </div>
        <div className="flex items-center gap-2">
          <ArrowRight className="h-4 w-4 text-primary shrink-0" />
          <p className="text-sm text-muted-foreground">{getRecommendation()}</p>
        </div>
      </div>
    </div>
  );
}

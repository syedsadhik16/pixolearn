import { Globe, BookOpen, Sparkles, Mic2, PenTool, MessageCircle } from 'lucide-react';
import { ScrollReveal } from '@/components/shared/ScrollReveal';

const tracks = [
  {
    icon: Globe,
    title: 'French for Kids',
    description: 'Play-based beginner language learning',
    gradient: 'from-blue-500 to-indigo-500',
  },
  {
    icon: BookOpen,
    title: 'Arabic Foundations',
    description: 'Listening, speaking, and word familiarity',
    gradient: 'from-emerald-500 to-teal-500',
  },
  {
    icon: Sparkles,
    title: 'AI Prompting for Kids',
    description: 'Learn to ask smart questions to AI safely and creatively',
    gradient: 'from-violet-500 to-purple-500',
  },
  {
    icon: Mic2,
    title: 'Storytelling & Public Speaking',
    description: 'Build confidence, expression, and speaking ability',
    gradient: 'from-amber-500 to-orange-500',
  },
  {
    icon: PenTool,
    title: 'Creative Writing Lab',
    description: 'Guided imagination, sentence building, and story creation',
    gradient: 'from-pink-500 to-rose-500',
  },
];

export function ComingSoonTracks() {
  return (
    <section className="py-16 md:py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <ScrollReveal>
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-xs font-bold px-4 py-1.5 rounded-full mb-4">
              <Sparkles className="h-3.5 w-3.5" />
              Expanding Soon
            </div>
            <h2 className="text-2xl md:text-3xl font-display font-bold mb-2">
              More Learning Worlds <span className="gradient-text">Coming Soon</span>
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              More exciting learning tracks are on the way. PIXO is growing into a complete learning ecosystem.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-4xl mx-auto">
          {tracks.map((track, i) => (
            <ScrollReveal key={i}>
              <div className="pixo-card p-5 relative overflow-hidden group hover:shadow-lg transition-all">
                <div className="absolute top-3 right-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-muted text-muted-foreground px-2.5 py-1 rounded-full">
                    Coming Soon
                  </span>
                </div>
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${track.gradient} flex items-center justify-center mb-4`}>
                  <track.icon className="h-5 w-5 text-white" />
                </div>
                <h3 className="font-display font-bold mb-1">{track.title}</h3>
                <p className="text-sm text-muted-foreground">{track.description}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

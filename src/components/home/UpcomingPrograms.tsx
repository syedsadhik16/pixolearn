import { Sparkles } from 'lucide-react';

const programs = [
  { emoji: '🇮🇳', title: 'Hindi', description: 'Learn Hindi through stories and games', gradient: 'from-orange-500 to-amber-500' },
  { emoji: '🌙', title: 'Arabic', description: 'Arabic foundations for young learners', gradient: 'from-emerald-500 to-teal-500' },
  { emoji: '🇫🇷', title: 'French', description: 'Play-based beginner French', gradient: 'from-blue-500 to-indigo-500' },
  { emoji: '💻', title: 'Coding', description: 'Introduction to coding concepts', gradient: 'from-violet-500 to-purple-500' },
  { emoji: '🤖', title: 'AI & Prompting', description: 'Learn to ask smart questions to AI', gradient: 'from-pink-500 to-rose-500' },
];

export function UpcomingPrograms() {
  return (
    <section className="py-16 bg-muted/30 overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-xs font-bold px-4 py-1.5 rounded-full mb-3">
            <Sparkles className="h-3.5 w-3.5" />
            Expanding Soon
          </div>
          <h2 className="text-2xl md:text-3xl font-display font-bold mb-2">
            🚀 Upcoming Learning Programs
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto text-sm">
            PIXO is growing into a complete learning ecosystem. More exciting tracks are on the way!
          </p>
        </div>

        <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 snap-x snap-mandatory scrollbar-hide">
          {programs.map((prog) => (
            <div
              key={prog.title}
              className="snap-start shrink-0 w-52 pixo-card p-5 relative overflow-hidden group hover:shadow-lg transition-all"
            >
              <div className="absolute top-3 right-3">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                  Coming Soon
                </span>
              </div>
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${prog.gradient} flex items-center justify-center mb-3`}>
                <span className="text-xl">{prog.emoji}</span>
              </div>
              <h3 className="font-display font-bold mb-1">{prog.title}</h3>
              <p className="text-xs text-muted-foreground">{prog.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

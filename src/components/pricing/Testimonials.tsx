import { Star } from 'lucide-react';
import { ScrollReveal } from '@/components/shared/ScrollReveal';

const testimonials = [
  {
    name: 'Priya M.',
    role: 'Mother of 6-year-old',
    quote: 'My son went from barely knowing the alphabet to reading short stories in just 3 months. The AI pronunciation feedback is incredible!',
    rating: 5,
    plan: 'Level 1 – Beginner',
  },
  {
    name: 'Rahul S.',
    role: 'Father of 8-year-old',
    quote: 'PIXO made English fun for my daughter. She actually asks to practice every day now. The gamification and streaks keep her motivated.',
    rating: 5,
    plan: 'Level 2 – Intermediate',
  },
  {
    name: 'Anita K.',
    role: 'Mother of 10-year-old',
    quote: 'The parent dashboard gives me full visibility into his progress. I love getting notifications when he hits milestones. Worth every rupee!',
    rating: 5,
    plan: 'Level 3 – Advanced',
  },
];

export function Testimonials() {
  return (
    <section className="pb-20">
      <div className="container mx-auto px-4">
        <ScrollReveal>
          <h2 className="text-2xl md:text-3xl font-display font-bold text-center mb-2">
            Loved by <span className="gradient-text">Parents</span>
          </h2>
          <p className="text-center text-muted-foreground mb-8">
            See what families are saying about PIXO
          </p>
        </ScrollReveal>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {testimonials.map((t, i) => (
            <ScrollReveal key={i} delay={i * 100}>
              <div className="pixo-card h-full flex flex-col">
                <div className="flex gap-0.5 mb-3">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <Star key={j} className="h-4 w-4 text-pixo-yellow fill-pixo-yellow" />
                  ))}
                </div>
                <p className="text-sm text-foreground mb-4 flex-1 italic">"{t.quote}"</p>
                <div className="border-t border-border pt-3">
                  <p className="font-semibold text-sm">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                  <p className="text-xs text-primary font-medium mt-1">{t.plan}</p>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

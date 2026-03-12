import { Mic, BookOpen, Shield, BarChart3, Headphones, Users, Star, Volume2 } from 'lucide-react';

const highlights = [
  { icon: Mic, title: 'AI Speech Scoring', description: 'Real-time pronunciation feedback powered by advanced AI' },
  { icon: BookOpen, title: '180 Lessons Per Level', description: 'Structured daily curriculum designed by language experts' },
  { icon: Shield, title: 'Confidence-First Learning', description: 'No failure screens — every child progresses at their pace' },
  { icon: Star, title: 'Smart Level Recommendation', description: 'Assessment-based starting point tailored to your child' },
  { icon: BarChart3, title: 'Parent Mastery Hub', description: 'Track progress with detailed reports and insights' },
  { icon: Headphones, title: 'Audio-Assisted Learning', description: 'Listen-first approach for better understanding' },
  { icon: Volume2, title: 'Voice-Guided Experience', description: 'Child-friendly narration with customizable voices' },
  { icon: Users, title: 'Built for Young Learners', description: 'Playful, intuitive UI designed for ages 4–12' },
];

export function WhyParentsChoose() {
  return (
    <section className="py-16 md:py-20">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl md:text-3xl font-display font-bold text-center mb-2">
          Why Parents Choose <span className="gradient-text">PIXO</span>
        </h2>
        <p className="text-center text-muted-foreground mb-10 max-w-xl mx-auto">
          A learning experience built with care — for children and the parents who guide them.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
          {highlights.map((item, i) => (
            <div
              key={i}
              className="pixo-card p-5 text-center space-y-3 hover:shadow-md transition-shadow"
            >
              <div className="w-12 h-12 rounded-2xl gradient-bg flex items-center justify-center mx-auto">
                <item.icon className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-display font-bold text-sm">{item.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

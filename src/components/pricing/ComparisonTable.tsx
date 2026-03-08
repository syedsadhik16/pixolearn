import { Check, X } from 'lucide-react';

const features = [
  { name: 'Phonics & Letter Sounds', beginner: true, intermediate: true, advanced: true },
  { name: '3-Letter Word Reading', beginner: true, intermediate: true, advanced: true },
  { name: '5-Letter Word Reading', beginner: true, intermediate: true, advanced: true },
  { name: 'Pronunciation Practice', beginner: true, intermediate: true, advanced: true },
  { name: 'AI Speech Evaluation', beginner: true, intermediate: true, advanced: true },
  { name: 'Sentence Formation', beginner: false, intermediate: true, advanced: true },
  { name: 'Short Story Reading', beginner: false, intermediate: true, advanced: true },
  { name: 'Daily Speaking Practice', beginner: false, intermediate: true, advanced: true },
  { name: 'Storytelling & Narration', beginner: false, intermediate: false, advanced: true },
  { name: 'Independent Reading', beginner: false, intermediate: false, advanced: true },
  { name: 'Real-life Conversation Skills', beginner: false, intermediate: false, advanced: true },
  { name: 'Parent Progress Reports', beginner: true, intermediate: true, advanced: true },
  { name: 'Gamification & Rewards', beginner: true, intermediate: true, advanced: true },
  { name: 'Dedicated Support', beginner: false, intermediate: true, advanced: true },
];

const FeatureIcon = ({ available }: { available: boolean }) =>
  available ? (
    <Check className="h-4 w-4 text-pixo-green mx-auto" />
  ) : (
    <X className="h-4 w-4 text-muted-foreground/40 mx-auto" />
  );

export function ComparisonTable() {
  return (
    <section className="pb-20">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl md:text-3xl font-display font-bold text-center mb-8">
          Compare All <span className="gradient-text">Features</span>
        </h2>
        <div className="max-w-4xl mx-auto overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 font-semibold text-foreground">Feature</th>
                <th className="text-center py-3 px-2 font-semibold text-foreground whitespace-nowrap">
                  Level 1<br />
                  <span className="text-xs font-normal text-muted-foreground">Beginner</span>
                </th>
                <th className="text-center py-3 px-2 font-semibold text-primary whitespace-nowrap">
                  Level 2<br />
                  <span className="text-xs font-normal text-muted-foreground">Intermediate</span>
                </th>
                <th className="text-center py-3 px-2 font-semibold text-foreground whitespace-nowrap">
                  Level 3<br />
                  <span className="text-xs font-normal text-muted-foreground">Advanced</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {features.map((feature, i) => (
                <tr
                  key={feature.name}
                  className={`border-b border-border/50 ${i % 2 === 0 ? 'bg-muted/30' : ''}`}
                >
                  <td className="py-3 px-4 text-foreground">{feature.name}</td>
                  <td className="py-3 px-2"><FeatureIcon available={feature.beginner} /></td>
                  <td className="py-3 px-2"><FeatureIcon available={feature.intermediate} /></td>
                  <td className="py-3 px-2"><FeatureIcon available={feature.advanced} /></td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-border">
                <td className="py-4 px-4 font-semibold text-foreground">Price</td>
                <td className="py-4 px-2 text-center font-bold text-foreground">₹5,999</td>
                <td className="py-4 px-2 text-center font-bold text-primary">₹9,999</td>
                <td className="py-4 px-2 text-center font-bold text-foreground">₹14,999</td>
              </tr>
              <tr>
                <td className="py-2 px-4 text-muted-foreground">Duration</td>
                <td className="py-2 px-2 text-center text-muted-foreground">6 months</td>
                <td className="py-2 px-2 text-center text-muted-foreground">12 months</td>
                <td className="py-2 px-2 text-center text-muted-foreground">18 months</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </section>
  );
}

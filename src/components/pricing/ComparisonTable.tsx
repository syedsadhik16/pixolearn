import { Check, X } from 'lucide-react';

const features = [
  { name: 'Lessons per level', explorer: '3', adventurer: '180', achiever: '180' },
  { name: 'Speech feedback', explorer: 'Basic', adventurer: 'Advanced AI', achiever: 'Advanced AI' },
  { name: 'AI practice', explorer: 'Limited', adventurer: 'Unlimited', achiever: 'Unlimited' },
  { name: 'Daily login rewards', explorer: true, adventurer: true, achiever: true },
  { name: 'Parent Mastery Hub', explorer: false, adventurer: true, achiever: true },
  { name: 'Role play studio', explorer: false, adventurer: true, achiever: true },
  { name: 'Weekly progress reports', explorer: false, adventurer: true, achiever: true },
  { name: 'Priority support', explorer: false, adventurer: true, achiever: true },
  { name: 'All 3 levels unlocked', explorer: false, adventurer: false, achiever: true },
  { name: 'Creative Studio access', explorer: false, adventurer: false, achiever: true },
  { name: 'Expert PDF reports', explorer: false, adventurer: false, achiever: true },
  { name: 'Offline lesson download', explorer: false, adventurer: false, achiever: true },
  { name: 'Family sharing', explorer: false, adventurer: false, achiever: '2 kids' },
  { name: 'Early feature access', explorer: false, adventurer: false, achiever: true },
];

const FeatureCell = ({ value }: { value: boolean | string }) => {
  if (typeof value === 'string') {
    return <span className="text-xs font-medium text-foreground">{value}</span>;
  }
  return value ? (
    <Check className="h-4 w-4 text-pixo-green mx-auto" />
  ) : (
    <X className="h-4 w-4 text-muted-foreground/40 mx-auto" />
  );
};

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
                  Explorer<br />
                  <span className="text-xs font-normal text-muted-foreground">Free</span>
                </th>
                <th className="text-center py-3 px-2 font-semibold text-primary whitespace-nowrap">
                  Adventurer<br />
                  <span className="text-xs font-normal text-muted-foreground">₹499/mo</span>
                </th>
                <th className="text-center py-3 px-2 font-semibold text-foreground whitespace-nowrap">
                  Achiever<br />
                  <span className="text-xs font-normal text-muted-foreground">₹2,999/yr</span>
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
                  <td className="py-3 px-2 text-center"><FeatureCell value={feature.explorer} /></td>
                  <td className="py-3 px-2 text-center"><FeatureCell value={feature.adventurer} /></td>
                  <td className="py-3 px-2 text-center"><FeatureCell value={feature.achiever} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

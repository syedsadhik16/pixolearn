import { Check, X } from 'lucide-react';

const features = [
  { name: 'Duration', sixMonths: '6 Months', twelveMonths: '12 Months', eighteenMonths: '18 Months' },
  { name: 'Level access', sixMonths: '1 Level', twelveMonths: '2 Levels', eighteenMonths: 'All 3 Levels' },
  { name: 'Total lessons', sixMonths: '180', twelveMonths: '360', eighteenMonths: '540' },
  { name: 'Speech feedback', sixMonths: 'Advanced AI', twelveMonths: 'Advanced AI', eighteenMonths: 'Advanced AI' },
  { name: 'AI practice', sixMonths: 'Unlimited', twelveMonths: 'Unlimited', eighteenMonths: 'Unlimited' },
  { name: 'Daily login rewards', sixMonths: true, twelveMonths: true, eighteenMonths: true },
  { name: 'Parent Mastery Hub', sixMonths: true, twelveMonths: true, eighteenMonths: true },
  { name: 'Role play studio', sixMonths: true, twelveMonths: true, eighteenMonths: true },
  { name: 'Weekly progress reports', sixMonths: false, twelveMonths: true, eighteenMonths: true },
  { name: 'Priority support', sixMonths: false, twelveMonths: true, eighteenMonths: true },
  { name: 'Creative Studio access', sixMonths: false, twelveMonths: false, eighteenMonths: true },
  { name: 'Expert PDF reports', sixMonths: false, twelveMonths: false, eighteenMonths: true },
  { name: 'Family sharing', sixMonths: false, twelveMonths: false, eighteenMonths: '2 kids' },
  { name: 'Early feature access', sixMonths: false, twelveMonths: false, eighteenMonths: true },
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
                  6 Months<br />
                  <span className="text-xs font-normal text-muted-foreground">₹5,999</span>
                </th>
                <th className="text-center py-3 px-2 font-semibold text-primary whitespace-nowrap">
                  12 Months<br />
                  <span className="text-xs font-normal text-muted-foreground">₹9,999</span>
                </th>
                <th className="text-center py-3 px-2 font-semibold text-foreground whitespace-nowrap">
                  18 Months<br />
                  <span className="text-xs font-normal text-muted-foreground">₹14,999</span>
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
                  <td className="py-3 px-2 text-center"><FeatureCell value={feature.sixMonths} /></td>
                  <td className="py-3 px-2 text-center"><FeatureCell value={feature.twelveMonths} /></td>
                  <td className="py-3 px-2 text-center"><FeatureCell value={feature.eighteenMonths} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, RefreshCw, CreditCard } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

type Filter = 'all' | 'free' | 'premium' | 'expired' | 'trial';

interface Row {
  user_id: string;
  email: string;
  name: string;
  parent_emails: string[];
  plan: string | null;
  duration_months: number | null;
  payment_status: string;
  is_paid: boolean;
  entitlement_status: string;
  expiry: string | null;
  paid_at: string | null;
  amount: number | null;
  currency: string | null;
  trial_expires_at: string | null;
  subscription_type: string;
  derived: 'premium' | 'trial' | 'expired' | 'free';
}

export function SubscriptionsTab() {
  const { toast } = useToast();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('all');

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [profilesRes, entRes, linksRes] = await Promise.all([
        supabase.from('profiles').select('id,email,full_name,role,subscription_type,trial_expires_at').eq('role', 'student'),
        supabase.from('user_entitlements').select('*'),
        supabase.from('parent_children').select('parent_id,child_id'),
      ]);
      if (profilesRes.error) throw profilesRes.error;
      const parents = await supabase.from('profiles').select('id,email').eq('role', 'parent');
      const parentEmailById: Record<string, string> = {};
      (parents.data || []).forEach((p: any) => { parentEmailById[p.id] = p.email; });

      const entByUser: Record<string, any> = {};
      (entRes.data || []).forEach((e: any) => { entByUser[e.user_id] = e; });

      const parentsByChild: Record<string, string[]> = {};
      (linksRes.data || []).forEach((l: any) => {
        parentsByChild[l.child_id] = parentsByChild[l.child_id] || [];
        if (parentEmailById[l.parent_id]) parentsByChild[l.child_id].push(parentEmailById[l.parent_id]);
      });

      const now = Date.now();
      const built: Row[] = (profilesRes.data || []).map((p: any) => {
        const e = entByUser[p.id] || {};
        const expiryMs = e.entitlement_expiry_date ? new Date(e.entitlement_expiry_date).getTime() : null;
        const trialMs = p.trial_expires_at ? new Date(p.trial_expires_at).getTime() : null;
        let derived: Row['derived'] = 'free';
        if (e.is_paid && e.entitlement_status === 'active' && expiryMs && expiryMs > now) {
          derived = 'premium';
        } else if (e.is_paid && expiryMs && expiryMs <= now) {
          derived = 'expired';
        } else if (p.subscription_type === 'premium' && trialMs && trialMs > now) {
          derived = 'trial';
        } else if (p.subscription_type === 'premium' && (!trialMs || trialMs > now)) {
          derived = 'premium';
        }
        return {
          user_id: p.id,
          email: p.email,
          name: p.full_name || '—',
          parent_emails: parentsByChild[p.id] || [],
          plan: e.selected_plan ?? null,
          duration_months: e.plan_duration_months ?? null,
          payment_status: e.payment_status ?? 'unpaid',
          is_paid: !!e.is_paid,
          entitlement_status: e.entitlement_status ?? 'inactive',
          expiry: e.entitlement_expiry_date ?? null,
          paid_at: e.paid_at ?? null,
          amount: e.amount_paid ?? null,
          currency: e.currency ?? null,
          trial_expires_at: p.trial_expires_at ?? null,
          subscription_type: p.subscription_type,
          derived,
        };
      });
      setRows(built);
    } catch (e: any) {
      toast({ title: 'Failed to load subscriptions', description: e.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return rows.filter((r) => {
      const matchesSearch = !q ||
        r.email.toLowerCase().includes(q) ||
        r.name.toLowerCase().includes(q) ||
        r.parent_emails.some((p) => p.toLowerCase().includes(q));
      const matchesFilter = filter === 'all' || r.derived === filter;
      return matchesSearch && matchesFilter;
    });
  }, [rows, search, filter]);

  const counts = useMemo(() => ({
    all: rows.length,
    premium: rows.filter((r) => r.derived === 'premium').length,
    trial: rows.filter((r) => r.derived === 'trial').length,
    expired: rows.filter((r) => r.derived === 'expired').length,
    free: rows.filter((r) => r.derived === 'free').length,
  }), [rows]);

  const badgeFor = (d: Row['derived']) => {
    if (d === 'premium') return <Badge className="bg-pixo-green/15 text-pixo-green border-pixo-green/30">Premium</Badge>;
    if (d === 'trial') return <Badge className="bg-pixo-blue/15 text-pixo-blue border-pixo-blue/30">Trial</Badge>;
    if (d === 'expired') return <Badge variant="destructive">Expired</Badge>;
    return <Badge variant="secondary">Free</Badge>;
  };

  const renewalLabel = (r: Row) => {
    if (!r.expiry) return '—';
    const d = new Date(r.expiry);
    const days = Math.round((d.getTime() - Date.now()) / 86400000);
    if (days < 0) return <span className="text-destructive text-xs">Expired {Math.abs(days)}d ago</span>;
    if (days <= 7) return <span className="text-pixo-orange text-xs">Renews in {days}d</span>;
    return <span className="text-xs text-muted-foreground">Renews in {days}d</span>;
  };

  return (
    <div className="space-y-4">
      <div className="pixo-card">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-display font-bold">Subscriptions & Payments</h2>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input className="pl-9" placeholder="Search student or parent…" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <Button variant="outline" size="icon" onClick={fetchAll} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {(['all', 'premium', 'trial', 'expired', 'free'] as Filter[]).map((f) => (
            <Button
              key={f}
              size="sm"
              variant={filter === f ? 'default' : 'outline'}
              onClick={() => setFilter(f)}
              className="capitalize"
            >
              {f} <span className="ml-2 opacity-60">({counts[f]})</span>
            </Button>
          ))}
        </div>

        <div className="rounded-xl border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Linked Parent(s)</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Expiry / Renewal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((r) => (
                <TableRow key={r.user_id}>
                  <TableCell>
                    <div className="font-medium text-sm">{r.name}</div>
                    <div className="text-xs text-muted-foreground">{r.email}</div>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {r.parent_emails.length > 0 ? r.parent_emails.join(', ') : <span className="italic">Not linked</span>}
                  </TableCell>
                  <TableCell className="text-xs">
                    {r.plan ? (
                      <>
                        <div className="font-medium capitalize">{r.plan}</div>
                        {r.duration_months && <div className="text-muted-foreground">{r.duration_months}mo</div>}
                      </>
                    ) : '—'}
                  </TableCell>
                  <TableCell>{badgeFor(r.derived)}</TableCell>
                  <TableCell className="text-xs">
                    <div className="capitalize">{r.payment_status}</div>
                    {r.amount ? (
                      <div className="text-muted-foreground">
                        {r.currency ?? 'INR'} {(r.amount / 100).toFixed(2)}
                      </div>
                    ) : null}
                    {r.paid_at && (
                      <div className="text-[10px] text-muted-foreground">
                        {format(new Date(r.paid_at), 'MMM d, yyyy')}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {r.expiry ? (
                      <>
                        <div className="text-xs">{format(new Date(r.expiry), 'MMM d, yyyy')}</div>
                        <div>{renewalLabel(r)}</div>
                      </>
                    ) : r.trial_expires_at ? (
                      <div className="text-xs">Trial until {format(new Date(r.trial_expires_at), 'MMM d')}</div>
                    ) : '—'}
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground text-sm">
                    {loading ? 'Loading…' : 'No matching subscriptions.'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

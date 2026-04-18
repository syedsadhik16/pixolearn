import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { KeyRound, Copy, Check, Link2, Phone, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

/**
 * Shows the student their own child code, invite token, and editable phone
 * so a parent can link via Email / Code / Phone / Token.
 */
export function MyChildCode() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [code, setCode] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [phone, setPhone] = useState<string>('');
  const [savedPhone, setSavedPhone] = useState<string>('');
  const [savingPhone, setSavingPhone] = useState(false);
  const [copied, setCopied] = useState<'code' | 'token' | 'phone' | null>(null);

  useEffect(() => {
    if (!user || profile?.role !== 'student') return;
    supabase
      .from('profiles')
      .select('child_code, invite_token, phone')
      .eq('id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setCode((data as any).child_code ?? null);
          setToken((data as any).invite_token ?? null);
          setPhone((data as any).phone ?? '');
          setSavedPhone((data as any).phone ?? '');
        }
      });
  }, [user, profile]);

  if (profile?.role !== 'student' || !code) return null;

  const copy = async (kind: 'code' | 'token' | 'phone', value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(kind);
      toast({ title: 'Copied!', description: `${kind} copied.` });
      setTimeout(() => setCopied(null), 1500);
    } catch {
      toast({ title: 'Copy failed', variant: 'destructive' });
    }
  };

  const savePhone = async () => {
    if (!user) return;
    setSavingPhone(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ phone: phone.trim() || null } as any)
        .eq('id', user.id);
      if (error) throw error;
      setSavedPhone(phone.trim());
      toast({ title: 'Phone saved', description: 'Your parent can now link by phone.' });
    } catch (e: any) {
      toast({ title: 'Could not save phone', description: e.message, variant: 'destructive' });
    } finally {
      setSavingPhone(false);
    }
  };

  return (
    <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <KeyRound className="h-4 w-4 text-primary" />
        <h3 className="font-bold text-sm">Share with your parent</h3>
      </div>
      <p className="text-xs text-muted-foreground">
        Give any of these to your parent so they can see your progress.
      </p>

      <div className="flex items-center gap-2 bg-card border rounded-xl p-3">
        <div className="flex-1">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Child Code</p>
          <p className="font-mono font-bold text-lg tracking-widest">{code}</p>
        </div>
        <Button size="sm" variant="ghost" onClick={() => copy('code', code)}>
          {copied === 'code' ? <Check className="h-4 w-4 text-pixo-green" /> : <Copy className="h-4 w-4" />}
        </Button>
      </div>

      <div className="bg-card border rounded-xl p-3 space-y-2">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1">
          <Phone className="h-3 w-3" /> Phone Number
        </p>
        <div className="flex gap-2">
          <Input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+91 98765 43210"
            inputMode="tel"
            className="h-9 text-sm"
          />
          <Button size="sm" onClick={savePhone} disabled={savingPhone || phone === savedPhone}>
            <Save className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {token && (
        <div className="flex items-center gap-2 bg-card border rounded-xl p-3">
          <div className="flex-1 min-w-0">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Invite Token</p>
            <p className="font-mono text-xs truncate">{token}</p>
          </div>
          <Button size="sm" variant="ghost" onClick={() => copy('token', token)}>
            {copied === 'token' ? <Check className="h-4 w-4 text-pixo-green" /> : <Link2 className="h-4 w-4" />}
          </Button>
        </div>
      )}
    </div>
  );
}

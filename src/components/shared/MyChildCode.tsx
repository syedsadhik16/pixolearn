import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { KeyRound, Copy, Check, Link2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Shows the student their own child code and invite token so they can share
 * with a parent for linking. Only useful on student-facing screens.
 */
export function MyChildCode() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [code, setCode] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [copied, setCopied] = useState<'code' | 'token' | null>(null);

  useEffect(() => {
    if (!user || profile?.role !== 'student') return;
    supabase
      .from('profiles')
      .select('child_code, invite_token')
      .eq('id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setCode((data as any).child_code ?? null);
          setToken((data as any).invite_token ?? null);
        }
      });
  }, [user, profile]);

  if (profile?.role !== 'student' || !code) return null;

  const copy = async (kind: 'code' | 'token', value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(kind);
      toast({ title: 'Copied!', description: `${kind === 'code' ? 'Child code' : 'Invite token'} copied.` });
      setTimeout(() => setCopied(null), 1500);
    } catch {
      toast({ title: 'Copy failed', variant: 'destructive' });
    }
  };

  return (
    <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <KeyRound className="h-4 w-4 text-primary" />
        <h3 className="font-bold text-sm">Share with your parent</h3>
      </div>
      <p className="text-xs text-muted-foreground">
        Give either of these to your parent so they can see your progress.
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

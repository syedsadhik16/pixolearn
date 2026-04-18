import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Mail, KeyRound, Link2, Loader2, UserPlus, Phone } from 'lucide-react';

interface ChildLinkPanelProps {
  onLinked: () => void;
  onClose?: () => void;
}

type LookupMethod = 'email' | 'code' | 'phone' | 'token';

export function ChildLinkPanel({ onLinked, onClose }: ChildLinkPanelProps) {
  const { toast } = useToast();
  const [method, setMethod] = useState<LookupMethod>('email');
  const [value, setValue] = useState('');
  const [busy, setBusy] = useState(false);

  const placeholders: Record<LookupMethod, string> = {
    email: 'child@example.com',
    code: 'ABC123',
    phone: '+91 98765 43210',
    token: 'invite token (UUID)',
  };

  const labels: Record<LookupMethod, string> = {
    email: "Child's Email",
    code: '6-character Child Code',
    phone: "Child's Phone Number",
    token: 'Invite Token',
  };

  const handleLink = async () => {
    const trimmed = value.trim();
    if (!trimmed) {
      toast({ title: 'Required', description: `Enter ${labels[method].toLowerCase()}`, variant: 'destructive' });
      return;
    }
    setBusy(true);
    try {
      const { data, error } = await supabase.rpc('link_child_to_parent', {
        _method: method,
        _value: trimmed,
      });
      if (error) throw error;
      const result = data as {
        success: boolean;
        already_linked?: boolean;
        child_email?: string;
        child_name?: string;
        error?: string;
      };
      if (!result.success) {
        toast({ title: 'Could not link', description: result.error || 'Unknown error', variant: 'destructive' });
        return;
      }
      const name = result.child_name || result.child_email || 'child';
      if (result.already_linked) {
        toast({ title: 'Already linked', description: `${name} is already in your account.` });
      } else {
        toast({ title: 'Linked! 🎉', description: `${name} added successfully.` });
      }
      setValue('');
      onLinked();
      onClose?.();
    } catch (e) {
      toast({
        title: 'Error',
        description: (e as Error).message || 'Failed to link child',
        variant: 'destructive',
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <Tabs value={method} onValueChange={(v) => setMethod(v as LookupMethod)}>
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="email" className="text-xs">
            <Mail className="h-3.5 w-3.5 mr-1" />
            Email
          </TabsTrigger>
          <TabsTrigger value="code" className="text-xs">
            <KeyRound className="h-3.5 w-3.5 mr-1" />
            Code
          </TabsTrigger>
          <TabsTrigger value="phone" className="text-xs">
            <Phone className="h-3.5 w-3.5 mr-1" />
            Phone
          </TabsTrigger>
          <TabsTrigger value="token" className="text-xs">
            <Link2 className="h-3.5 w-3.5 mr-1" />
            Token
          </TabsTrigger>
        </TabsList>

        {(['email', 'code', 'phone', 'token'] as LookupMethod[]).map((m) => (
          <TabsContent key={m} value={m} className="space-y-3 mt-4">
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">
                {labels[m]}
              </label>
              <Input
                placeholder={placeholders[m]}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLink()}
                inputMode={m === 'phone' ? 'tel' : 'text'}
                autoFocus
              />
              <p className="text-[11px] text-muted-foreground mt-1.5">
                {m === 'email' && "Use the email your child signed up with."}
                {m === 'code' && 'Ask your child to share their 6-character code from Profile.'}
                {m === 'phone' && 'Enter the phone number your child saved on their profile (digits only matched).'}
                {m === 'token' && 'Use the invite link/token shared by your child.'}
              </p>
            </div>
            <Button onClick={handleLink} disabled={busy} className="w-full">
              {busy ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Linking...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Link Child
                </>
              )}
            </Button>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

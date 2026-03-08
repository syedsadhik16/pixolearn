import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Settings, BookOpen, Trophy, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

interface Preferences {
  lesson_completed: boolean;
  streak_milestone: boolean;
  level_up: boolean;
}

const defaultPrefs: Preferences = {
  lesson_completed: true,
  streak_milestone: true,
  level_up: true,
};

export function NotificationPreferences({ userId }: { userId: string }) {
  const [prefs, setPrefs] = useState<Preferences>(defaultPrefs);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) fetchPrefs();
  }, [open, userId]);

  const fetchPrefs = async () => {
    const { data } = await supabase
      .from('notification_preferences')
      .select('lesson_completed, streak_milestone, level_up')
      .eq('parent_id', userId)
      .maybeSingle();

    if (data) {
      setPrefs({
        lesson_completed: data.lesson_completed,
        streak_milestone: data.streak_milestone,
        level_up: data.level_up,
      });
    }
  };

  const handleToggle = async (key: keyof Preferences, value: boolean) => {
    const updated = { ...prefs, [key]: value };
    setPrefs(updated);
    setSaving(true);

    const { error } = await supabase
      .from('notification_preferences')
      .upsert(
        { parent_id: userId, ...updated, updated_at: new Date().toISOString() },
        { onConflict: 'parent_id' }
      );

    setSaving(false);

    if (error) {
      setPrefs(prefs); // revert
      toast({ title: 'Error', description: 'Failed to save preference', variant: 'destructive' });
    }
  };

  const prefItems = [
    {
      key: 'lesson_completed' as const,
      label: 'Lesson Completions',
      description: 'Get notified when your child completes a lesson',
      icon: BookOpen,
    },
    {
      key: 'streak_milestone' as const,
      label: 'Streak Milestones',
      description: 'Get notified when your child reaches a streak milestone',
      icon: Trophy,
    },
    {
      key: 'level_up' as const,
      label: 'Level Up',
      description: 'Get notified when your child advances to a new level',
      icon: TrendingUp,
    },
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Settings className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Notification Preferences
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          {prefItems.map((item) => (
            <div
              key={item.key}
              className="flex items-center justify-between rounded-xl border p-4"
            >
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                  <item.icon className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <Label htmlFor={item.key} className="text-sm font-medium cursor-pointer">
                    {item.label}
                  </Label>
                  <p className="text-xs text-muted-foreground">{item.description}</p>
                </div>
              </div>
              <Switch
                id={item.key}
                checked={prefs[item.key]}
                onCheckedChange={(val) => handleToggle(item.key, val)}
                disabled={saving}
              />
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

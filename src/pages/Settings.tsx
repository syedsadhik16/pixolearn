import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { BottomNav } from '@/components/layout/BottomNav';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  Settings as SettingsIcon, Moon, Sun, Bell, BellOff,
  ChevronRight, Shield, Info, ArrowLeft
} from 'lucide-react';

export default function Settings() {
  const { user, profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [darkMode, setDarkMode] = useState(() => {
    return document.documentElement.classList.contains('dark');
  });

  // Notification prefs (for parents)
  const [notifPrefs, setNotifPrefs] = useState({
    lesson_completed: true,
    streak_milestone: true,
    level_up: true,
  });
  const [prefsLoading, setPrefsLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth');
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user && profile?.role === 'parent') fetchNotifPrefs();
  }, [user, profile]);

  const fetchNotifPrefs = async () => {
    const { data } = await supabase
      .from('notification_preferences')
      .select('lesson_completed, streak_milestone, level_up')
      .eq('parent_id', user!.id)
      .maybeSingle();
    if (data) setNotifPrefs(data);
  };

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    if (newMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('pixo-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('pixo-theme', 'light');
    }
  };

  const updateNotifPref = async (key: keyof typeof notifPrefs, value: boolean) => {
    setNotifPrefs(prev => ({ ...prev, [key]: value }));
    setPrefsLoading(true);
    try {
      await supabase
        .from('notification_preferences')
        .update({ [key]: value })
        .eq('parent_id', user!.id);
      toast({ title: 'Preferences updated ✓' });
    } catch (e) {
      console.error('Update pref error:', e);
    } finally {
      setPrefsLoading(false);
    }
  };

  if (authLoading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground">Loading...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6 pb-24 max-w-lg">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate(-1)} className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-display font-bold">Settings</h1>
            <p className="text-sm text-muted-foreground">Customize your experience</p>
          </div>
        </div>

        <div className="space-y-3">
          {/* Appearance */}
          <div className="pixo-card !p-0 overflow-hidden">
            <div className="px-5 py-3 bg-muted/30 border-b border-border">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Appearance</h3>
            </div>
            <button
              onClick={toggleDarkMode}
              className="w-full flex items-center gap-4 px-5 py-4 hover:bg-muted/20 transition-colors"
            >
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center",
                darkMode ? "bg-accent/20" : "bg-primary/10"
              )}>
                {darkMode ? <Moon className="h-5 w-5 text-accent" /> : <Sun className="h-5 w-5 text-primary" />}
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-semibold">Dark Mode</p>
                <p className="text-xs text-muted-foreground">{darkMode ? 'Currently dark' : 'Currently light'}</p>
              </div>
              <Switch checked={darkMode} onCheckedChange={toggleDarkMode} />
            </button>
          </div>

          {/* Notifications (parents only) */}
          {profile?.role === 'parent' && (
            <div className="pixo-card !p-0 overflow-hidden">
              <div className="px-5 py-3 bg-muted/30 border-b border-border">
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Notifications</h3>
              </div>
              {[
                { key: 'lesson_completed' as const, label: 'Lesson Completed', desc: 'When your child finishes a lesson', icon: Bell },
                { key: 'streak_milestone' as const, label: 'Streak Milestones', desc: 'When streaks reach 3, 7, 14, 30 days', icon: Bell },
                { key: 'level_up' as const, label: 'Level Up', desc: 'When your child reaches a new level', icon: Bell },
              ].map(pref => (
                <div key={pref.key} className="flex items-center gap-4 px-5 py-4 border-b border-border last:border-0">
                  <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center">
                    {notifPrefs[pref.key] ? (
                      <pref.icon className="h-5 w-5 text-secondary" />
                    ) : (
                      <BellOff className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold">{pref.label}</p>
                    <p className="text-xs text-muted-foreground">{pref.desc}</p>
                  </div>
                  <Switch
                    checked={notifPrefs[pref.key]}
                    onCheckedChange={(v) => updateNotifPref(pref.key, v)}
                    disabled={prefsLoading}
                  />
                </div>
              ))}
            </div>
          )}

          {/* Account */}
          <div className="pixo-card !p-0 overflow-hidden">
            <div className="px-5 py-3 bg-muted/30 border-b border-border">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Account</h3>
            </div>
            <button
              onClick={() => navigate('/profile')}
              className="w-full flex items-center gap-4 px-5 py-4 hover:bg-muted/20 transition-colors border-b border-border"
            >
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-semibold">Profile</p>
                <p className="text-xs text-muted-foreground">{profile?.email}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>
            <div className="flex items-center gap-4 px-5 py-4">
              <div className="w-10 h-10 rounded-xl bg-muted/30 flex items-center justify-center">
                <Info className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-semibold">App Version</p>
                <p className="text-xs text-muted-foreground">PIXO v1.0.0</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <BottomNav />
    </Layout>
  );
}

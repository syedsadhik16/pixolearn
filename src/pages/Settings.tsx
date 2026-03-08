import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { BottomNav } from '@/components/layout/BottomNav';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  Moon, Sun, Bell, BellOff, ChevronRight, Shield, Info,
  ArrowLeft, User, Palette, Eye, Lock, Users, Settings2, Loader2, Save,
  CreditCard, Receipt, Crown
} from 'lucide-react';

interface PaymentRecord {
  id: string;
  razorpay_payment_id: string;
  plan_id: string;
  amount: number;
  currency: string;
  status: string;
  created_at: string;
}

export default function Settings() {
  const { user, profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [activeSection, setActiveSection] = useState('identity');
  const [darkMode, setDarkMode] = useState(() => document.documentElement.classList.contains('dark'));

  // Identity fields
  const [displayName, setDisplayName] = useState('');
  const [savingName, setSavingName] = useState(false);

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
    if (profile) setDisplayName(profile.full_name || '');
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
    document.documentElement.classList.toggle('dark', newMode);
    localStorage.setItem('pixo-theme', newMode ? 'dark' : 'light');
  };

  const updateNotifPref = async (key: keyof typeof notifPrefs, value: boolean) => {
    setNotifPrefs(prev => ({ ...prev, [key]: value }));
    setPrefsLoading(true);
    try {
      await supabase.from('notification_preferences').update({ [key]: value }).eq('parent_id', user!.id);
      toast({ title: 'Preferences updated ✓' });
    } catch (e) {
      console.error(e);
    } finally {
      setPrefsLoading(false);
    }
  };

  const saveName = async () => {
    if (!user || !displayName.trim()) return;
    setSavingName(true);
    try {
      await supabase.from('profiles').update({ full_name: displayName.trim() }).eq('id', user.id);
      toast({ title: 'Name updated ✓' });
    } catch (e) {
      console.error(e);
      toast({ title: 'Error', description: 'Failed to update name', variant: 'destructive' });
    } finally {
      setSavingName(false);
    }
  };

  const sections = [
    { id: 'identity', label: 'Identity', icon: User },
    { id: 'appearance', label: 'Visual Comfort', icon: Eye },
    ...(profile?.role === 'parent' ? [{ id: 'notifications', label: 'Notifications', icon: Bell }] : []),
    { id: 'security', label: 'Security', icon: Lock },
    ...(profile?.role === 'parent' ? [{ id: 'parent_mode', label: 'Parent Mode', icon: Users }] : []),
    { id: 'about', label: 'About', icon: Info },
  ];

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
      <div className="container mx-auto px-4 py-6 pb-24 max-w-3xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate(-1)} className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-display font-bold">Settings</h1>
            <p className="text-sm text-muted-foreground">Customize your PIXO experience</p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-6">
          {/* Side nav */}
          <div className="md:w-48 flex-shrink-0">
            <div className="flex md:flex-col gap-1 overflow-x-auto pb-2 md:pb-0">
              {sections.map(s => (
                <button
                  key={s.id}
                  onClick={() => setActiveSection(s.id)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors",
                    activeSection === s.id
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted"
                  )}
                >
                  <s.icon className="h-4 w-4" />
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 space-y-4">
            {/* Identity */}
            {activeSection === 'identity' && (
              <div className="pixo-card space-y-5 animate-fade-in">
                <h3 className="font-display font-bold text-lg flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" /> Identity
                </h3>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Display Name</label>
                  <div className="flex gap-2">
                    <Input
                      value={displayName}
                      onChange={e => setDisplayName(e.target.value)}
                      placeholder="Enter your name"
                    />
                    <Button size="sm" onClick={saveName} disabled={savingName}>
                      {savingName ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email</label>
                  <Input value={profile?.email || ''} disabled className="bg-muted" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Role</label>
                  <div className="px-3 py-2 bg-muted rounded-xl text-sm capitalize">{profile?.role}</div>
                </div>
                <Button variant="outline" size="sm" onClick={() => navigate('/profile')}>
                  View Full Profile <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            )}

            {/* Appearance / Visual Comfort */}
            {activeSection === 'appearance' && (
              <div className="pixo-card space-y-5 animate-fade-in">
                <h3 className="font-display font-bold text-lg flex items-center gap-2">
                  <Eye className="h-5 w-5 text-primary" /> Visual Comfort
                </h3>
                <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
                  <div className="flex items-center gap-3">
                    {darkMode ? <Moon className="h-5 w-5 text-accent" /> : <Sun className="h-5 w-5 text-primary" />}
                    <div>
                      <p className="text-sm font-semibold">Dark Mode</p>
                      <p className="text-xs text-muted-foreground">{darkMode ? 'Easier on the eyes at night' : 'Bright and cheerful'}</p>
                    </div>
                  </div>
                  <Switch checked={darkMode} onCheckedChange={toggleDarkMode} />
                </div>
                <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl opacity-60">
                  <div className="flex items-center gap-3">
                    <Palette className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-semibold">PIXO Style</p>
                      <p className="text-xs text-muted-foreground">Customize mascot style</p>
                    </div>
                  </div>
                  <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded-full">Coming Soon</span>
                </div>
              </div>
            )}

            {/* Notifications */}
            {activeSection === 'notifications' && profile?.role === 'parent' && (
              <div className="pixo-card space-y-4 animate-fade-in">
                <h3 className="font-display font-bold text-lg flex items-center gap-2">
                  <Bell className="h-5 w-5 text-primary" /> Notifications
                </h3>
                {[
                  { key: 'lesson_completed' as const, label: 'Lesson Completed', desc: 'When your child finishes a lesson' },
                  { key: 'streak_milestone' as const, label: 'Streak Milestones', desc: 'When streaks reach 3, 7, 14, 30 days' },
                  { key: 'level_up' as const, label: 'Level Up', desc: 'When your child reaches a new level' },
                ].map(pref => (
                  <div key={pref.key} className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
                    <div className="flex items-center gap-3">
                      {notifPrefs[pref.key] ? <Bell className="h-5 w-5 text-secondary" /> : <BellOff className="h-5 w-5 text-muted-foreground" />}
                      <div>
                        <p className="text-sm font-semibold">{pref.label}</p>
                        <p className="text-xs text-muted-foreground">{pref.desc}</p>
                      </div>
                    </div>
                    <Switch checked={notifPrefs[pref.key]} onCheckedChange={v => updateNotifPref(pref.key, v)} disabled={prefsLoading} />
                  </div>
                ))}
              </div>
            )}

            {/* Security */}
            {activeSection === 'security' && (
              <div className="pixo-card space-y-4 animate-fade-in">
                <h3 className="font-display font-bold text-lg flex items-center gap-2">
                  <Lock className="h-5 w-5 text-primary" /> Security
                </h3>
                <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
                  <div>
                    <p className="text-sm font-semibold">Change Password</p>
                    <p className="text-xs text-muted-foreground">Update your account password</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={async () => {
                    if (!profile?.email) return;
                    const { error } = await supabase.auth.resetPasswordForEmail(profile.email, {
                      redirectTo: `${window.location.origin}/auth`,
                    });
                    if (!error) toast({ title: 'Reset link sent!', description: 'Check your email to reset your password.' });
                  }}>
                    Send Reset Link
                  </Button>
                </div>
                <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
                  <div>
                    <p className="text-sm font-semibold">Subscription</p>
                    <p className="text-xs text-muted-foreground capitalize">{profile?.subscription_type} plan</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => navigate('/pricing')}>
                    Manage
                  </Button>
                </div>
              </div>
            )}

            {/* Parent Mode */}
            {activeSection === 'parent_mode' && profile?.role === 'parent' && (
              <div className="pixo-card space-y-4 animate-fade-in">
                <h3 className="font-display font-bold text-lg flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" /> Parent Mode
                </h3>
                <p className="text-sm text-muted-foreground">
                  Manage your linked children and access the Parent Mastery Hub.
                </p>
                <Button variant="gradient" onClick={() => navigate('/parent')}>
                  Open Parent Dashboard <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            )}

            {/* About */}
            {activeSection === 'about' && (
              <div className="pixo-card space-y-4 animate-fade-in">
                <h3 className="font-display font-bold text-lg flex items-center gap-2">
                  <Info className="h-5 w-5 text-primary" /> About PIXO
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between p-3 bg-muted/30 rounded-xl">
                    <span className="text-muted-foreground">Version</span>
                    <span className="font-semibold">1.0.0</span>
                  </div>
                  <div className="flex justify-between p-3 bg-muted/30 rounded-xl">
                    <span className="text-muted-foreground">Platform</span>
                    <span className="font-semibold">Web App</span>
                  </div>
                  <p className="text-muted-foreground text-xs pt-2">
                    PIXO is an English-confidence platform for children, combining structured curriculum with AI-powered speech practice and gamification.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <BottomNav />
    </Layout>
  );
}

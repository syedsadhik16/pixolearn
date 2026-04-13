import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { BottomNav } from '@/components/layout/BottomNav';
import { HamburgerMenu } from '@/components/layout/HamburgerMenu';
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
  CreditCard, Receipt, Crown, Volume2, Globe
} from 'lucide-react';
import { useSpeechSettings, getNamedVoices } from '@/hooks/useSpeechSettings';
import { PageBreadcrumb } from '@/components/shared/PageBreadcrumb';
import { SUPPORTED_LANGUAGES } from '@/components/shared/LanguageSelector';
import { useTranslation } from '@/hooks/useTranslation';
import type { LangCode } from '@/contexts/LanguageContext';

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
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [paymentsLoading, setPaymentsLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth');
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (profile) setDisplayName(profile.full_name || '');
    if (user && profile?.role === 'parent') fetchNotifPrefs();
    if (user) fetchPayments();
  }, [user, profile]);

  const fetchPayments = async () => {
    if (!user) return;
    setPaymentsLoading(true);
    try {
      const { data } = await supabase
        .from('payment_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      setPayments((data as any) || []);
    } catch (e) {
      console.error(e);
    } finally {
      setPaymentsLoading(false);
    }
  };

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

  const speechHook = useSpeechSettings();
  const [voices, setVoices] = useState<{ name: string; emoji: string; voiceURI: string | null }[]>([]);
  const { t, language: appLang, setLanguage: setAppLang } = useTranslation();

  useEffect(() => {
    const loadVoices = () => setVoices(getNamedVoices());
    loadVoices();
    window.speechSynthesis?.addEventListener('voiceschanged', loadVoices);
    return () => window.speechSynthesis?.removeEventListener('voiceschanged', loadVoices);
  }, []);

  const sections = [
    { id: 'identity', label: t('identity'), icon: User },
    { id: 'subscription', label: t('subscription'), icon: Crown },
    { id: 'appearance', label: t('visualComfort'), icon: Eye },
    { id: 'voice', label: t('voiceAudio'), icon: Volume2 },
    { id: 'language', label: t('language'), icon: Globe },
    ...(profile?.role === 'parent' ? [{ id: 'notifications', label: t('notifications'), icon: Bell }] : []),
    { id: 'security', label: t('security'), icon: Lock },
    ...(profile?.role === 'parent' ? [{ id: 'parent_mode', label: t('parentMode'), icon: Users }] : []),
    { id: 'about', label: t('about'), icon: Info },
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
        <PageBreadcrumb segments={[
          { label: 'Dashboard', href: profile?.role === 'parent' ? '/parent' : '/student' },
          { label: 'Settings' },
        ]} />
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate(-1)} className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-display font-bold">{t('settings')}</h1>
            <p className="text-sm text-muted-foreground">{t('customizeExperience')}</p>
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
                  <User className="h-5 w-5 text-primary" /> {t('identity')}
                </h3>
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t('displayName')}</label>
                  <div className="flex gap-2">
                    <Input
                      value={displayName}
                      onChange={e => setDisplayName(e.target.value)}
                      placeholder={t('enterName')}
                    />
                    <Button size="sm" onClick={saveName} disabled={savingName}>
                      {savingName ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t('email')}</label>
                  <Input value={profile?.email || ''} disabled className="bg-muted" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t('role')}</label>
                  <div className="px-3 py-2 bg-muted rounded-xl text-sm capitalize">{profile?.role}</div>
                </div>
                <Button variant="outline" size="sm" onClick={() => navigate('/profile')}>
                  {t('viewFullProfile')} <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            )}

            {/* Subscription & Payment History */}
            {activeSection === 'subscription' && (
              <div className="space-y-4 animate-fade-in">
                <div className="pixo-card space-y-4">
                  <h3 className="font-display font-bold text-lg flex items-center gap-2">
                    <Crown className="h-5 w-5 text-primary" /> Subscription
                  </h3>
                  <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        profile?.subscription_type === 'premium' ? 'gradient-bg' : 'bg-muted'
                      }`}>
                        <Crown className={`h-5 w-5 ${profile?.subscription_type === 'premium' ? 'text-white' : 'text-muted-foreground'}`} />
                      </div>
                      <div>
                        <p className="font-semibold capitalize">{profile?.subscription_type === 'premium' ? 'Premium Plan' : 'Free Plan'}</p>
                        <p className="text-xs text-muted-foreground">
                          {profile?.subscription_type === 'premium' ? 'All features unlocked' : 'Limited features'}
                        </p>
                      </div>
                    </div>
                    {profile?.subscription_type !== 'premium' && (
                      <Button variant="gradient" size="sm" onClick={() => navigate('/pricing')}>
                        Upgrade
                      </Button>
                    )}
                  </div>
                </div>

                <div className="pixo-card space-y-4">
                  <h3 className="font-display font-bold text-lg flex items-center gap-2">
                    <Receipt className="h-5 w-5 text-primary" /> Payment History
                  </h3>
                  {paymentsLoading ? (
                    <div className="text-center py-6">
                      <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
                    </div>
                  ) : payments.length === 0 ? (
                    <div className="text-center py-6">
                      <CreditCard className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">No payments yet</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {payments.map(p => (
                        <div key={p.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-xl">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-pixo-green/10 flex items-center justify-center">
                              <CreditCard className="h-4 w-4 text-pixo-green" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold capitalize">{p.plan_id} Plan</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(p.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold">₹{p.amount}</p>
                            <p className="text-xs text-pixo-green capitalize">{p.status}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
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

            {/* Voice & Audio */}
            {activeSection === 'voice' && (
              <div className="pixo-card space-y-5 animate-fade-in">
                <h3 className="font-display font-bold text-lg flex items-center gap-2">
                  <Volume2 className="h-5 w-5 text-primary" /> Voice & Audio
                </h3>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Speech Rate</label>
                  <div className="flex gap-2">
                    {[{ label: '0.75×', value: 0.75 }, { label: '1×', value: 1 }, { label: '1.25×', value: 1.25 }].map(r => (
                      <button
                        key={r.value}
                        onClick={() => speechHook.setRate(r.value)}
                        className={cn(
                          "px-4 py-2 rounded-xl text-sm font-semibold transition-colors",
                          speechHook.settings.rate === r.value
                            ? "bg-primary/10 text-primary border-2 border-primary"
                            : "bg-muted text-muted-foreground border-2 border-transparent hover:border-primary/30"
                        )}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">Controls how fast PIXO speaks during lessons</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Voice Character</label>
                  <div className="grid grid-cols-2 gap-2">
                    {voices.map(v => (
                      <button
                        key={v.name}
                        onClick={() => speechHook.setVoiceURI(v.voiceURI)}
                        className={cn(
                          "flex items-center gap-2 p-3 rounded-xl text-sm font-semibold transition-colors text-left",
                          speechHook.settings.voiceURI === v.voiceURI
                            ? "bg-primary/10 text-primary border-2 border-primary"
                            : "bg-muted text-muted-foreground border-2 border-transparent hover:border-primary/30"
                        )}
                      >
                        <span className="text-lg">{v.emoji}</span>
                        {v.name}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">Choose a narrator for lessons and instructions</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => speechHook.speak('Hello! I am your PIXO learning companion.')}
                >
                  <Volume2 className="h-4 w-4 mr-1" /> Preview Voice
                </Button>
              </div>
            )}

            {/* Language */}
            {activeSection === 'language' && (
              <div className="pixo-card space-y-5 animate-fade-in">
                <h3 className="font-display font-bold text-lg flex items-center gap-2">
                  <Globe className="h-5 w-5 text-primary" /> {t('appLanguage')}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {t('languageInterfaceNote')}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {SUPPORTED_LANGUAGES.map(lang => (
                    <button
                      key={lang.code}
                      onClick={() => { setAppLang(lang.code as LangCode); toast({ title: t('languageUpdated') }); }}
                      className={cn(
                        "flex items-center gap-2 p-3 rounded-xl text-sm font-semibold transition-colors text-left",
                        appLang === lang.code
                          ? "bg-primary/10 text-primary border-2 border-primary"
                          : "bg-muted text-muted-foreground border-2 border-transparent hover:border-primary/30"
                      )}
                    >
                      <span className="text-lg">{lang.flag}</span>
                      {lang.label}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  🌐 {t('changesApplyInstantly')}
                </p>
              </div>
            )}


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
      <HamburgerMenu />
      <BottomNav />
    </Layout>
  );
}

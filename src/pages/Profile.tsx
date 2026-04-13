import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { BottomNav } from '@/components/layout/BottomNav';
import { HamburgerMenu } from '@/components/layout/HamburgerMenu';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  User, Zap, Trophy, Calendar, Edit3, Save, LogOut,
  ShoppingBag, Star, Flame, Settings
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProfileAvatarSkeleton, StatCardSkeleton } from '@/components/shared/SkeletonLoaders';
import { Skeleton } from '@/components/ui/skeleton';
import { PageBreadcrumb } from '@/components/shared/PageBreadcrumb';
import { toast } from 'sonner';

interface EquippedItem {
  item_id: string;
  is_equipped: boolean;
  name: string;
  icon: string;
  category: string;
}

interface BadgeInfo {
  name: string;
  icon: string;
  earned_at: string;
}

export default function Profile() {
  const { user, profile, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState('');
  const [saving, setSaving] = useState(false);
  const [xpData, setXpData] = useState({ total_xp: 0, xp_level: 1 });
  const [equippedItems, setEquippedItems] = useState<EquippedItem[]>([]);
  const [allPurchased, setAllPurchased] = useState<EquippedItem[]>([]);
  const [badges, setBadges] = useState<BadgeInfo[]>([]);
  const [stats, setStats] = useState({ lessons: 0, streak: 0, words: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth');
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      setFullName(profile?.full_name || '');
      fetchProfileData();
    }
  }, [user, profile]);

  const fetchProfileData = async () => {
    try {
      const [xpRes, purchasedRes, badgesRes, completionsRes, wordsRes, attendanceRes] = await Promise.all([
        supabase.from('student_xp').select('total_xp, xp_level').eq('student_id', user!.id).maybeSingle(),
        supabase.from('purchased_items').select('item_id, is_equipped, shop_items(name, icon, category)').eq('student_id', user!.id),
        supabase.from('student_badges').select('earned_at, badges(name, icon)').eq('student_id', user!.id).order('earned_at', { ascending: false }),
        supabase.from('lesson_completions').select('id').eq('student_id', user!.id),
        supabase.from('saved_words').select('id').eq('student_id', user!.id),
        supabase.from('attendance').select('date, lesson_completed').eq('student_id', user!.id).eq('is_present', true).order('date', { ascending: false }),
      ]);

      if (xpRes.data) setXpData(xpRes.data);

      if (purchasedRes.data) {
        const items = (purchasedRes.data as any[]).map(p => ({
          item_id: p.item_id,
          is_equipped: p.is_equipped,
          name: p.shop_items?.name || '',
          icon: p.shop_items?.icon || '🎁',
          category: p.shop_items?.category || 'avatar',
        }));
        setAllPurchased(items);
        setEquippedItems(items.filter(i => i.is_equipped));
      }

      if (badgesRes.data) {
        setBadges((badgesRes.data as any[]).map(b => ({
          name: b.badges?.name || '',
          icon: b.badges?.icon || '🏆',
          earned_at: b.earned_at,
        })));
      }

      // Calculate streak
      let streak = 0;
      const attendance = attendanceRes.data || [];
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      for (let i = 0; i < attendance.length; i++) {
        const d = new Date(attendance[i].date);
        d.setHours(0, 0, 0, 0);
        const expected = new Date(today);
        expected.setDate(expected.getDate() - i);
        if (d.getTime() === expected.getTime() && attendance[i].lesson_completed) {
          streak++;
        } else break;
      }

      setStats({
        lessons: completionsRes.data?.length || 0,
        streak,
        words: wordsRes.data?.length || 0,
      });
    } catch (e) {
      console.error('Profile fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await supabase.from('profiles').update({ full_name: fullName }).eq('id', user.id);
      toast({ title: 'Profile updated! ✨' });
      setEditing(false);
    } catch (e) {
      toast({ title: 'Update failed', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const toggleEquip = async (itemId: string, currentlyEquipped: boolean) => {
    if (!user) return;
    await supabase.from('purchased_items')
      .update({ is_equipped: !currentlyEquipped })
      .eq('student_id', user.id)
      .eq('item_id', itemId);
    fetchProfileData();
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const xpForNextLevel = (level: number) => Math.round(level * 20);
  const currentLevelXP = xpForNextLevel(xpData.xp_level - 1);
  const nextLevelXP = xpForNextLevel(xpData.xp_level);
  const progressToNext = nextLevelXP > currentLevelXP
    ? Math.min(100, ((xpData.total_xp - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100)
    : 100;

  if (authLoading || loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-6 pb-24">
          <ProfileAvatarSkeleton />
          <div className="pixo-card mb-6 p-6">
            <div className="flex items-center gap-4">
              <Skeleton className="h-14 w-14 rounded-xl" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-2.5 w-full rounded-full" />
                <Skeleton className="h-3 w-28" />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 mb-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="pixo-card text-center !p-4">
                <Skeleton className="h-5 w-5 rounded mx-auto mb-2" />
                <Skeleton className="h-5 w-8 mx-auto mb-1" />
                <Skeleton className="h-3 w-12 mx-auto" />
              </div>
            ))}
          </div>
        </div>
        <HamburgerMenu />
        <BottomNav />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6 pb-24">
        <PageBreadcrumb segments={[
          { label: 'Dashboard', href: '/student' },
          { label: 'Profile' },
        ]} />
        {/* Avatar & Name */}
        <div className="text-center mb-6 animate-fade-in">
          <div className="relative inline-block mb-4">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 border-4 border-primary/30 flex items-center justify-center mx-auto">
              {equippedItems.find(i => i.category === 'avatar') ? (
                <span className="text-5xl">{equippedItems.find(i => i.category === 'avatar')!.icon}</span>
              ) : (
                <User className="h-10 w-10 text-primary" />
              )}
            </div>
            {/* Equipped emote badge */}
            {equippedItems.find(i => i.category === 'emote') && (
              <span className="absolute -bottom-1 -right-1 text-2xl animate-bounce-gentle">
                {equippedItems.find(i => i.category === 'emote')!.icon}
              </span>
            )}
          </div>

          {editing ? (
            <div className="flex items-center gap-2 justify-center max-w-xs mx-auto">
              <Input
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="Your name"
                className="text-center"
              />
              <Button size="icon" onClick={handleSave} disabled={saving}>
                <Save className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2 justify-center">
              <h1 className="text-2xl font-display font-bold">
                {profile?.full_name || 'Learner'}
              </h1>
              <button onClick={() => setEditing(true)} className="text-muted-foreground hover:text-primary transition-colors">
                <Edit3 className="h-4 w-4" />
              </button>
            </div>
          )}

          <p className="text-sm text-muted-foreground mt-1">{profile?.email}</p>

          {/* Equipped theme badge */}
          {equippedItems.find(i => i.category === 'theme') && (
            <div className="inline-flex items-center gap-1 mt-2 px-3 py-1 rounded-full bg-accent/10 text-accent-foreground text-xs font-medium">
              {equippedItems.find(i => i.category === 'theme')!.icon}
              {equippedItems.find(i => i.category === 'theme')!.name}
            </div>
          )}
        </div>

        {/* XP Level Card */}
        <div className="pixo-card bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20 mb-6 animate-slide-up">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center">
              <Zap className="h-7 w-7 text-primary" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h3 className="font-display font-bold text-lg">Level {xpData.xp_level}</h3>
                <span className="text-sm font-semibold text-primary">{xpData.total_xp.toLocaleString()} XP</span>
              </div>
              <Progress value={progressToNext} className="h-2.5 mt-1" />
              <p className="text-xs text-muted-foreground mt-1">
                {Math.max(0, nextLevelXP - xpData.total_xp)} XP to Level {Math.min(180, xpData.xp_level + 1)}
              </p>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <div className="pixo-card text-center !p-4">
            <Trophy className="h-5 w-5 text-accent mx-auto mb-1" />
            <p className="text-lg font-bold">{stats.lessons}</p>
            <p className="text-[10px] text-muted-foreground">Lessons</p>
          </div>
          <div className="pixo-card text-center !p-4">
            <Flame className="h-5 w-5 text-primary mx-auto mb-1" />
            <p className="text-lg font-bold">{stats.streak}</p>
            <p className="text-[10px] text-muted-foreground">Day Streak</p>
          </div>
          <div className="pixo-card text-center !p-4">
            <Star className="h-5 w-5 text-pixo-yellow mx-auto mb-1" />
            <p className="text-lg font-bold">{stats.words}</p>
            <p className="text-[10px] text-muted-foreground">Words</p>
          </div>
        </div>

        {/* Tabs: Items & Badges */}
        <Tabs defaultValue="items" className="w-full animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="items" className="gap-1.5">
              <ShoppingBag className="h-4 w-4" />
              My Items ({allPurchased.length})
            </TabsTrigger>
            <TabsTrigger value="badges" className="gap-1.5">
              <Trophy className="h-4 w-4" />
              Badges ({badges.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="items">
            {allPurchased.length === 0 ? (
              <div className="text-center py-10">
                <ShoppingBag className="h-10 w-10 mx-auto text-muted-foreground/30 mb-2" />
                <p className="text-sm text-muted-foreground">No items yet</p>
                <Button variant="outline" size="sm" className="mt-3" onClick={() => navigate('/shop')}>
                  Visit Shop
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {allPurchased.map(item => (
                  <button
                    key={item.item_id}
                    onClick={() => toggleEquip(item.item_id, item.is_equipped)}
                    className={cn(
                      "flex flex-col items-center p-3 rounded-xl border transition-all text-center",
                      item.is_equipped
                        ? "bg-primary/10 border-primary/40 ring-2 ring-primary/20"
                        : "bg-card border-border hover:border-primary/30"
                    )}
                  >
                    <span className="text-3xl mb-1">{item.icon}</span>
                    <p className="text-[10px] font-medium truncate w-full">{item.name}</p>
                    {item.is_equipped && (
                      <span className="text-[9px] text-primary font-bold mt-0.5">EQUIPPED</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="badges">
            {badges.length === 0 ? (
              <div className="text-center py-10">
                <Trophy className="h-10 w-10 mx-auto text-muted-foreground/30 mb-2" />
                <p className="text-sm text-muted-foreground">No badges earned yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                {badges.map((badge, i) => (
                  <div
                    key={i}
                    className="flex flex-col items-center p-2 rounded-xl bg-accent/10 border border-accent/30 text-center"
                    title={badge.name}
                  >
                    <span className="text-2xl mb-1">{badge.icon}</span>
                    <p className="text-[10px] font-medium truncate w-full">{badge.name}</p>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Actions */}
        <div className="mt-8 flex items-center justify-center gap-3">
          <Button variant="outline" onClick={() => navigate('/settings')}>
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
          <Button variant="outline" onClick={handleSignOut} className="text-destructive border-destructive/30 hover:bg-destructive/10">
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </div>
      <HamburgerMenu />
      <BottomNav />
    </Layout>
  );
}

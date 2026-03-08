import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { BottomNav } from '@/components/layout/BottomNav';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { ShoppingBag, Zap, Check, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';

interface ShopItem {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  xp_cost: number;
}

interface PurchasedItem {
  item_id: string;
  is_equipped: boolean;
}

export default function Shop() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [items, setItems] = useState<ShopItem[]>([]);
  const [purchased, setPurchased] = useState<PurchasedItem[]>([]);
  const [xp, setXP] = useState(0);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth');
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) fetchShopData();
  }, [user]);

  const fetchShopData = async () => {
    try {
      const [itemsRes, purchasedRes, xpRes] = await Promise.all([
        supabase.from('shop_items').select('*').eq('is_available', true).order('xp_cost'),
        supabase.from('purchased_items').select('item_id, is_equipped').eq('student_id', user!.id),
        supabase.from('student_xp').select('total_xp').eq('student_id', user!.id).maybeSingle(),
      ]);
      if (itemsRes.data) setItems(itemsRes.data as ShopItem[]);
      if (purchasedRes.data) setPurchased(purchasedRes.data as PurchasedItem[]);
      if (xpRes.data) setXP(xpRes.data.total_xp);
    } catch (e) {
      console.error('Shop fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  const purchaseItem = async (item: ShopItem) => {
    if (!user || xp < item.xp_cost) return;
    setBuying(item.id);
    try {
      // Deduct XP
      const newXP = xp - item.xp_cost;
      await supabase.from('student_xp').update({ total_xp: newXP }).eq('student_id', user.id);

      // Record purchase
      await supabase.from('purchased_items').insert({
        student_id: user.id,
        item_id: item.id,
      });

      // Log XP spend
      await supabase.from('xp_history').insert({
        student_id: user.id,
        xp_amount: -item.xp_cost,
        source: 'shop_purchase',
        source_id: item.id,
      });

      setXP(newXP);
      setPurchased(prev => [...prev, { item_id: item.id, is_equipped: false }]);
      toast({ title: `${item.icon} ${item.name} unlocked!`, description: `You spent ${item.xp_cost} XP` });
    } catch (e) {
      console.error('Purchase error:', e);
      toast({ title: 'Purchase failed', variant: 'destructive' });
    } finally {
      setBuying(null);
    }
  };

  const toggleEquip = async (itemId: string, currentlyEquipped: boolean) => {
    if (!user) return;
    try {
      await supabase.from('purchased_items')
        .update({ is_equipped: !currentlyEquipped })
        .eq('student_id', user.id)
        .eq('item_id', itemId);

      setPurchased(prev =>
        prev.map(p => p.item_id === itemId ? { ...p, is_equipped: !currentlyEquipped } : p)
      );
    } catch (e) {
      console.error('Equip error:', e);
    }
  };

  const purchasedIds = new Set(purchased.map(p => p.item_id));
  const categories = [
    { key: 'avatar', label: 'Avatars', icon: '😎' },
    { key: 'theme', label: 'Themes', icon: '🎨' },
    { key: 'emote', label: 'Emotes', icon: '✨' },
  ];

  if (authLoading || loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground">Loading shop...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6 pb-24">
        {/* Header */}
        <div className="mb-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-accent/20 flex items-center justify-center mx-auto mb-3">
            <ShoppingBag className="h-8 w-8 text-accent" />
          </div>
          <h1 className="text-2xl font-display font-bold">
            <span className="gradient-text">Rewards Shop</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Spend your XP on cool items!</p>
          <div className="inline-flex items-center gap-1.5 mt-3 px-4 py-2 rounded-full bg-primary/10 text-primary font-bold text-lg">
            <Zap className="h-5 w-5" />
            {xp.toLocaleString()} XP
          </div>
        </div>

        <Tabs defaultValue="avatar" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            {categories.map(cat => (
              <TabsTrigger key={cat.key} value={cat.key} className="gap-1.5 text-xs">
                <span>{cat.icon}</span>
                {cat.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {categories.map(cat => (
            <TabsContent key={cat.key} value={cat.key}>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {items.filter(i => i.category === cat.key).map(item => {
                  const owned = purchasedIds.has(item.id);
                  const canAfford = xp >= item.xp_cost;
                  const equipped = purchased.find(p => p.item_id === item.id)?.is_equipped ?? false;

                  return (
                    <div
                      key={item.id}
                      className={cn(
                        "flex flex-col items-center p-4 rounded-2xl border transition-all text-center",
                        owned ? "bg-secondary/10 border-secondary/30" : canAfford ? "bg-card border-border hover:border-primary/40 hover:shadow-md" : "bg-muted/30 border-border opacity-60"
                      )}
                    >
                      <span className="text-4xl mb-2">{item.icon}</span>
                      <p className="text-sm font-bold mb-1">{item.name}</p>
                      <p className="text-[10px] text-muted-foreground mb-3 line-clamp-2">{item.description}</p>

                      {owned ? (
                        <Button
                          size="sm"
                          variant={equipped ? "default" : "outline"}
                          className="w-full h-8 text-xs"
                          onClick={() => toggleEquip(item.id, equipped)}
                        >
                          {equipped ? <><Check className="h-3 w-3 mr-1" />Equipped</> : 'Equip'}
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="gradient"
                          className="w-full h-8 text-xs"
                          disabled={!canAfford || buying === item.id}
                          onClick={() => purchaseItem(item)}
                        >
                          {buying === item.id ? (
                            <Sparkles className="h-3 w-3 animate-spin" />
                          ) : (
                            <><Zap className="h-3 w-3 mr-1" />{item.xp_cost} XP</>
                          )}
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
      <BottomNav />
    </Layout>
  );
}

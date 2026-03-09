import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { Heart, Bell, Target, Eye } from 'lucide-react';

interface Props { userId: string; }

export function ParentEngagementScore({ userId }: Props) {
  const [metrics, setMetrics] = useState({ notificationsRead: 0, totalNotifications: 0, goalsSet: 0, hasPreferences: false });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEngagement();
  }, [userId]);

  const fetchEngagement = async () => {
    try {
      const [notifRes, goalsRes, prefsRes] = await Promise.all([
        supabase.from('notifications').select('is_read').eq('parent_id', userId),
        supabase.from('parent_goals').select('id').eq('parent_id', userId),
        supabase.from('notification_preferences').select('id').eq('parent_id', userId),
      ]);

      const notifications = notifRes.data || [];
      setMetrics({
        notificationsRead: notifications.filter(n => n.is_read).length,
        totalNotifications: notifications.length,
        goalsSet: (goalsRes.data || []).length,
        hasPreferences: (prefsRes.data || []).length > 0,
      });
    } catch (e) {
      console.error('Engagement fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Card><CardContent className="p-8 text-center"><div className="animate-pulse">Loading...</div></CardContent></Card>;
  }

  const readRate = metrics.totalNotifications > 0 ? Math.round((metrics.notificationsRead / metrics.totalNotifications) * 100) : 0;
  const goalsScore = Math.min(100, metrics.goalsSet * 25);
  const prefsScore = metrics.hasPreferences ? 100 : 0;
  const engagementScore = Math.round((readRate * 0.4) + (goalsScore * 0.35) + (prefsScore * 0.25));

  const level = engagementScore >= 75 ? 'Highly Engaged' : engagementScore >= 50 ? 'Moderately Engaged' : engagementScore >= 25 ? 'Getting Started' : 'Just Joined';

  const items = [
    { label: 'Notifications Read', value: readRate, icon: Bell, detail: `${metrics.notificationsRead}/${metrics.totalNotifications}` },
    { label: 'Goals Set', value: goalsScore, icon: Target, detail: `${metrics.goalsSet} goal(s)` },
    { label: 'Preferences Configured', value: prefsScore, icon: Eye, detail: metrics.hasPreferences ? 'Configured' : 'Not set' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Heart className="h-6 w-6 text-primary" />
        <h2 className="text-xl font-bold">Parent Engagement Score</h2>
      </div>

      <Card className="border-2 border-primary/20">
        <CardContent className="p-6 text-center">
          <div className="text-5xl font-bold mb-2">{engagementScore}%</div>
          <div className="text-lg font-medium text-primary">{level}</div>
          <p className="text-sm text-muted-foreground mt-2">Your involvement impacts your child's learning success</p>
          <Progress value={engagementScore} className="mt-4 h-3" />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {items.map(item => (
          <Card key={item.label}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <item.icon className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">{item.label}</span>
              </div>
              <Progress value={item.value} className="mb-2" />
              <span className="text-xs text-muted-foreground">{item.detail}</span>
            </CardContent>
          </Card>
        ))}
      </div>

      {engagementScore < 75 && (
        <Card>
          <CardHeader><CardTitle className="text-sm">💡 Tips to Increase Engagement</CardTitle></CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-1">
            {readRate < 80 && <p>• Check and read notifications regularly</p>}
            {goalsScore < 100 && <p>• Set daily learning goals for your child in Parent Controls</p>}
            {!metrics.hasPreferences && <p>• Configure your notification preferences</p>}
            <p>• Review the weekly report every Monday</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

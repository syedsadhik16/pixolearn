import { NotificationPreferences } from '@/components/shared/NotificationPreferences';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell, Settings2 } from 'lucide-react';

interface Props { userId: string; }

export function ParentNotifications({ userId }: Props) {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-display font-bold">Notifications 🔔</h2>
        <p className="text-sm text-muted-foreground">Manage your alerts and notification preferences</p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2"><Settings2 className="h-5 w-5 text-primary" />Notification Preferences</CardTitle>
        </CardHeader>
        <CardContent>
          <NotificationPreferences userId={userId} />
        </CardContent>
      </Card>
    </div>
  );
}

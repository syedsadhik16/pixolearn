import { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw, Check } from 'lucide-react';

type SyncState = 'online' | 'offline' | 'syncing' | 'synced';

export function SyncStatus() {
  const [status, setStatus] = useState<SyncState>(navigator.onLine ? 'online' : 'offline');
  const [lastSynced, setLastSynced] = useState<Date | null>(null);

  useEffect(() => {
    const goOnline = () => {
      setStatus('syncing');
      // Simulate sync completion
      setTimeout(() => {
        setStatus('synced');
        setLastSynced(new Date());
        setTimeout(() => setStatus('online'), 2000);
      }, 1500);
    };
    const goOffline = () => setStatus('offline');

    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);

    // Set initial synced time
    if (navigator.onLine) {
      setLastSynced(new Date());
    }

    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  const config = {
    online: { icon: Wifi, label: 'Online', className: 'text-emerald-500' },
    offline: { icon: WifiOff, label: 'Offline', className: 'text-destructive' },
    syncing: { icon: RefreshCw, label: 'Syncing...', className: 'text-amber-500 animate-spin' },
    synced: { icon: Check, label: 'Synced', className: 'text-emerald-500' },
  };

  const current = config[status];
  const Icon = current.icon;

  return (
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground" title={lastSynced ? `Last synced: ${lastSynced.toLocaleTimeString()}` : 'Not synced yet'}>
      <Icon className={`h-3.5 w-3.5 ${current.className}`} />
      <span className="hidden sm:inline">{current.label}</span>
      {status === 'offline' && (
        <span className="px-1.5 py-0.5 bg-destructive/10 text-destructive rounded-full text-[10px] font-semibold">
          Offline Mode
        </span>
      )}
    </div>
  );
}

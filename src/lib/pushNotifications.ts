/**
 * Register service worker and request push notification permission.
 * Returns the subscription object if successful.
 */
export async function requestPushPermission(): Promise<PushSubscription | null> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.warn('Push notifications not supported');
    return null;
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return null;

  const registration = await navigator.serviceWorker.register('/sw.js');
  await navigator.serviceWorker.ready;

  // For browser-only notifications we don't need a VAPID key
  // We'll use the Notification API directly for simplicity
  return registration.pushManager.getSubscription();
}

/**
 * Show a browser notification directly (no push server needed).
 */
export function showLocalNotification(title: string, body: string, url?: string) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;

  const notification = new Notification(title, {
    body,
    icon: '/favicon.ico',
  });

  if (url) {
    notification.onclick = () => {
      window.focus();
      window.location.href = url;
    };
  }
}

/**
 * Check if notifications are enabled.
 */
export function isNotificationEnabled(): boolean {
  return 'Notification' in window && Notification.permission === 'granted';
}

/**
 * Check if notifications are supported.
 */
export function isNotificationSupported(): boolean {
  return 'Notification' in window;
}

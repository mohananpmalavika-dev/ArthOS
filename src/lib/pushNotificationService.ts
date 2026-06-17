/**
 * Push Notification Service
 * 
 * Enables system-level push notifications via Web Push API,
 * with graceful fallback to in-app notifications.
 * 
 * Integration:
 * - Requires service worker at /service-worker.js
 * - Requires notification permission from user
 * - Stores subscriptions on server via /api/subscriptions endpoint
 */

export interface PushSubscriptionData {
  endpoint: string;
  auth: string;        // Base64-encoded shared secret
  p256dh: string;      // Base64-encoded public key
  userAgent: string;   // Browser fingerprint
  createdAt: number;
  lastUsedAt: number;
}

export interface NotificationPayload {
  title: string;
  body: string;
  tag: string;         // For deduplication
  badge?: string;      // Icon URL
  icon?: string;       // Notification icon
  image?: string;      // Large image URL
  actions?: NotificationAction[];
  data?: {
    url?: string;      // Deep link on click
    actionId?: string;
    userId?: string;
    eventId?: string;
  };
  silent?: boolean;    // Silent notification
}

export interface NotificationAction {
  action: string;
  title: string;
  icon?: string;
}

interface InAppNotification {
  id: string;
  payload: NotificationPayload;
  timestamp: number;
  dismissable: boolean;
}

class PushNotificationService {
  private static instance: PushNotificationService;
  private serviceWorkerReady: boolean = false;
  private notificationClickHandlers: Set<(data: any) => void> = new Set();
  private notificationCloseHandlers: Set<(data: any) => void> = new Set();
  private inAppNotifications: Map<string, InAppNotification> = new Map();

  private constructor() {
    this.initializeServiceWorker();
    this.setupMessageListener();
  }

  /**
   * Get or create singleton instance
   */
  static getInstance(): PushNotificationService {
    if (!PushNotificationService.instance) {
      PushNotificationService.instance = new PushNotificationService();
    }
    return PushNotificationService.instance;
  }

  /**
   * Initialize service worker registration
   */
  private async initializeServiceWorker(): Promise<void> {
    if (!('serviceWorker' in navigator)) {
      console.warn('Service Worker not supported');
      return;
    }

    try {
      const registration = await navigator.serviceWorker.register('/service-worker.js', {
        scope: '/',
        type: 'module'
      });
      console.info('Service Worker registered', { scope: registration.scope });
      this.serviceWorkerReady = true;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  }

  /**
   * Setup message listener for notification clicks from service worker
   */
  private setupMessageListener(): void {
    if (!('serviceWorker' in navigator)) return;

    navigator.serviceWorker.addEventListener('message', (event) => {
      const { type, data } = event.data;

      if (type === 'NOTIFICATION_CLICK') {
        for (const handler of this.notificationClickHandlers) {
          try {
            handler(data);
          } catch (error) {
            console.error('Notification click handler error:', error);
          }
        }
      }

      if (type === 'NOTIFICATION_CLOSE') {
        for (const handler of this.notificationCloseHandlers) {
          try {
            handler(data);
          } catch (error) {
            console.error('Notification close handler error:', error);
          }
        }
      }
    });
  }

  /**
   * Request notification permission + register for push
   * @returns Subscription endpoint data or null if denied
   */
  async enablePushNotifications(): Promise<PushSubscriptionData | null> {
    // Check browser support
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      console.warn('Push notifications not supported');
      return null;
    }

    // Request permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.info('Notification permission denied by user');
      return null;
    }

    try {
      // Ensure service worker is ready
      const registration = await navigator.serviceWorker.ready;

      // Get or create push subscription
      let subscription = await registration.pushManager.getSubscription();

      if (!subscription) {
        // For demo purposes, use a dummy server key
        // In production, use your actual VAPID public key
        const vapidPublicKey =
          import.meta.env.VITE_VAPID_PUBLIC_KEY || 'dummy_key_for_testing';

        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: this.urlBase64ToUint8Array(vapidPublicKey) as BufferSource
        });
      }

      // Convert subscription to sendable format
      const subscriptionData: PushSubscriptionData = {
        endpoint: subscription.endpoint,
        auth: this.arrayBufferToBase64(subscription.getKey('auth') || new ArrayBuffer(0)),
        p256dh: this.arrayBufferToBase64(subscription.getKey('p256dh') || new ArrayBuffer(0)),
        userAgent: navigator.userAgent,
        createdAt: Date.now(),
        lastUsedAt: Date.now()
      };

      // Send to server for storage
      await this.sendSubscriptionToServer(subscriptionData);

      console.info('Push notification enabled', { endpoint: subscriptionData.endpoint });
      return subscriptionData;
    } catch (error) {
      console.error('Failed to enable push notifications:', error);
      return null;
    }
  }

  /**
   * Disable push notifications and unsubscribe
   */
  async disablePushNotifications(): Promise<void> {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await subscription.unsubscribe();
        console.info('Push notification disabled');
      }
    } catch (error) {
      console.error('Failed to disable push notifications:', error);
    }
  }

  /**
   * Check if push notifications are enabled
   */
  isPushEnabled(): boolean {
    return Notification.permission === 'granted' && this.serviceWorkerReady;
  }

  /**
   * Show in-app notification (fallback for when push fails)
   */
  showInAppNotification(payload: NotificationPayload): void {
    const id = `in-app-${Date.now()}-${Math.random()}`;

    const notification: InAppNotification = {
      id,
      payload,
      timestamp: Date.now(),
      dismissable: true
    };

    this.inAppNotifications.set(id, notification);

    // Dispatch event that UI components can listen to
    window.dispatchEvent(
      new CustomEvent('arth:inapp-notification', {
        detail: notification
      })
    );

    // Auto-dismiss after 5 seconds (unless persistent)
    if (!payload.silent) {
      setTimeout(() => {
        this.dismissInAppNotification(id);
      }, 5000);
    }
  }

  /**
   * Dismiss in-app notification
   */
  dismissInAppNotification(id: string): void {
    this.inAppNotifications.delete(id);

    window.dispatchEvent(
      new CustomEvent('arth:inapp-notification-dismiss', {
        detail: { id }
      })
    );
  }

  /**
   * Get all active in-app notifications
   */
  getInAppNotifications(): InAppNotification[] {
    return Array.from(this.inAppNotifications.values());
  }

  /**
   * Register handler for notification click
   */
  onNotificationClick(handler: (data: NotificationPayload['data']) => void): () => void {
    this.notificationClickHandlers.add(handler);

    // Return unsubscribe function
    return () => {
      this.notificationClickHandlers.delete(handler);
    };
  }

  /**
   * Register handler for notification close
   */
  onNotificationClose(handler: (data: NotificationPayload['data']) => void): () => void {
    this.notificationCloseHandlers.add(handler);

    return () => {
      this.notificationCloseHandlers.delete(handler);
    };
  }

  /**
   * Health check status
   */
  getHealthStatus(): {
    isSupported: boolean;
    permissionStatus: 'granted' | 'denied' | 'default';
    isSubscribed: boolean;
    serviceWorkerReady: boolean;
  } {
    return {
      isSupported: 'Notification' in window,
      permissionStatus: (Notification.permission as any) || 'default',
      isSubscribed: this.isPushEnabled(),
      serviceWorkerReady: this.serviceWorkerReady
    };
  }

  /**
   * Send subscription to server for storage
   */
  private async sendSubscriptionToServer(data: PushSubscriptionData): Promise<void> {
    try {
      const response = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      console.info('Subscription sent to server');
    } catch (error) {
      console.error('Failed to send subscription to server:', error);
      throw error;
    }
  }

  /**
   * Convert URL-safe base64 to Uint8Array (for VAPID key)
   */
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }

    return outputArray;
  }

  /**
   * Convert ArrayBuffer to base64 string
   */
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }
}

// Global singleton getter
export function getPushNotificationService(): PushNotificationService {
  return PushNotificationService.getInstance();
}

// Export for testing
export default PushNotificationService;

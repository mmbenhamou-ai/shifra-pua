'use client';

import { Bell, BellOff } from 'lucide-react';
import { useState, useEffect } from 'react';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export default function PushNotificationManager() {
  const [isSupported, setIsSupported] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true);
      checkSubscription();
    }
  }, []);

  async function checkSubscription() {
    try {
      const registration = await navigator.serviceWorker.ready;
      const sub = await registration.pushManager.getSubscription();
      setSubscription(sub);
    } catch (err) {
      console.error(err);
    }
  }

  async function subscribeToPush() {
    setLoading(true);
    setMessage('');
    try {
      const registration = await navigator.serviceWorker.ready;

      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidKey) {
        throw new Error('VAPID public key is missing');
      }

      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });

      setSubscription(sub);

      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ subscription: sub }),
      });

      setMessage('התראות הופעלו בהצלחה V');
    } catch (error) {
      console.error('Failed to subscribe:', error);
      setMessage('X שגיאה בהפעלת התראות');
    } finally {
      setLoading(false);
    }
  }

  async function unsubscribeFromPush() {
    setLoading(true);
    setMessage('');
    try {
      const sub = await navigator.serviceWorker.ready.then(reg => reg.pushManager.getSubscription());
      if (sub) {
        await sub.unsubscribe();
        setSubscription(null);
        // Note: we could also tell the server to delete it, but it's okay to keep an obsolete record 
        // until we try sending and get a 410 Gone error.
        setMessage('התראות כובו');
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  if (!isSupported) {
    return (
      <p className="text-xs text-zinc-500 mt-2">
        דפדפן זה אינו תומך בהתראות חמות
      </p>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-[#91006A]/10 px-4 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-[0_4px_14px_rgba(129,20,83,0.05)]">
      <div>
        <div className="flex items-center gap-2">
          <div className="size-8 rounded-full bg-[#91006A]/10 text-[#91006A] flex items-center justify-center">
            {subscription ? <Bell className="w-5 h-5 mx-auto" /> : <BellOff className="w-5 h-5 mx-auto" />}
          </div>
          <span className="font-semibold text-[#403728]">התראות מיידיות (Push)</span>
        </div>
        <p className="text-xs text-zinc-500 mr-10 mt-1">קבלו התראות ישירות למסך גם כשהאפליקציה סגורה</p>
      </div>

      <div className="flex flex-col items-end gap-1 w-full sm:w-auto mt-2 sm:mt-0">
        {subscription ? (
          <button
            onClick={unsubscribeFromPush}
            disabled={loading}
            className="w-full sm:w-auto px-4 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-semibold border border-red-100 disabled:opacity-50"
          >
            {loading ? 'מכבה...' : 'כיבוי התראות'}
          </button>
        ) : (
          <button
            onClick={subscribeToPush}
            disabled={loading}
            className="w-full sm:w-auto px-4 py-2 bg-[#91006A] text-white rounded-lg text-sm font-bold shadow-md shadow-[#91006A]/20 active:scale-95 transition-all disabled:opacity-50"
          >
            {loading ? 'מפעיל...' : 'הפעיל התראות'}
          </button>
        )}
        {message && <span className="text-[10px] text-[#91006A] font-medium animate-pulse">{message}</span>}
      </div>
    </div>
  );
}

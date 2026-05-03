import { AuthUser, PushPreferences } from '../types';

/**
 * SALAire Push Engine
 * Gère l'enregistrement FCM et les permissions.
 */

export const requestPushPermission = async (): Promise<boolean> => {
  if (!('Notification' in window)) {
    console.warn("Ce navigateur ne supporte pas les notifications.");
    return false;
  }

  // Permission must be requested following a user interaction in some browsers
  try {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  } catch (e) {
    console.error("Error requesting notification permission:", e);
    return false;
  }
};

export const registerDeviceToken = async (user: AuthUser): Promise<string | null> => {
  try {
    if (!('serviceWorker' in navigator)) {
      console.warn("Service workers not supported.");
      return null;
    }

    // Attempt to wait for service worker with a timeout
    const registration = await Promise.race([
      navigator.serviceWorker.ready,
      new Promise<void>((_, reject) => setTimeout(() => reject(new Error("Timeout waiting for Service Worker")), 3000))
    ]) as ServiceWorkerRegistration | undefined;
    
    if (!registration) {
      console.warn("No active service worker registration found.");
      return null;
    }
    
    // Simulation d'obtention de token FCM
    // En production : const token = await getToken(messaging, { vapidKey: '...' });
    const mockToken = `fcm_token_${Math.random().toString(36).substr(2, 9)}`;
    
    // Sauvegarde du token en local pour simulation
    const tokens = JSON.parse(localStorage.getItem('salaire_push_tokens') || '{}');
    tokens[user.id] = mockToken;
    localStorage.setItem('salaire_push_tokens', JSON.stringify(tokens));

    console.log("Device registered with token:", mockToken);
    return mockToken;
  } catch (error) {
    console.warn("Failed to register device for push (ignoring for non-PWA environments):", error);
    return null;
  }
};

export const sendPushNotification = async (
  userId: string, 
  payload: { title: string, body: string, type: keyof PushPreferences }
) => {
  try {
    const userStr = localStorage.getItem('salaire_user');
    if (!userStr) return;
    const user: AuthUser = JSON.parse(userStr);

    // Vérification des préférences
    // Added comment: pushPreferences property is now safely accessed on AuthUser
    const prefs = user.pushPreferences || { attendance: true, approvals: true, fraud: true, sync: true };
    if (!prefs[payload.type]) return;

    const tokens = JSON.parse(localStorage.getItem('salaire_push_tokens') || '{}');
    const token = tokens[userId];

    if (!token) {
      console.debug("No push token found for user", userId);
      return;
    }

    // Simulation d'appel API Backend -> FCM
    console.log(`[PUSH SENT to ${token}] ${payload.title}: ${payload.body}`);

    // Si l'onglet est ouvert, on peut aussi l'afficher manuellement (facultatif car géré par SW)
    if ('Notification' in window && Notification.permission === 'granted' && document.visibilityState === 'hidden') {
      new Notification(payload.title, {
        body: payload.body,
        icon: '/logo.png',
        // Fix: Explicitly cast keyof PushPreferences to string for the Notification tag requirement
        tag: String(payload.type)
      });
    }
  } catch (e) {
    console.error("Error sending push notification:", e);
  }
};

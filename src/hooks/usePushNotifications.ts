import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";

const VAPID_PUBLIC_KEY = "BL2VblPtl_j6G-102tcg3Z2S1C9nTut51iPuvvTGDfFISHheWWJdk5h8BjUkYCZkg3jnR6fnmlOIWZYhxTxj2Sk";

interface PushNotificationState {
  isSupported: boolean;
  permission: NotificationPermission | "unknown";
  isSubscribed: boolean;
  isLoading: boolean;
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function usePushNotifications() {
  const { user } = useAuth();
  const [state, setState] = useState<PushNotificationState>({
    isSupported: false,
    permission: "unknown",
    isSubscribed: false,
    isLoading: true,
  });

  // Check support and current status
  useEffect(() => {
    const checkStatus = async () => {
      const isSupported = "serviceWorker" in navigator && "PushManager" in window;
      
      if (!isSupported) {
        setState({
          isSupported: false,
          permission: "unknown",
          isSubscribed: false,
          isLoading: false,
        });
        return;
      }

      const permission = Notification.permission;
      let isSubscribed = false;

      if (permission === "granted" && user) {
        try {
          const registration = await navigator.serviceWorker.ready;
          const subscription = await registration.pushManager.getSubscription();
          
          if (subscription) {
            // Check if this subscription exists in our database
            const { data } = await supabase
              .from("push_subscriptions")
              .select("id")
              .eq("user_id", user.id)
              .eq("endpoint", subscription.endpoint)
              .maybeSingle();
            
            isSubscribed = !!data;
          }
        } catch (error) {
          console.error("Error checking subscription:", error);
        }
      }

      setState({
        isSupported,
        permission,
        isSubscribed,
        isLoading: false,
      });
    };

    checkStatus();
  }, [user]);

  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!state.isSupported || !user) return false;

    setState(prev => ({ ...prev, isLoading: true }));

    try {
      // Request permission
      const permission = await Notification.requestPermission();
      
      if (permission !== "granted") {
        setState(prev => ({
          ...prev,
          permission,
          isLoading: false,
        }));
        return false;
      }

      // Get service worker registration
      const registration = await navigator.serviceWorker.ready;

      // Subscribe to push
      const applicationServerKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey as BufferSource,
      });

      // Extract keys
      const subscriptionJson = subscription.toJSON();
      const p256dh = subscriptionJson.keys?.p256dh || "";
      const auth = subscriptionJson.keys?.auth || "";

      // Save to database
      const { error } = await supabase.from("push_subscriptions").upsert(
        {
          user_id: user.id,
          endpoint: subscription.endpoint,
          p256dh,
          auth,
        },
        { onConflict: "user_id,endpoint" }
      );

      if (error) {
        console.error("Error saving subscription:", error);
        throw error;
      }

      setState({
        isSupported: true,
        permission: "granted",
        isSubscribed: true,
        isLoading: false,
      });

      return true;
    } catch (error) {
      console.error("Error subscribing to push:", error);
      setState(prev => ({ ...prev, isLoading: false }));
      return false;
    }
  }, [state.isSupported, user]);

  const unsubscribe = useCallback(async (): Promise<boolean> => {
    if (!user) return false;

    setState(prev => ({ ...prev, isLoading: true }));

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await subscription.unsubscribe();

        // Remove from database
        await supabase
          .from("push_subscriptions")
          .delete()
          .eq("user_id", user.id)
          .eq("endpoint", subscription.endpoint);
      }

      setState(prev => ({
        ...prev,
        isSubscribed: false,
        isLoading: false,
      }));

      return true;
    } catch (error) {
      console.error("Error unsubscribing:", error);
      setState(prev => ({ ...prev, isLoading: false }));
      return false;
    }
  }, [user]);

  return {
    ...state,
    subscribe,
    unsubscribe,
  };
}

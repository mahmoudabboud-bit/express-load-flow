import { useState, useEffect } from "react";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { Button } from "@/components/ui/button";
import { Bell, X } from "lucide-react";
import { cn } from "@/lib/utils";

const PROMPT_DISMISSED_KEY = "push-notification-prompt-dismissed";

export function PushNotificationPrompt() {
  const { isSupported, permission, isSubscribed, isLoading, subscribe } = usePushNotifications();
  const [dismissed, setDismissed] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    // Check if user has previously dismissed or if already subscribed
    const wasDismissed = localStorage.getItem(PROMPT_DISMISSED_KEY);
    if (!wasDismissed && !isSubscribed && permission !== "denied") {
      // Delay showing prompt to avoid overwhelming user on first load
      const timer = setTimeout(() => setDismissed(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isSubscribed, permission]);

  const handleEnable = async () => {
    setIsAnimating(true);
    const success = await subscribe();
    if (success) {
      setDismissed(true);
    }
    setIsAnimating(false);
  };

  const handleDismiss = () => {
    localStorage.setItem(PROMPT_DISMISSED_KEY, "true");
    setDismissed(true);
  };

  // Don't show if not supported, already subscribed, permission denied, or dismissed
  if (!isSupported || isSubscribed || permission === "denied" || dismissed || isLoading) {
    return null;
  }

  return (
    <div
      className={cn(
        "fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50",
        "bg-card border border-border rounded-lg shadow-lg p-4",
        "animate-in slide-in-from-bottom-5 duration-300"
      )}
    >
      <button
        onClick={handleDismiss}
        className="absolute top-2 right-2 text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Dismiss"
      >
        <X size={18} />
      </button>

      <div className="flex gap-3">
        <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
          <Bell className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground text-sm">
            Enable Push Notifications
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            Get instant alerts when your shipment status changes, even when the app is closed.
          </p>
          <div className="flex gap-2 mt-3">
            <Button
              size="sm"
              onClick={handleEnable}
              disabled={isAnimating}
              className="text-xs"
            >
              {isAnimating ? "Enabling..." : "Enable"}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleDismiss}
              className="text-xs"
            >
              Not Now
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

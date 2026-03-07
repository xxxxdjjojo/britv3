"use client";

import { useState, useEffect } from "react";
import { getVapidPublicKey } from "@/lib/push";

type PermissionState = "granted" | "denied" | "default" | "unsupported";

type PushManagerProps = Readonly<{
  className?: string;
}>;

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

export function PushManager({ className }: PushManagerProps) {
  const [permissionState, setPermissionState] =
    useState<PermissionState>("default");
  const [isLoading, setIsLoading] = useState(false);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    const supported =
      "PushManager" in window &&
      "serviceWorker" in navigator &&
      "Notification" in window;
    setIsSupported(supported);

    if (supported) {
      setPermissionState(
        Notification.permission as PermissionState,
      );
    } else {
      setPermissionState("unsupported");
    }
  }, []);

  const handleEnable = async () => {
    if (!isSupported) return;
    setIsLoading(true);

    try {
      const permission = await Notification.requestPermission();
      setPermissionState(permission as PermissionState);

      if (permission !== "granted") {
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      const vapidPublicKey = getVapidPublicKey();

      if (!vapidPublicKey) {
        throw new Error("VAPID public key not configured");
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey).buffer as ArrayBuffer,
      });

      const { endpoint, keys } = subscription.toJSON() as {
        endpoint: string;
        keys?: { p256dh?: string; auth?: string };
      };

      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint,
          keys: {
            p256dh: keys?.p256dh ?? "",
            auth: keys?.auth ?? "",
          },
          userAgent: navigator.userAgent,
        }),
      });
    } catch {
      // Permission may already be determined or subscription failed -- ignore
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisable = async () => {
    if (!isSupported) return;
    setIsLoading(true);

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await fetch("/api/push/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        });

        await subscription.unsubscribe();
      }

      setPermissionState("default");
    } catch {
      // Ignore cleanup errors
    } finally {
      setIsLoading(false);
    }
  };

  if (!isSupported || permissionState === "unsupported") {
    return null;
  }

  return (
    <div className={className}>
      {permissionState === "granted" && (
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-foreground">
              Push Notifications
            </p>
            <p className="text-xs text-muted-foreground">
              You will receive property alerts and updates
            </p>
          </div>
          <button
            onClick={handleDisable}
            disabled={isLoading}
            className="text-sm text-destructive hover:underline disabled:opacity-50"
          >
            {isLoading ? "Disabling..." : "Disable"}
          </button>
        </div>
      )}

      {permissionState === "default" && (
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-foreground">
              Push Notifications
            </p>
            <p className="text-xs text-muted-foreground">
              Get notified about saved properties and messages
            </p>
          </div>
          <button
            onClick={handleEnable}
            disabled={isLoading}
            className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {isLoading ? "Enabling..." : "Enable notifications"}
          </button>
        </div>
      )}

      {permissionState === "denied" && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Notifications blocked in browser settings</span>
        </div>
      )}
    </div>
  );
}

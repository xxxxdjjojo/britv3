"use client";

import { useEffect, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const VISIT_COUNT_KEY = "britestate_visit_count";

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const isStandalone = window.matchMedia(
      "(display-mode: standalone)",
    ).matches;
    if (isStandalone) return;

    const count = parseInt(localStorage.getItem(VISIT_COUNT_KEY) ?? "0", 10);
    const nextCount = count + 1;
    localStorage.setItem(VISIT_COUNT_KEY, String(nextCount));

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      if (nextCount >= 2) {
        setShowBanner(true);
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted" || outcome === "dismissed") {
      setShowBanner(false);
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#005F73] text-white shadow-lg">
      <div className="flex items-center justify-between px-4 py-3">
        <div>
          <p className="text-sm font-semibold">Install Britestate</p>
          <p className="text-xs opacity-80">
            Add to your home screen for quick access
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleInstall}
            className="rounded bg-white px-3 py-1.5 text-sm font-semibold text-[#005F73] hover:bg-opacity-90"
          >
            Install
          </button>
          <button
            onClick={handleDismiss}
            className="rounded px-2 py-1.5 text-sm opacity-80 hover:opacity-100"
            aria-label="Dismiss install prompt"
          >
            &times;
          </button>
        </div>
      </div>
    </div>
  );
}

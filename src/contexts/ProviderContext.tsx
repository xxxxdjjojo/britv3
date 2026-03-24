"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { toast } from "sonner";

export type ProviderError = {
  id: string;
  message: string;
  severity: "warning" | "error";
  timestamp: string;
};

export type ProviderInitialData = {
  providerId: string;
  userId: string;
  businessName: string;
  stripeAccountId: string | null;
  chargesEnabled: boolean;
};

type ProviderContextValue = {
  providerId: string;
  userId: string;
  businessName: string;
  stripeAccountId: string | null;
  chargesEnabled: boolean;
  errors: ProviderError[];
  addError: (message: string, severity: "warning" | "error") => void;
  clearErrors: () => void;
};

const ProviderContext = createContext<ProviderContextValue | null>(null);

export function ProviderProvider({
  initialData,
  children,
}: {
  initialData: ProviderInitialData;
  children: ReactNode;
}) {
  const [errors, setErrors] = useState<ProviderError[]>([]);

  function addError(message: string, severity: "warning" | "error") {
    const error: ProviderError = {
      id: crypto.randomUUID(),
      message,
      severity,
      timestamp: new Date().toISOString(),
    };
    setErrors((prev) => [...prev, error]);
    if (severity === "error") {
      toast.error(message);
    } else {
      toast.warning(message);
    }
  }

  function clearErrors() {
    setErrors([]);
  }

  return (
    <ProviderContext.Provider
      value={{
        providerId: initialData.providerId,
        userId: initialData.userId,
        businessName: initialData.businessName,
        stripeAccountId: initialData.stripeAccountId,
        chargesEnabled: initialData.chargesEnabled,
        errors,
        addError,
        clearErrors,
      }}
    >
      {children}
    </ProviderContext.Provider>
  );
}

export function useProvider(): ProviderContextValue {
  const context = useContext(ProviderContext);
  if (!context) {
    throw new Error("useProvider must be used within a ProviderProvider");
  }
  return context;
}

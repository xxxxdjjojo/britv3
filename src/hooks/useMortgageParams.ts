"use client";

import { useState, useCallback } from "react";
import type { MortgageParams } from "@/types/calculators";

const STORAGE_KEY = "britestate_mortgage_params";

type UseMortgageParamsReturn = {
  params: MortgageParams | null;
  saveParams: (params: MortgageParams) => void;
  clearParams: () => void;
  hasParams: boolean;
};

function readFromStorage(): MortgageParams | null {
  try {
    if (typeof window === "undefined") return null;
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (
      typeof parsed.deposit === "number" &&
      typeof parsed.interestRate === "number" &&
      typeof parsed.termYears === "number"
    ) {
      return parsed as MortgageParams;
    }
    return null;
  } catch {
    return null;
  }
}

export function useMortgageParams(): UseMortgageParamsReturn {
  const [params, setParams] = useState<MortgageParams | null>(readFromStorage);

  const saveParams = useCallback((newParams: MortgageParams) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newParams));
    } catch {
      // localStorage unavailable (incognito / full storage)
    }
    setParams(newParams);
  }, []);

  const clearParams = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // localStorage unavailable
    }
    setParams(null);
  }, []);

  return {
    params,
    saveParams,
    clearParams,
    hasParams: params !== null,
  };
}

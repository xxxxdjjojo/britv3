"use client";

import { useState, useEffect } from "react";

const STORAGE_KEY = "britestate_compare";
const MAX_COMPARE = 3;

function readStorage(): string[] {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
    if (Array.isArray(stored)) return stored.slice(0, MAX_COMPARE);
    return [];
  } catch {
    return [];
  }
}

export function useCompare() {
  const [ids, setIds] = useState<string[]>([]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate compare ids from localStorage on mount
    setIds(readStorage());
  }, []);

  function add(id: string) {
    const current = readStorage();
    if (current.length >= MAX_COMPARE || current.includes(id)) return;
    const next = [...current, id];
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setIds(next);
    } catch {
      // Storage full or unavailable — don't update state
    }
  }

  function remove(id: string) {
    const current = readStorage();
    const next = current.filter((x) => x !== id);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setIds(next);
    } catch {
      // Storage full or unavailable — don't update state
    }
  }

  function has(id: string): boolean {
    return ids.includes(id);
  }

  function clearAll() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
      setIds([]);
    } catch {
      // Storage unavailable
    }
  }

  return {
    ids,
    add,
    remove,
    count: ids.length,
    isFull: ids.length >= MAX_COMPARE,
    has,
    clearAll,
  };
}

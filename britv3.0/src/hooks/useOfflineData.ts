"use client";

import { useEffect } from "react";

const DB_NAME = "britestate-offline";
const STORE_NAME = "cache";
const DB_VERSION = 1;

const PRESET_LIMITS: Record<string, number> = {
  saved_properties: 50,
  recent_views: 20,
  appointments: 50,
};

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "key" });
      }
    };

    request.onsuccess = (event) => {
      resolve((event.target as IDBOpenDBRequest).result);
    };

    request.onerror = (event) => {
      reject((event.target as IDBOpenDBRequest).error);
    };
  });
}

export async function getOfflineData<T>(key: string): Promise<T[] | null> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const request = store.get(key);

      request.onsuccess = () => {
        const result = request.result as
          | { key: string; data: T[]; timestamp: number }
          | undefined;
        resolve(result?.data ?? null);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  } catch {
    return null;
  }
}

async function saveOfflineData<T>(
  key: string,
  data: T[],
  maxItems: number,
): Promise<void> {
  try {
    const db = await openDatabase();
    const trimmed = data.slice(0, maxItems);

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const request = store.put({
        key,
        data: trimmed,
        timestamp: Date.now(),
      });

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch {
    // Silently ignore write failures (storage quota, private browsing, etc.)
  }
}

export function useOfflineData<T>(
  key: string,
  data: T[] | null,
  maxItems?: number,
): void {
  const limit = maxItems ?? PRESET_LIMITS[key] ?? 50;

  useEffect(() => {
    if (!data || data.length === 0) return;
    if (typeof indexedDB === "undefined") return;

    void saveOfflineData(key, data, limit);
  }, [key, data, limit]);
}

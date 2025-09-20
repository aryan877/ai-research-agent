"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "research-user-id";

const generateFallbackId = () =>
  "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (char) => {
    const random = Math.random() * 16;
    const value = char === "x" ? random : (random & 0x3) | 0x8;
    return Math.floor(value).toString(16);
  });

/**
 * Persists a stable user id in localStorage so history can be scoped per browser.
 */
export function useUserId(): string | null {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const existingId = window.localStorage.getItem(STORAGE_KEY);
    if (existingId) {
      setUserId(existingId);
      return;
    }

    const generatedId =
      typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : generateFallbackId();

    window.localStorage.setItem(STORAGE_KEY, generatedId);
    setUserId(generatedId);
  }, []);

  return userId;
}

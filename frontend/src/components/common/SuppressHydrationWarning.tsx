"use client";

import { useEffect } from "react";

export function SuppressHydrationWarning() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;

    const originalError = console.error;
    console.error = (...args: unknown[]) => {
      const msg = typeof args[0] === "string" ? args[0] : "";
      if (
        msg.includes("Hydration failed") ||
        msg.includes("There was an error while hydrating") ||
        msg.includes("Hydration mismatch")
      ) {
        return;
      }
      originalError.apply(console, args);
    };

    return () => {
      console.error = originalError;
    };
  }, []);

  return null;
}

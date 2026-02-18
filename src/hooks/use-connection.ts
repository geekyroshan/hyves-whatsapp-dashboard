"use client";

import { useEffect, useState } from "react";
import { getCurrentUser } from "@/lib/api";

export function useConnection() {
  const [connected, setConnected] = useState<boolean | null>(null); // null = loading

  useEffect(() => {
    let mounted = true;
    const check = async () => {
      try {
        const user = await getCurrentUser();
        if (mounted) setConnected(user.connected);
      } catch {
        if (mounted) setConnected(false);
      }
    };
    check();
    const interval = setInterval(check, 15000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  return { connected, loading: connected === null };
}

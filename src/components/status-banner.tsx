"use client";

import { useEffect, useState } from "react";
import { getSession } from "@/lib/api";
import { Wifi, WifiOff, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function StatusBanner() {
  const [status, setStatus] = useState<string>("loading");
  const [phone, setPhone] = useState<string>("");

  useEffect(() => {
    const check = async () => {
      try {
        const data = await getSession();
        setStatus(String(data.status || "UNKNOWN"));
        if (data.me && typeof data.me === "object") {
          const me = data.me as Record<string, string>;
          setPhone(me.id?.split("@")[0] || "");
        }
      } catch {
        setStatus("DISCONNECTED");
      }
    };
    check();
    const interval = setInterval(check, 15000);
    return () => clearInterval(interval);
  }, []);

  const isConnected = status === "WORKING";
  const isLoading = status === "loading";

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium",
        isLoading && "bg-muted text-muted-foreground",
        isConnected && "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
        !isConnected && !isLoading && "bg-destructive/10 text-destructive"
      )}
    >
      {isLoading ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : isConnected ? (
        <Wifi className="h-3 w-3" />
      ) : (
        <WifiOff className="h-3 w-3" />
      )}
      <span>
        {isLoading
          ? "Checking..."
          : isConnected
          ? `Connected${phone ? ` (+${phone})` : ""}`
          : status === "SCAN_QR_CODE"
          ? "Waiting for QR scan"
          : "Disconnected"}
      </span>
    </div>
  );
}

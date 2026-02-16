"use client";

import { useEffect, useState, useCallback } from "react";
import { getSession, startSession, restartSession, fetchQrCode } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Wifi,
  WifiOff,
  QrCode,
  RefreshCw,
  Play,
  Loader2,
  Smartphone,
} from "lucide-react";
import { toast } from "sonner";

export default function SessionPage() {
  const [session, setSession] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [qrLoading, setQrLoading] = useState(false);

  const loadSession = useCallback(async () => {
    try {
      const data = await getSession();
      setSession(data);
      return data;
    } catch {
      setSession({ status: "NOT_FOUND" });
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  // Auto-poll when waiting for QR scan
  useEffect(() => {
    if (session?.status !== "SCAN_QR_CODE") return;
    const interval = setInterval(async () => {
      const data = await loadSession();
      if (data?.status === "WORKING") {
        toast.success("WhatsApp connected successfully!");
        setQrUrl(null);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [session?.status, loadSession]);

  const handleStart = async () => {
    setActionLoading(true);
    try {
      await startSession();
      toast.success("Session started — loading QR code...");
      await loadSession();
      await loadQr();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to start session");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRestart = async () => {
    setActionLoading(true);
    setQrUrl(null);
    try {
      await restartSession();
      toast.success("Session restarted — loading QR code...");
      // Wait for session to be ready
      await new Promise((r) => setTimeout(r, 3000));
      await loadSession();
      await loadQr();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to restart session");
    } finally {
      setActionLoading(false);
    }
  };

  const loadQr = async () => {
    setQrLoading(true);
    try {
      const url = await fetchQrCode();
      setQrUrl(url);
    } catch {
      toast.error("Failed to load QR code. Session may not be ready yet.");
    } finally {
      setQrLoading(false);
    }
  };

  const refreshQr = async () => {
    if (qrUrl) URL.revokeObjectURL(qrUrl);
    await loadQr();
  };

  const status = String(session?.status || "UNKNOWN");
  const isConnected = status === "WORKING";
  const isWaitingQr = status === "SCAN_QR_CODE";
  const phone = session?.me
    ? (session.me as Record<string, string>)?.id?.split("@")[0]
    : null;

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Session</h2>
          <p className="text-muted-foreground">Manage your WhatsApp connection</p>
        </div>
        <Skeleton className="h-48 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Session</h2>
        <p className="text-muted-foreground">Manage your WhatsApp connection</p>
      </div>

      {/* Status Card */}
      <Card
        className={
          isConnected
            ? "border-emerald-500/30 bg-emerald-500/5"
            : "border-border"
        }
      >
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Connection Status</CardTitle>
            <Badge
              variant={isConnected ? "default" : isWaitingQr ? "secondary" : "destructive"}
            >
              {status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            {isConnected ? (
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10">
                <Wifi className="h-7 w-7 text-emerald-500" />
              </div>
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                <WifiOff className="h-7 w-7 text-muted-foreground" />
              </div>
            )}
            <div>
              <p className="text-lg font-semibold">
                {isConnected
                  ? `Connected${phone ? ` as +${phone}` : ""}`
                  : isWaitingQr
                  ? "Waiting for QR code scan"
                  : status === "NOT_FOUND"
                  ? "No session exists"
                  : "Disconnected"}
              </p>
              <p className="text-sm text-muted-foreground">
                {isConnected
                  ? "WhatsApp is linked and scraping messages"
                  : isWaitingQr
                  ? "Open WhatsApp on your phone and scan the QR code below"
                  : "Start a session and scan the QR code to begin"}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            {!isConnected && !isWaitingQr && (
              <Button onClick={handleStart} disabled={actionLoading}>
                {actionLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Play className="h-4 w-4 mr-2" />
                )}
                Start Session
              </Button>
            )}
            {(isConnected || isWaitingQr) && (
              <Button
                variant="outline"
                onClick={handleRestart}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Restart Session
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* QR Code Section */}
      {isWaitingQr && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <QrCode className="h-5 w-5" />
                Scan QR Code
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={refreshQr}>
                <RefreshCw className="h-4 w-4 mr-1" />
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center gap-6 md:flex-row md:items-start">
              {/* QR Code */}
              <div className="flex flex-col items-center gap-3">
                {qrLoading ? (
                  <div className="flex h-64 w-64 items-center justify-center rounded-xl border-2 border-dashed border-border">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : qrUrl ? (
                  <img
                    src={qrUrl}
                    alt="WhatsApp QR Code"
                    className="h-64 w-64 rounded-xl border bg-white p-2"
                  />
                ) : (
                  <div className="flex h-64 w-64 flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border">
                    <QrCode className="h-10 w-10 text-muted-foreground" />
                    <Button variant="outline" size="sm" onClick={loadQr}>
                      Load QR Code
                    </Button>
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  QR code expires quickly — click Refresh if it doesn&apos;t work
                </p>
              </div>

              {/* Instructions */}
              <div className="space-y-4 flex-1">
                <h3 className="font-semibold flex items-center gap-2">
                  <Smartphone className="h-4 w-4" />
                  How to connect
                </h3>
                <ol className="space-y-3 text-sm text-muted-foreground">
                  <li className="flex gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                      1
                    </span>
                    <span>
                      Open <strong className="text-foreground">WhatsApp</strong> on your
                      phone
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                      2
                    </span>
                    <span>
                      Go to{" "}
                      <strong className="text-foreground">
                        Settings &rarr; Linked Devices
                      </strong>
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                      3
                    </span>
                    <span>
                      Tap{" "}
                      <strong className="text-foreground">Link a Device</strong>
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                      4
                    </span>
                    <span>
                      Point your phone camera at the QR code on the left
                    </span>
                  </li>
                </ol>
                <p className="text-xs text-muted-foreground border-t pt-3">
                  Once connected, the page will automatically update. Group messages
                  will start appearing in the Messages tab.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

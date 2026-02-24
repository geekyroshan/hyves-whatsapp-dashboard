"use client";

import { useEffect, useState } from "react";
import { getStats, getHealth, getSession } from "@/lib/api";
import type { Stats } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { RequestAccessCard } from "@/components/request-access";
import {
  MessageSquare,
  Users,
  Filter,
  Activity,
  Wifi,
  WifiOff,
  CheckCircle,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [health, setHealth] = useState<{
    status?: string;
    circuit_breakers?: Record<string, string>;
  } | null>(null);
  const [session, setSession] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  const [statsError, setStatsError] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        // Load session and health first (fast), then stats (may be slow on first load)
        const [h, sess] = await Promise.all([
          getHealth().catch(() => null),
          getSession().catch(() => null),
        ]);
        setHealth(h);
        setSession(sess);
        setLoading(false);

        // Stats may take longer on cold start (reads from Google Sheets)
        try {
          const s = await getStats();
          setStats(s);
          setStatsError(false);
        } catch {
          setStatsError(true);
        }
      } catch {
        setLoading(false);
      }
    }
    load();
  }, []);

  const isConnected = session?.status === "WORKING";
  const phone = session?.me
    ? (session.me as Record<string, string>)?.id?.split("@")[0]
    : null;

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">Overview of your WhatsApp scrapper</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">Overview of your WhatsApp scrapper</p>
      </div>

      {/* Connection Status Card */}
      <Card
        className={
          isConnected
            ? "border-emerald-500/30 bg-emerald-500/5"
            : "border-destructive/30 bg-destructive/5"
        }
      >
        <CardContent className="flex items-center gap-4 pt-6">
          {isConnected ? (
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10">
              <Wifi className="h-6 w-6 text-emerald-500" />
            </div>
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <WifiOff className="h-6 w-6 text-destructive" />
            </div>
          )}
          <div>
            <p className="text-sm font-medium text-muted-foreground">WhatsApp Status</p>
            <p className="text-lg font-semibold">
              {isConnected
                ? `Connected${phone ? ` as +${phone}` : ""}`
                : session?.status === "SCAN_QR_CODE"
                ? "Waiting for QR Code scan"
                : "Disconnected"}
            </p>
          </div>
          <Badge variant={isConnected ? "default" : "destructive"} className="ml-auto">
            {String(session?.status || "UNKNOWN")}
          </Badge>
        </CardContent>
      </Card>

      {/* Google Sheet Access Card */}
      <RequestAccessCard connected={isConnected} />

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Messages
            </CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {stats === null && !statsError ? (
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            ) : (
              <div className="text-3xl font-bold">{stats?.total_messages ?? 0}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Contacts
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {stats === null && !statsError ? (
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            ) : (
              <div className="text-3xl font-bold">{stats?.total_contacts ?? 0}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Groups Scraped
            </CardTitle>
            <Filter className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {stats === null && !statsError ? (
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            ) : (
              <>
                <div className="text-3xl font-bold">{stats?.total_groups ?? 0}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Filter: {stats?.filter_mode ?? "unknown"}
                  {stats?.active_filter_groups
                    ? ` (${stats.active_filter_groups} active)`
                    : ""}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Queue Status
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {stats === null && !statsError ? (
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            ) : (
              <>
                <div className="text-3xl font-bold">{stats?.queue_depth ?? 0}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats?.queue_completed ?? 0} processed, {stats?.queue_failed ?? 0} failed
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Retry button if stats failed */}
      {statsError && (
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <AlertTriangle className="h-4 w-4 text-yellow-500" />
          <span>Stats loading slowly (large dataset). </span>
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              setStatsError(false);
              try {
                const s = await getStats();
                setStats(s);
              } catch {
                setStatsError(true);
              }
            }}
          >
            <RefreshCw className="h-3.5 w-3.5 mr-1" />
            Retry
          </Button>
        </div>
      )}

      {/* Health Status */}
      {health && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">System Health</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="flex items-center gap-3">
                <HealthIcon status={health.status ?? "unknown"} />
                <div>
                  <p className="text-sm font-medium">Scrapper</p>
                  <p className="text-xs text-muted-foreground">
                    {health.status ?? "unknown"}
                  </p>
                </div>
              </div>
              {health.circuit_breakers &&
                Object.entries(health.circuit_breakers).map(([name, state]) => (
                  <div key={name} className="flex items-center gap-3">
                    <HealthIcon status={state === "closed" ? "healthy" : state} />
                    <div>
                      <p className="text-sm font-medium capitalize">{name} Circuit</p>
                      <p className="text-xs text-muted-foreground">{state}</p>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function HealthIcon({ status }: { status: string }) {
  if (status === "healthy" || status === "closed") {
    return <CheckCircle className="h-5 w-5 text-emerald-500" />;
  }
  if (status === "half_open") {
    return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
  }
  return <XCircle className="h-5 w-5 text-destructive" />;
}

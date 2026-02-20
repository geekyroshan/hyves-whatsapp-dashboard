"use client";

import { useEffect, useState } from "react";
import { getAccessStatus, requestSheetAccess } from "@/lib/api";
import type { AccessStatus } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FileSpreadsheet, ExternalLink, Loader2, CheckCircle } from "lucide-react";
import { toast } from "sonner";

export function RequestAccessCard({ connected }: { connected: boolean }) {
  const [accessStatus, setAccessStatus] = useState<AccessStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    if (!connected) {
      setLoading(false);
      return;
    }
    getAccessStatus()
      .then(setAccessStatus)
      .catch(() => null)
      .finally(() => setLoading(false));
  }, [connected]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setSubmitting(true);
    try {
      const result = await requestSheetAccess(email.trim());
      toast.success(result.message);
      setAccessStatus({
        has_access: true,
        spreadsheet_url: result.spreadsheet_url,
        email: result.email,
        created_at: result.created_at,
      });
      setDialogOpen(false);
      setEmail("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to request access");
    } finally {
      setSubmitting(false);
    }
  };

  if (!connected) return null;
  if (loading) return null;

  // Already has access - show the link
  if (accessStatus?.has_access) {
    return (
      <Card className="border-blue-500/30 bg-blue-500/5">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Google Sheet Access
          </CardTitle>
          <CheckCircle className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <FileSpreadsheet className="h-8 w-8 text-blue-500 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate">
                Shared to {accessStatus.email}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Your Messages, Contacts & Group Members sheets
              </p>
            </div>
            <a
              href={accessStatus.spreadsheet_url!}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="outline" size="sm" className="gap-1.5 shrink-0">
                <ExternalLink className="h-3.5 w-3.5" />
                Open Sheet
              </Button>
            </a>
          </div>
          <div className="mt-3 pt-3 border-t border-border">
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="text-xs text-muted-foreground">
                  Change email or re-share
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Update Sheet Access</DialogTitle>
                  <DialogDescription>
                    Enter a new email to share your Google Sheet data with a different account.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                  <Input
                    type="email"
                    placeholder="your-email@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="mt-2"
                  />
                  <DialogFooter className="mt-4">
                    <Button type="submit" disabled={submitting || !email.trim()}>
                      {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      Update Access
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>
    );
  }

  // No access yet - show request button
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Google Sheet Access
        </CardTitle>
        <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-3">
          Get 24/7 access to your scrapped data directly in Google Sheets.
          Your personal sheet will stay in sync with live data.
        </p>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full gap-2">
              <FileSpreadsheet className="h-4 w-4" />
              Request Sheet Access
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Request Google Sheet Access</DialogTitle>
              <DialogDescription>
                Enter your email address. We&apos;ll create a personal Google Spreadsheet
                with your Messages, Contacts, and Group Members data, and share it with
                your email. Only your data will be shared - never other users&apos; data
                or the master sheet.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <Input
                type="email"
                placeholder="your-email@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-2"
              />
              <DialogFooter className="mt-4">
                <Button type="submit" disabled={submitting || !email.trim()}>
                  {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {submitting ? "Creating & Sharing..." : "Request Access"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

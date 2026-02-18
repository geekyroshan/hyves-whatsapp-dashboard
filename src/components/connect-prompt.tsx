"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { WifiOff } from "lucide-react";
import Link from "next/link";

export function ConnectPrompt() {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-16 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
          <WifiOff className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">
          No WhatsApp account connected
        </h3>
        <p className="text-sm text-muted-foreground max-w-md mb-6">
          Connect your WhatsApp account by scanning the QR code to start
          scraping messages, contacts, and group members.
        </p>
        <Link href="/session">
          <Button>Go to Session &rarr;</Button>
        </Link>
      </CardContent>
    </Card>
  );
}

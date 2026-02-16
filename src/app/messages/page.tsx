"use client";

import { useEffect, useState, useCallback } from "react";
import { getMessages } from "@/lib/api";
import type { Message, PaginatedResponse } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
  Video,
  FileText,
  Music,
} from "lucide-react";

export default function MessagesPage() {
  const [data, setData] = useState<PaginatedResponse<Message> | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Message | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getMessages(page, 30, undefined, search || undefined);
      setData(result);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSearch = () => {
    setPage(1);
    setSearch(searchInput);
  };

  const formatTime = (ts: string) => {
    if (!ts) return "-";
    try {
      const d = new Date(ts);
      return d.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return ts;
    }
  };

  const mediaIcon = (type: string) => {
    if (!type) return null;
    if (type.startsWith("image")) return <ImageIcon className="h-3.5 w-3.5" />;
    if (type.startsWith("video")) return <Video className="h-3.5 w-3.5" />;
    if (type.startsWith("audio")) return <Music className="h-3.5 w-3.5" />;
    return <FileText className="h-3.5 w-3.5" />;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Messages</h2>
        <p className="text-muted-foreground">
          All scraped messages from WhatsApp groups
          {data && ` (${data.total} total)`}
        </p>
      </div>

      {/* Search */}
      <div className="flex gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search messages, groups, senders..."
            className="pl-9"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
        </div>
        <Button onClick={handleSearch} variant="secondary">
          Search
        </Button>
        {search && (
          <Button
            variant="ghost"
            onClick={() => {
              setSearchInput("");
              setSearch("");
              setPage(1);
            }}
          >
            Clear
          </Button>
        )}
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">
              {[...Array(8)].map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : !data?.data.length ? (
            <div className="p-12 text-center text-muted-foreground">
              No messages found
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[130px]">Time</TableHead>
                  <TableHead className="w-[160px]">Group</TableHead>
                  <TableHead className="w-[140px]">Sender</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead className="w-[80px]">Media</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.data.map((msg) => (
                  <TableRow
                    key={msg.id}
                    className="cursor-pointer hover:bg-accent/50"
                    onClick={() => setSelected(msg)}
                  >
                    <TableCell className="text-xs text-muted-foreground font-mono">
                      {formatTime(msg.timestamp)}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-medium truncate block max-w-[150px]">
                        {msg.group_name || msg.group_id}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div>
                        <span className="text-sm block truncate max-w-[130px]">
                          {msg.sender_name || "Unknown"}
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          {msg.sender_phone}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm line-clamp-2">
                        {msg.message_text || (msg.has_media === "TRUE" ? "[Media]" : "-")}
                      </span>
                    </TableCell>
                    <TableCell>
                      {msg.has_media === "TRUE" && (
                        <Badge variant="secondary" className="gap-1 text-[11px]">
                          {mediaIcon(msg.media_type)}
                          {msg.media_type?.split("/")[0] || "media"}
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {data && data.pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {data.page} of {data.pages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= data.pages}
              onClick={() => setPage(page + 1)}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Message Detail Dialog */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Message Details</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-[100px_1fr] gap-2">
                <span className="text-muted-foreground">Time</span>
                <span>{formatTime(selected.timestamp)}</span>
                <span className="text-muted-foreground">Group</span>
                <span>{selected.group_name || selected.group_id}</span>
                <span className="text-muted-foreground">Sender</span>
                <span>
                  {selected.sender_name} ({selected.sender_phone})
                </span>
                <span className="text-muted-foreground">Message</span>
                <span className="whitespace-pre-wrap">
                  {selected.message_text || "-"}
                </span>
                {selected.has_media === "TRUE" && (
                  <>
                    <span className="text-muted-foreground">Media</span>
                    <span>{selected.media_type}</span>
                    {selected.media_urls && (
                      <>
                        <span className="text-muted-foreground">Media URL</span>
                        <a
                          href={selected.media_urls}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary underline break-all"
                        >
                          {selected.media_urls}
                        </a>
                      </>
                    )}
                  </>
                )}
                <span className="text-muted-foreground">ID</span>
                <span className="font-mono text-xs break-all">{selected.id}</span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

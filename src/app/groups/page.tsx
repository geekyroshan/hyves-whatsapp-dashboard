"use client";

import { useEffect, useState } from "react";
import {
  getFilterGroups,
  addFilterGroup,
  removeFilterGroup,
  discoverGroups,
} from "@/lib/api";
import type { FilterGroup } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Filter,
  Plus,
  Trash2,
  Search as SearchIcon,
  Globe,
  Loader2,
  CheckCircle,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import { useConnection } from "@/hooks/use-connection";
import { ConnectPrompt } from "@/components/connect-prompt";

export default function GroupsPage() {
  const { connected, loading: connLoading } = useConnection();
  const [groups, setGroups] = useState<FilterGroup[]>([]);
  const [filterMode, setFilterMode] = useState("allow_all");
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [discoverOpen, setDiscoverOpen] = useState(false);
  const [discoverLoading, setDiscoverLoading] = useState(false);
  const [discovered, setDiscovered] = useState<
    { group_id: string; group_name: string; participant_count: number }[]
  >([]);
  const [newGroupId, setNewGroupId] = useState("");
  const [newGroupName, setNewGroupName] = useState("");
  const [discoverSearch, setDiscoverSearch] = useState("");
  const [syncingGroupIds, setSyncingGroupIds] = useState<Set<string>>(new Set());

  const load = async () => {
    try {
      const result = await getFilterGroups();
      setGroups(result.groups);
      setFilterMode(result.filter_mode);
    } catch {
      toast.error("Failed to load groups");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (connected) load();
    else if (connected === false) setLoading(false);
  }, [connected]);

  const handleAdd = async () => {
    if (!newGroupId) return;
    try {
      await addFilterGroup(newGroupId, newGroupName);
      toast.success("Group added. Syncing members...");
      setAddOpen(false);
      setNewGroupId("");
      setNewGroupName("");
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to add group");
    }
  };

  const handleRemove = async (groupId: string) => {
    try {
      await removeFilterGroup(groupId);
      toast.success("Group removed from allowlist");
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to remove group");
    }
  };

  const filteredDiscovered = discovered.filter(
    (g) =>
      g.group_name.toLowerCase().includes(discoverSearch.toLowerCase()) ||
      g.group_id.toLowerCase().includes(discoverSearch.toLowerCase())
  );

  const handleDiscover = async () => {
    setDiscoverLoading(true);
    setDiscoverOpen(true);
    setDiscoverSearch("");
    try {
      const result = await discoverGroups();
      if (result.success) {
        setDiscovered(result.groups);
      } else {
        toast.error(result.message);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to discover groups");
    } finally {
      setDiscoverLoading(false);
    }
  };

  const handleAddDiscovered = async (
    groupId: string,
    groupName: string
  ) => {
    try {
      setSyncingGroupIds((prev) => new Set(prev).add(groupId));
      await addFilterGroup(groupId, groupName, "Added from discovery");
      toast.success(`${groupName} added. Syncing members...`);
      load();
      // Keep syncing indicator visible briefly before switching to "Added" badge
      setTimeout(() => {
        setSyncingGroupIds((prev) => {
          const next = new Set(prev);
          next.delete(groupId);
          return next;
        });
      }, 2000);
    } catch (e) {
      setSyncingGroupIds((prev) => {
        const next = new Set(prev);
        next.delete(groupId);
        return next;
      });
      toast.error(e instanceof Error ? e.message : "Failed to add group");
    }
  };

  const existingIds = new Set(groups.map((g) => g.group_id));

  if (connLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Groups</h2>
          <p className="text-muted-foreground">Loading...</p>
        </div>
        <div className="p-6 space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (!connected) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Groups</h2>
          <p className="text-muted-foreground">
            Manage which WhatsApp groups to scrape
          </p>
        </div>
        <ConnectPrompt />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Groups</h2>
          <p className="text-muted-foreground">
            Manage which WhatsApp groups to scrape
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleDiscover}>
            <Globe className="h-4 w-4 mr-2" />
            Discover
          </Button>
          <Button onClick={() => setAddOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Group
          </Button>
        </div>
      </div>

      {/* Filter Mode Info */}
      <Card className="border-blue-500/20 bg-blue-500/5">
        <CardContent className="flex items-center gap-3 pt-6">
          <Info className="h-5 w-5 text-blue-500 shrink-0" />
          <div>
            <p className="text-sm font-medium">
              Filter Mode:{" "}
              <Badge variant={filterMode === "allow_none" ? "destructive" : "default"} className="ml-1">
                {filterMode === "allow_none" ? "No Groups Selected" : "Allowlist"}
              </Badge>
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {filterMode === "allow_none"
                ? "No groups selected — nothing is being scraped. Use \"Discover\" to find and add groups to start scraping."
                : `${groups.length} group(s) in the allowlist are being scraped.`}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Groups Grid */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-36 rounded-xl" />
          ))}
        </div>
      ) : groups.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Filter className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-lg font-medium">No groups selected</p>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              No groups are being scraped. Use &quot;Discover&quot; to find and select
              groups from WhatsApp to start scraping.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {groups.map((group) => (
            <Card key={group.group_id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-base leading-snug">
                    {group.group_name || "Unnamed Group"}
                  </CardTitle>
                  <Badge
                    variant={group.is_active ? "default" : "secondary"}
                    className="text-[10px] shrink-0"
                  >
                    {group.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-xs font-mono text-muted-foreground break-all">
                  {group.group_id}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-muted-foreground">
                    Added {new Date(group.added_at).toLocaleDateString()}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => handleRemove(group.group_id)}
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1" />
                    Remove
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Group Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Group to Allowlist</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Group ID</label>
              <Input
                placeholder="120363xxx@g.us"
                value={newGroupId}
                onChange={(e) => setNewGroupId(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Group Name (optional)</label>
              <Input
                placeholder="My Watch Group"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAdd} disabled={!newGroupId}>
              Add Group
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Discover Groups Dialog */}
      <Dialog open={discoverOpen} onOpenChange={setDiscoverOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Discover Groups from WhatsApp</DialogTitle>
          </DialogHeader>
          {discoverLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-sm text-muted-foreground">
                Fetching groups...
              </span>
            </div>
          ) : discovered.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No groups found. Make sure WhatsApp is connected.
            </p>
          ) : (
            <div className="space-y-3">
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search groups by name..."
                  value={discoverSearch}
                  onChange={(e) => setDiscoverSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {filteredDiscovered.length} of {discovered.length} groups
                {discoverSearch && ` matching "${discoverSearch}"`}
              </p>
              <div className="space-y-2 max-h-[50vh] overflow-y-auto">
                {filteredDiscovered.map((g) => (
                  <div
                    key={g.group_id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{g.group_name}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {g.participant_count} members
                      </p>
                    </div>
                    {syncingGroupIds.has(g.group_id) ? (
                      <Badge variant="outline" className="gap-1 shrink-0 text-blue-600 border-blue-300">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Syncing...
                      </Badge>
                    ) : existingIds.has(g.group_id) ? (
                      <Badge variant="secondary" className="gap-1 shrink-0">
                        <CheckCircle className="h-3 w-3" />
                        Added
                      </Badge>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        className="shrink-0"
                        onClick={() =>
                          handleAddDiscovered(g.group_id, g.group_name)
                        }
                      >
                        <Plus className="h-3.5 w-3.5 mr-1" />
                        Add
                      </Button>
                    )}
                  </div>
                ))}
                {filteredDiscovered.length === 0 && discoverSearch && (
                  <p className="text-sm text-muted-foreground py-4 text-center">
                    No groups matching &quot;{discoverSearch}&quot;
                  </p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

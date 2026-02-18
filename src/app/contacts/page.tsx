"use client";

import { useEffect, useState, useCallback } from "react";
import {
  getContacts,
  getGroupMembers,
  exportGroupMembersCSV,
  copyGroupMembersToSheet,
} from "@/lib/api";
import type {
  Contact,
  PaginatedResponse,
  GroupMember,
  GroupMembersResponse,
  GroupSummary,
} from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Download,
  FileSpreadsheet,
  MoreVertical,
  Users,
} from "lucide-react";
import { toast } from "sonner";

export default function ContactsPage() {
  const [activeTab, setActiveTab] = useState("contacts");

  // Message contacts state
  const [contactsData, setContactsData] =
    useState<PaginatedResponse<Contact> | null>(null);
  const [contactsPage, setContactsPage] = useState(1);
  const [contactsSearch, setContactsSearch] = useState("");
  const [contactsSearchInput, setContactsSearchInput] = useState("");
  const [contactsLoading, setContactsLoading] = useState(true);

  // Group members state
  const [membersData, setMembersData] =
    useState<GroupMembersResponse | null>(null);
  const [membersPage, setMembersPage] = useState(1);
  const [membersSearch, setMembersSearch] = useState("");
  const [membersSearchInput, setMembersSearchInput] = useState("");
  const [membersLoading, setMembersLoading] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState<string | undefined>(
    undefined,
  );
  const [exporting, setExporting] = useState(false);

  // Load message contacts
  const loadContacts = useCallback(async () => {
    setContactsLoading(true);
    try {
      const result = await getContacts(
        contactsPage,
        50,
        contactsSearch || undefined,
      );
      setContactsData(result);
    } catch {
      setContactsData(null);
    } finally {
      setContactsLoading(false);
    }
  }, [contactsPage, contactsSearch]);

  // Load group members
  const loadMembers = useCallback(async () => {
    setMembersLoading(true);
    try {
      const result = await getGroupMembers(
        membersPage,
        100,
        selectedGroup,
        membersSearch || undefined,
      );
      setMembersData(result);
    } catch {
      setMembersData(null);
    } finally {
      setMembersLoading(false);
    }
  }, [membersPage, selectedGroup, membersSearch]);

  useEffect(() => {
    if (activeTab === "contacts") {
      loadContacts();
    }
  }, [activeTab, loadContacts]);

  useEffect(() => {
    if (activeTab === "group-members") {
      loadMembers();
    }
  }, [activeTab, loadMembers]);

  const handleContactsSearch = () => {
    setContactsPage(1);
    setContactsSearch(contactsSearchInput);
  };

  const handleMembersSearch = () => {
    setMembersPage(1);
    setMembersSearch(membersSearchInput);
  };

  const handleCSVExport = async (groupId?: string) => {
    setExporting(true);
    try {
      await exportGroupMembersCSV(groupId);
      toast.success("CSV download started");
    } catch {
      toast.error("Failed to export CSV");
    } finally {
      setExporting(false);
    }
  };

  const handleSheetExport = async (groupId?: string) => {
    setExporting(true);
    try {
      const result = await copyGroupMembersToSheet(groupId);
      toast.success(result.message);
    } catch {
      toast.error("Failed to copy to Google Sheet");
    } finally {
      setExporting(false);
    }
  };

  const formatDate = (ts: string) => {
    if (!ts) return "-";
    try {
      return new Date(ts).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return ts;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Contacts</h2>
          <p className="text-muted-foreground">
            Contacts from messages and group member syncs
          </p>
        </div>
        {activeTab === "group-members" && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" disabled={exporting}>
                <Download className="h-4 w-4 mr-2" />
                Export All
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => handleCSVExport()}>
                <Download className="h-4 w-4 mr-2" />
                Download CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSheetExport()}>
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Copy to Google Sheet
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="contacts">
            Message Contacts
            {contactsData && (
              <Badge variant="secondary" className="ml-2">
                {contactsData.total}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="group-members">
            Group Members
            {membersData && (
              <Badge variant="secondary" className="ml-2">
                {membersData.total}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Message Contacts Tab */}
        <TabsContent value="contacts" className="space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by phone or name..."
                className="pl-9"
                value={contactsSearchInput}
                onChange={(e) => setContactsSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleContactsSearch()}
              />
            </div>
            <Button onClick={handleContactsSearch} variant="secondary">
              Search
            </Button>
            {contactsSearch && (
              <Button
                variant="ghost"
                onClick={() => {
                  setContactsSearchInput("");
                  setContactsSearch("");
                  setContactsPage(1);
                }}
              >
                Clear
              </Button>
            )}
          </div>

          <Card>
            <CardContent className="p-0">
              {contactsLoading ? (
                <div className="p-6 space-y-3">
                  {[...Array(8)].map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : !contactsData?.data.length ? (
                <div className="p-12 text-center text-muted-foreground">
                  No contacts found
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Phone</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead className="text-center">Messages</TableHead>
                      <TableHead>Groups</TableHead>
                      <TableHead>First Seen</TableHead>
                      <TableHead>Last Seen</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {contactsData.data.map((contact, i) => (
                      <TableRow key={`${contact.phone}-${i}`}>
                        <TableCell className="font-mono text-sm">
                          {contact.phone}
                        </TableCell>
                        <TableCell className="font-medium">
                          {contact.name || "-"}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary">
                            {contact.message_count}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground truncate block max-w-[200px]">
                            {contact.groups || "-"}
                          </span>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {formatDate(contact.first_seen)}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {formatDate(contact.last_seen)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {contactsData && contactsData.pages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Page {contactsData.page} of {contactsData.pages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={contactsPage <= 1}
                  onClick={() => setContactsPage(contactsPage - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={contactsPage >= contactsData.pages}
                  onClick={() => setContactsPage(contactsPage + 1)}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </TabsContent>

        {/* Group Members Tab */}
        <TabsContent value="group-members" className="space-y-4">
          {/* Group summary cards */}
          {membersData?.groups_summary &&
            membersData.groups_summary.length > 0 && (
              <div className="flex gap-3 overflow-x-auto pb-2">
                <Card
                  className={`shrink-0 cursor-pointer transition-colors ${
                    !selectedGroup
                      ? "border-primary bg-primary/5"
                      : "hover:border-muted-foreground/50"
                  }`}
                  onClick={() => {
                    setSelectedGroup(undefined);
                    setMembersPage(1);
                  }}
                >
                  <CardContent className="p-3">
                    <p className="text-sm font-medium">All Groups</p>
                    <p className="text-xs text-muted-foreground">
                      {membersData.total} members
                    </p>
                  </CardContent>
                </Card>
                {membersData.groups_summary.map((group) => (
                  <Card
                    key={group.group_id}
                    className={`shrink-0 cursor-pointer transition-colors ${
                      selectedGroup === group.group_id
                        ? "border-primary bg-primary/5"
                        : "hover:border-muted-foreground/50"
                    }`}
                    onClick={() => {
                      setSelectedGroup(group.group_id);
                      setMembersPage(1);
                    }}
                  >
                    <CardContent className="p-3 flex items-center gap-3">
                      <div>
                        <p className="text-sm font-medium truncate max-w-[180px]">
                          {group.group_name || "Unnamed Group"}
                        </p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {group.member_count} members
                        </p>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          asChild
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCSVExport(group.group_id);
                            }}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Download CSV
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSheetExport(group.group_id);
                            }}
                          >
                            <FileSpreadsheet className="h-4 w-4 mr-2" />
                            Copy to Google Sheet
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

          {/* Search */}
          <div className="flex gap-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by phone, name, or group..."
                className="pl-9"
                value={membersSearchInput}
                onChange={(e) => setMembersSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleMembersSearch()}
              />
            </div>
            <Button onClick={handleMembersSearch} variant="secondary">
              Search
            </Button>
            {membersSearch && (
              <Button
                variant="ghost"
                onClick={() => {
                  setMembersSearchInput("");
                  setMembersSearch("");
                  setMembersPage(1);
                }}
              >
                Clear
              </Button>
            )}
          </div>

          {/* Members table */}
          <Card>
            <CardContent className="p-0">
              {membersLoading ? (
                <div className="p-6 space-y-3">
                  {[...Array(8)].map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : !membersData?.data.length ? (
                <div className="p-12 text-center text-muted-foreground">
                  No group members found. Add groups to your allowlist to
                  auto-sync members.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Phone</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Group</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Synced At</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {membersData.data.map((member, i) => (
                      <TableRow key={`${member.phone}-${member.group_id}-${i}`}>
                        <TableCell className="font-mono text-sm">
                          {member.phone}
                        </TableCell>
                        <TableCell className="font-medium">
                          {member.name || "-"}
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground truncate block max-w-[200px]">
                            {member.group_name || "-"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              member.role === "admin" ||
                              member.role === "superadmin"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {member.role}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {formatDate(member.synced_at)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {membersData && membersData.pages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Page {membersData.page} of {membersData.pages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={membersPage <= 1}
                  onClick={() => setMembersPage(membersPage - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={membersPage >= membersData.pages}
                  onClick={() => setMembersPage(membersPage + 1)}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";
const API_KEY = process.env.NEXT_PUBLIC_API_KEY || "allys_777_admin";

interface FetchOptions extends RequestInit {
  params?: Record<string, string | number | undefined>;
  retries?: number;
  timeoutMs?: number;
}

async function apiFetch<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const { params, retries = 1, timeoutMs = 30000, ...fetchOpts } = options;

  let url = `${API_URL}${path}`;
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== "") {
        searchParams.set(key, String(value));
      }
    });
    const qs = searchParams.toString();
    if (qs) url += `?${qs}`;
  }

  let lastError: Error | null = null;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);

      const res = await fetch(url, {
        ...fetchOpts,
        signal: controller.signal,
        headers: {
          "X-Api-Key": API_KEY,
          "Content-Type": "application/json",
          ...fetchOpts.headers,
        },
      });

      clearTimeout(timeout);

      if (!res.ok) {
        const error = await res.json().catch(() => ({ detail: res.statusText }));
        throw new Error(error.detail || error.message || `API error ${res.status}`);
      }

      return res.json();
    } catch (e) {
      lastError = e instanceof Error ? e : new Error(String(e));
      if (attempt < retries) {
        // Wait before retry (exponential backoff: 1s, 2s)
        await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
      }
    }
  }

  throw lastError!;
}

// Session endpoints
export async function getSession() {
  return apiFetch<Record<string, unknown>>("/api/session");
}

export async function startSession() {
  return apiFetch<Record<string, unknown>>("/api/session/start", { method: "POST" });
}

export async function stopSession() {
  return apiFetch<Record<string, unknown>>("/api/session/stop", { method: "POST" });
}

export async function deleteSession() {
  return apiFetch<Record<string, unknown>>("/api/session", { method: "DELETE" });
}

export async function restartSession() {
  return apiFetch<Record<string, unknown>>("/api/session/restart", { method: "POST" });
}

export function getQrCodeUrl() {
  return `${API_URL}/api/session/qr?t=${Date.now()}`;
}

export async function fetchQrCode(): Promise<string> {
  const url = `${API_URL}/api/session/qr`;
  const res = await fetch(url, {
    headers: { "X-Api-Key": API_KEY },
  });
  if (!res.ok) throw new Error("Failed to fetch QR code");
  const blob = await res.blob();
  return URL.createObjectURL(blob);
}

// Data endpoints
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface Message {
  id: string;
  timestamp: string;
  group_id: string;
  group_name: string;
  sender_phone: string;
  sender_name: string;
  message_text: string;
  media_urls: string;
  media_type: string;
  has_media: string;
  created_at: string;
}

export interface Contact {
  phone: string;
  name: string;
  first_seen: string;
  last_seen: string;
  message_count: string;
  groups: string;
}

export interface Stats {
  total_messages: number;
  total_contacts: number;
  total_groups: number;
  filter_mode: string;
  active_filter_groups: number;
  queue_depth: number;
  queue_completed: number;
  queue_failed: number;
}

export interface FilterGroup {
  group_id: string;
  group_name: string;
  added_at: string;
  added_by: string;
  notes: string;
  is_active: boolean;
}

export interface FilterListResponse {
  total: number;
  filter_mode: string;
  groups: FilterGroup[];
}

export interface DiscoverGroupsResponse {
  success: boolean;
  message: string;
  groups: { group_id: string; group_name: string; participant_count: number }[];
}

export async function getMessages(page = 1, limit = 50, groupId?: string, search?: string) {
  return apiFetch<PaginatedResponse<Message>>("/api/messages", {
    params: { page, limit, group_id: groupId, search },
  });
}

export async function getContacts(page = 1, limit = 50, search?: string) {
  return apiFetch<PaginatedResponse<Contact>>("/api/contacts", {
    params: { page, limit, search },
  });
}

export async function getStats() {
  return apiFetch<Stats>("/api/stats", { retries: 2, timeoutMs: 45000 });
}

export async function getHealth() {
  const res = await fetch(`${API_URL}/health`);
  return res.json();
}

// Filter endpoints
export async function getFilterGroups() {
  return apiFetch<FilterListResponse>("/filter/groups");
}

export async function addFilterGroup(groupId: string, groupName: string, notes = "") {
  return apiFetch<{ success: boolean; message: string }>("/filter/groups", {
    method: "POST",
    body: JSON.stringify({ group_id: groupId, group_name: groupName, notes }),
  });
}

export async function removeFilterGroup(groupId: string) {
  return apiFetch<{ success: boolean }>(`/filter/groups/${encodeURIComponent(groupId)}?hard_delete=true`, {
    method: "DELETE",
  });
}

export async function discoverGroups() {
  return apiFetch<DiscoverGroupsResponse>("/filter/discover");
}

// Current user endpoint
export interface CurrentUser {
  phone: string | null;
  connected: boolean;
  display: string | null;
}

export async function getCurrentUser() {
  return apiFetch<CurrentUser>("/api/session/me");
}

// Group members endpoints
export interface GroupMember {
  phone: string;
  name: string;
  group_id: string;
  group_name: string;
  role: string;
  lid: string;
  synced_at: string;
}

export interface GroupSummary {
  group_id: string;
  group_name: string;
  member_count: number;
}

export interface GroupMembersResponse extends PaginatedResponse<GroupMember> {
  groups_summary: GroupSummary[];
}

export async function getGroupMembers(
  page = 1,
  limit = 100,
  groupId?: string,
  search?: string,
) {
  return apiFetch<GroupMembersResponse>("/api/group-members", {
    params: { page, limit, group_id: groupId, search },
  });
}

// Export endpoints
export async function exportGroupMembersCSV(groupId?: string): Promise<void> {
  const params = new URLSearchParams();
  if (groupId) params.set("group_id", groupId);

  const url = `${API_URL}/api/export/group-members/csv?${params.toString()}`;
  const res = await fetch(url, {
    headers: { "X-Api-Key": API_KEY },
  });

  if (!res.ok) throw new Error("Failed to export CSV");

  const blob = await res.blob();
  const downloadUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = downloadUrl;
  const disposition = res.headers.get("Content-Disposition");
  a.download = disposition?.split("filename=")[1]?.replace(/"/g, "") || "contacts.csv";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(downloadUrl);
}

export interface CopyToSheetResponse {
  success: boolean;
  message: string;
  tab_name: string;
  row_count: number;
}

export async function copyGroupMembersToSheet(
  groupId?: string,
  tabName?: string,
) {
  return apiFetch<CopyToSheetResponse>("/api/export/group-members/sheet", {
    method: "POST",
    body: JSON.stringify({ group_id: groupId, tab_name: tabName }),
  });
}

// Sheet access endpoints
export interface AccessStatus {
  has_access: boolean;
  spreadsheet_url: string | null;
  email: string | null;
  created_at: string | null;
}

export interface AccessRequestResponse {
  success: boolean;
  message: string;
  spreadsheet_url: string;
  email: string;
  created_at: string;
}

export async function getAccessStatus() {
  return apiFetch<AccessStatus>("/api/access/status");
}

export async function requestSheetAccess(email: string) {
  return apiFetch<AccessRequestResponse>("/api/access/request", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";
const API_KEY = process.env.NEXT_PUBLIC_API_KEY || "allys_777_admin";

interface FetchOptions extends RequestInit {
  params?: Record<string, string | number | undefined>;
}

async function apiFetch<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const { params, ...fetchOpts } = options;

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

  const res = await fetch(url, {
    ...fetchOpts,
    headers: {
      "X-Api-Key": API_KEY,
      "Content-Type": "application/json",
      ...fetchOpts.headers,
    },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(error.detail || error.message || `API error ${res.status}`);
  }

  return res.json();
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
  return apiFetch<Stats>("/api/stats");
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

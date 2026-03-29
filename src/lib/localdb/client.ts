/**
 * Client-side helper for the local SQLite database API.
 * Use these functions from React components (client-side) to interact
 * with the local database via the Next.js API routes.
 */

const BASE = '/api/local';

// ─── Documents ────────────────────────────────────────────────────────────────

export async function fetchLocalDocuments(params?: {
  subject?: string;
  university?: string;
  search?: string;
  limit?: number;
  offset?: number;
}) {
  const qs = new URLSearchParams();
  if (params?.subject)    qs.set('subject',    params.subject);
  if (params?.university) qs.set('university', params.university);
  if (params?.search)     qs.set('search',     params.search);
  if (params?.limit  != null) qs.set('limit',  String(params.limit));
  if (params?.offset != null) qs.set('offset', String(params.offset));

  const res = await fetch(`${BASE}/documents?${qs}`);
  if (!res.ok) throw new Error((await res.json()).error ?? 'Failed to fetch documents');
  return res.json() as Promise<{ data: unknown[]; total: number }>;
}

export async function fetchLocalDocument(id: string) {
  const res = await fetch(`${BASE}/documents/${id}`);
  if (!res.ok) throw new Error((await res.json()).error ?? 'Failed to fetch document');
  return res.json() as Promise<{ data: unknown }>;
}

export async function createLocalDocument(data: {
  title: string;
  description?: string;
  subject?: string;
  course?: string;
  university?: string;
  file_name?: string;
  file_size?: number;
  file_type?: string;
  tags?: string;
  uploader_id?: string;
  uploader_name?: string;
}) {
  const res = await fetch(`${BASE}/documents`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error((await res.json()).error ?? 'Failed to create document');
  return res.json() as Promise<{ data: unknown }>;
}

export async function updateLocalDocument(id: string, data: Record<string, unknown>) {
  const res = await fetch(`${BASE}/documents/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error((await res.json()).error ?? 'Failed to update document');
  return res.json() as Promise<{ data: unknown }>;
}

export async function deleteLocalDocument(id: string) {
  const res = await fetch(`${BASE}/documents/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error((await res.json()).error ?? 'Failed to delete document');
  return res.json() as Promise<{ success: boolean }>;
}

// ─── Comments ─────────────────────────────────────────────────────────────────

export async function fetchLocalComments(documentId: string) {
  const res = await fetch(`${BASE}/comments?document_id=${encodeURIComponent(documentId)}`);
  if (!res.ok) throw new Error((await res.json()).error ?? 'Failed to fetch comments');
  return res.json() as Promise<{ data: unknown[] }>;
}

export async function createLocalComment(data: {
  document_id: string;
  user_id?: string;
  user_name: string;
  content: string;
  parent_id?: string;
}) {
  const res = await fetch(`${BASE}/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error((await res.json()).error ?? 'Failed to create comment');
  return res.json() as Promise<{ data: unknown }>;
}

export async function upvoteLocalComment(id: string) {
  const res = await fetch(`${BASE}/comments/${id}`, { method: 'PATCH' });
  if (!res.ok) throw new Error((await res.json()).error ?? 'Failed to upvote comment');
  return res.json() as Promise<{ data: unknown }>;
}

export async function deleteLocalComment(id: string) {
  const res = await fetch(`${BASE}/comments/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error((await res.json()).error ?? 'Failed to delete comment');
  return res.json() as Promise<{ success: boolean }>;
}

// ─── Bookmarks ────────────────────────────────────────────────────────────────

export async function fetchLocalBookmarks(userId: string) {
  const res = await fetch(`${BASE}/bookmarks?user_id=${encodeURIComponent(userId)}`);
  if (!res.ok) throw new Error((await res.json()).error ?? 'Failed to fetch bookmarks');
  return res.json() as Promise<{ data: unknown[] }>;
}

export async function addLocalBookmark(documentId: string, userId: string) {
  const res = await fetch(`${BASE}/bookmarks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ document_id: documentId, user_id: userId }),
  });
  if (!res.ok) throw new Error((await res.json()).error ?? 'Failed to add bookmark');
  return res.json() as Promise<{ data: unknown }>;
}

export async function removeLocalBookmark(documentId: string, userId: string) {
  const res = await fetch(`${BASE}/bookmarks`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ document_id: documentId, user_id: userId }),
  });
  if (!res.ok) throw new Error((await res.json()).error ?? 'Failed to remove bookmark');
  return res.json() as Promise<{ success: boolean }>;
}

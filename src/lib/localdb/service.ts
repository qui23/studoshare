import getDb from './db';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LocalDocument {
  id: string;
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
  created_at: string;
  updated_at: string;
}

export interface LocalComment {
  id: string;
  document_id: string;
  user_id?: string;
  user_name: string;
  content: string;
  parent_id?: string;
  upvotes: number;
  created_at: string;
  updated_at: string;
}

export interface LocalBookmark {
  id: string;
  document_id: string;
  user_id: string;
  created_at: string;
}

// ─── Documents ────────────────────────────────────────────────────────────────

export function getAllDocuments(filters?: {
  subject?: string;
  university?: string;
  search?: string;
  limit?: number;
  offset?: number;
}): LocalDocument[] {
  const db = getDb();
  let query = 'SELECT * FROM local_documents WHERE 1=1';
  const params: (string | number)[] = [];

  if (filters?.subject) {
    query += ' AND subject = ?';
    params.push(filters.subject);
  }
  if (filters?.university) {
    query += ' AND university = ?';
    params.push(filters.university);
  }
  if (filters?.search) {
    query += ' AND (title LIKE ? OR description LIKE ? OR tags LIKE ?)';
    const term = `%${filters.search}%`;
    params.push(term, term, term);
  }

  query += ' ORDER BY created_at DESC';

  if (filters?.limit) {
    query += ' LIMIT ?';
    params.push(filters.limit);
  }
  if (filters?.offset) {
    query += ' OFFSET ?';
    params.push(filters.offset);
  }

  return db.prepare(query).all(...params) as LocalDocument[];
}

export function getDocumentById(id: string): LocalDocument | null {
  const db = getDb();
  return (db.prepare('SELECT * FROM local_documents WHERE id = ?').get(id) as LocalDocument) ?? null;
}

export function createDocument(data: Omit<LocalDocument, 'id' | 'created_at' | 'updated_at'>): LocalDocument {
  const db = getDb();
  const id = crypto.randomUUID();
  db.prepare(`
    INSERT INTO local_documents (id, title, description, subject, course, university, file_name, file_size, file_type, tags, uploader_id, uploader_name)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    data.title,
    data.description ?? null,
    data.subject ?? null,
    data.course ?? null,
    data.university ?? null,
    data.file_name ?? null,
    data.file_size ?? null,
    data.file_type ?? null,
    data.tags ?? null,
    data.uploader_id ?? null,
    data.uploader_name ?? null,
  );
  return getDocumentById(id)!;
}

export function updateDocument(id: string, data: Partial<Omit<LocalDocument, 'id' | 'created_at'>>): LocalDocument | null {
  const db = getDb();
  const fields = Object.keys(data).map((k) => `${k} = ?`).join(', ');
  const values = Object.values(data);
  if (!fields) return getDocumentById(id);
  db.prepare(`UPDATE local_documents SET ${fields}, updated_at = datetime('now') WHERE id = ?`).run(...values, id);
  return getDocumentById(id);
}

export function deleteDocument(id: string): boolean {
  const db = getDb();
  const result = db.prepare('DELETE FROM local_documents WHERE id = ?').run(id);
  return result.changes > 0;
}

// ─── Comments ─────────────────────────────────────────────────────────────────

export function getCommentsByDocument(documentId: string): LocalComment[] {
  const db = getDb();
  return db.prepare('SELECT * FROM local_comments WHERE document_id = ? ORDER BY created_at ASC').all(documentId) as LocalComment[];
}

export function createComment(data: Omit<LocalComment, 'id' | 'upvotes' | 'created_at' | 'updated_at'>): LocalComment {
  const db = getDb();
  const id = crypto.randomUUID();
  db.prepare(`
    INSERT INTO local_comments (id, document_id, user_id, user_name, content, parent_id)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, data.document_id, data.user_id ?? null, data.user_name, data.content, data.parent_id ?? null);
  return db.prepare('SELECT * FROM local_comments WHERE id = ?').get(id) as LocalComment;
}

export function upvoteComment(id: string): LocalComment | null {
  const db = getDb();
  db.prepare(`UPDATE local_comments SET upvotes = upvotes + 1, updated_at = datetime('now') WHERE id = ?`).run(id);
  return (db.prepare('SELECT * FROM local_comments WHERE id = ?').get(id) as LocalComment) ?? null;
}

export function deleteComment(id: string): boolean {
  const db = getDb();
  const result = db.prepare('DELETE FROM local_comments WHERE id = ?').run(id);
  return result.changes > 0;
}

// ─── Bookmarks ────────────────────────────────────────────────────────────────

export function getBookmarksByUser(userId: string): LocalBookmark[] {
  const db = getDb();
  return db.prepare('SELECT * FROM local_bookmarks WHERE user_id = ? ORDER BY created_at DESC').all(userId) as LocalBookmark[];
}

export function addBookmark(documentId: string, userId: string): LocalBookmark {
  const db = getDb();
  const id = crypto.randomUUID();
  db.prepare('INSERT OR IGNORE INTO local_bookmarks (id, document_id, user_id) VALUES (?, ?, ?)').run(id, documentId, userId);
  return db.prepare('SELECT * FROM local_bookmarks WHERE document_id = ? AND user_id = ?').get(documentId, userId) as LocalBookmark;
}

export function removeBookmark(documentId: string, userId: string): boolean {
  const db = getDb();
  const result = db.prepare('DELETE FROM local_bookmarks WHERE document_id = ? AND user_id = ?').run(documentId, userId);
  return result.changes > 0;
}

export function getDocumentCount(): number {
  const db = getDb();
  const row = db.prepare('SELECT COUNT(*) as count FROM local_documents').get() as { count: number };
  return row.count;
}

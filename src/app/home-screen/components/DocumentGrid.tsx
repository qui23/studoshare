'use client';
import React, { useState, useEffect, useCallback } from 'react';
import DocumentCard, { DocumentCardData } from '@/components/ui/DocumentCard';
import Icon from '@/components/ui/AppIcon';
import { createClient } from '@/lib/supabase/client';

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'downloads', label: 'Most Downloaded' },
  { value: 'relevance', label: 'Most Relevant' },
];

function mapDocToCard(doc: any): DocumentCardData {
  const fileType = doc.file_type?.includes('pdf')
    ? 'pdf'
    : doc.file_type?.includes('word') || doc.file_name?.endsWith('.docx')
    ? 'docx' : 'ppt';

  const uploaderName = doc.user_profiles?.full_name || 'Anonymous';
  const uploaderRole = doc.user_profiles?.role === 'admin' ? 'admin' : 'contributor';

  const uploadedAt = doc.created_at
    ? new Date(doc.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : '';

  const daysSinceUpload = doc.created_at
    ? (Date.now() - new Date(doc.created_at).getTime()) / (1000 * 60 * 60 * 24)
    : 999;

  return {
    id: doc.id,
    title: doc.title,
    description: doc.description || '',
    subject: doc.subject || '',
    university: doc.university || '',
    fileType,
    rating: 4.5,
    ratingCount: Math.floor(doc.download_count / 10) || 0,
    downloads: doc.download_count || 0,
    pages: 0,
    contributor: uploaderName,
    contributorRole: uploaderRole as 'contributor' | 'admin',
    uploadedAt,
    isNew: daysSinceUpload <= 7,
    isTrending: doc.download_count > 5000,
    tags: doc.tags || [],
    filePath: doc.file_path || undefined,
    fileName: doc.file_name || undefined,
  };
}

interface DocumentGridProps {
  searchQuery?: string;
  subjectFilter?: string;
  fileTypeFilter?: string;
  sidebarFileTypes?: string[];
  dateRange?: string;
}

export default function DocumentGrid({ searchQuery = '', subjectFilter = '', fileTypeFilter = '', sidebarFileTypes = [], dateRange = 'all' }: DocumentGridProps) {
  const [sort, setSort] = useState('newest');
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(12);
  const [documents, setDocuments] = useState<DocumentCardData[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const from = (page - 1) * perPage;
      const to = from + perPage - 1;

      let query = supabase
        .from('documents')
        .select(
          `id, title, description, subject, university, doc_type,
           file_type, file_name, file_path, file_size, download_count, tags,
           created_at, visibility,
           user_profiles!documents_uploader_id_fkey(full_name, role)`,
          { count: 'exact' }
        )
        .eq('visibility', 'public');

      if (searchQuery) {
        query = query.or(
          `title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%,subject.ilike.%${searchQuery}%,university.ilike.%${searchQuery}%`
        );
      }

      if (subjectFilter) {
        query = query.ilike('subject', `%${subjectFilter}%`);
      }

      // Hero quick-filter (single type string)
      if (fileTypeFilter) {
        if (fileTypeFilter === 'pdf') {
          query = query.ilike('file_type', '%pdf%');
        } else if (fileTypeFilter === 'word') {
          query = query.or('file_type.ilike.%word%,file_type.ilike.%docx%,file_name.ilike.%.docx%,file_name.ilike.%.doc%');
        }
      }

      // Sidebar file type checkboxes (multi-select)
      if (sidebarFileTypes.length > 0) {
        const conditions: string[] = [];
        if (sidebarFileTypes.includes('pdf')) {
          conditions.push('file_type.ilike.%pdf%');
        }
        if (sidebarFileTypes.includes('docx')) {
          conditions.push('file_type.ilike.%word%', 'file_type.ilike.%docx%', 'file_name.ilike.%.docx%', 'file_name.ilike.%.doc%');
        }
        if (conditions.length > 0) {
          query = query.or(conditions.join(','));
        }
      }

      // Upload date filter
      if (dateRange && dateRange !== 'all') {
        const now = new Date();
        let fromDate: Date;
        if (dateRange === 'today') {
          fromDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        } else if (dateRange === 'week') {
          fromDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        } else if (dateRange === 'month') {
          fromDate = new Date(now.getFullYear(), now.getMonth(), 1);
        } else {
          // year
          fromDate = new Date(now.getFullYear(), 0, 1);
        }
        query = query.gte('created_at', fromDate.toISOString());
      }

      if (sort === 'newest') {
        query = query.order('created_at', { ascending: false });
      } else if (sort === 'downloads') {
        query = query.order('download_count', { ascending: false });
      } else {
        query = query.order('created_at', { ascending: false });
      }

      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) {
        console.log('Documents fetch error:', error.message);
        setLoading(false);
        return;
      }

      setDocuments((data || []).map(mapDocToCard));
      setTotal(count || 0);
    } catch (err) {
      console.log('Failed to load documents');
    } finally {
      setLoading(false);
    }
  }, [page, perPage, sort, searchQuery, subjectFilter, fileTypeFilter, sidebarFileTypes, dateRange]);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, subjectFilter, fileTypeFilter, sidebarFileTypes, dateRange]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const totalPages = Math.max(1, Math.ceil(total / perPage));

  const getPageNumbers = () => {
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (page <= 3) return [1, 2, 3, '...', totalPages];
    if (page >= totalPages - 2) return [1, '...', totalPages - 2, totalPages - 1, totalPages];
    return [1, '...', page - 1, page, page + 1, '...', totalPages];
  };

  return (
    <div className="flex-1 min-w-0">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <div className="min-w-0">
          {loading ? (
            <p className="text-sm text-gray-400">Loading documents...</p>
          ) : (
            <p className="text-sm text-gray-600 truncate">
              {searchQuery && (
                <span className="mr-1">
                  Results for <span className="font-display font-600 text-indigo-600">"{searchQuery}"</span>
                  {subjectFilter ? ` in ` : ' — '}
                </span>
              )}
              {subjectFilter && (
                <span className="mr-1">
                  {!searchQuery && 'Subject: '}
                  <span className="font-display font-600 text-indigo-600">{subjectFilter}</span>
                  {' — '}
                </span>
              )}
              <span className="font-display font-600 text-gray-900 tabular-nums">{documents.length}</span>
              <span className="hidden sm:inline"> of{' '}
              <span className="font-display font-600 text-indigo-600 tabular-nums">{total.toLocaleString('en-US')}</span> documents</span>
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Sort */}
          <div className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-lg px-2 sm:px-3 py-1.5 shadow-sm">
            <Icon name="BarsArrowDownIcon" size={14} className="text-gray-400 hidden sm:block" />
            <select
              value={sort}
              onChange={(e) => { setSort(e.target.value); setPage(1); }}
              className="text-xs text-gray-700 outline-none bg-transparent cursor-pointer font-medium"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={`sort-${opt.value}`} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* View Toggle */}
          <div className="flex items-center bg-white border border-gray-200 rounded-lg p-0.5 shadow-sm">
            <button
              onClick={() => setView('grid')}
              className={`p-1.5 rounded-md transition-all duration-150 ${view === 'grid' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-400 hover:text-gray-600'}`}
              aria-label="Grid view"
            >
              <Icon name="Squares2X2Icon" size={16} />
            </button>
            <button
              onClick={() => setView('list')}
              className={`p-1.5 rounded-md transition-all duration-150 ${view === 'list' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-400 hover:text-gray-600'}`}
              aria-label="List view"
            >
              <Icon name="ListBulletIcon" size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20">
          <svg className="animate-spin w-8 h-8 text-indigo-400 mb-3" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-sm text-gray-400">Loading documents...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && documents.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Icon name="DocumentTextIcon" size={40} className="text-gray-300 mb-3" />
          <p className="text-base font-medium text-gray-600">
            {searchQuery || subjectFilter
              ? `No documents found${searchQuery ? ` for "${searchQuery}"` : ''}${subjectFilter ? ` in subject "${subjectFilter}"` : ''}`
              : 'No documents found'}
          </p>
          <p className="text-sm text-gray-400 mt-1">
            {searchQuery || subjectFilter ? 'Try a different keyword or subject.' : 'Be the first to upload a document!'}
          </p>
        </div>
      )}

      {/* Document Grid */}
      {!loading && documents.length > 0 && (
        <div className={view === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-3 gap-4' : 'flex flex-col gap-3'}>
          {documents.map((doc) => (
            <DocumentCard key={doc.id} doc={doc} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && total > perPage && (
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>Show</span>
            <select
              value={perPage}
              onChange={(e) => { setPerPage(Number(e.target.value)); setPage(1); }}
              className="border border-gray-200 rounded-lg px-2 py-1 text-sm text-gray-700 outline-none bg-white"
            >
              {[12, 24, 48].map((n) => <option key={`pp-${n}`} value={n}>{n}</option>)}
            </select>
            <span>per page</span>
          </div>

          <div className="flex items-center gap-1 flex-wrap justify-center">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="p-2 rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150"
            >
              <Icon name="ChevronLeftIcon" size={14} />
            </button>

            {getPageNumbers().map((p, idx) => (
              <button
                key={`page-${idx}`}
                onClick={() => typeof p === 'number' && setPage(p)}
                className={`w-8 h-8 rounded-lg text-sm font-medium transition-all duration-150 ${
                  p === page
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : p === '...' ? 'text-gray-400 cursor-default' : 'border border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                {p}
              </button>
            ))}

            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="p-2 rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150"
            >
              <Icon name="ChevronRightIcon" size={14} />
            </button>
          </div>

          <p className="text-xs text-gray-400 tabular-nums">
            Page {page} of {totalPages.toLocaleString('en-US')}
          </p>
        </div>
      )}
    </div>
  );
}
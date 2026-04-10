'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import Badge from '@/components/ui/Badge';
import Icon from '@/components/ui/AppIcon';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';

interface DocumentData {
  id: string;
  title: string;
  description: string;
  subject: string;
  university: string | null;
  doc_type: string | null;
  file_type: string;
  file_name: string;
  file_path: string;
  file_size: number;
  download_count: number;
  tags: string[];
  created_at: string;
  visibility: string;
  user_profiles: { full_name: string | null; role: string | null } | null;
}

export default function DocumentDetailHeader() {
  const searchParams = useSearchParams();
  const docId = searchParams.get('id');

  const [doc, setDoc] = useState<DocumentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [bookmarked, setBookmarked] = useState(false);
  const [bookmarkLoading, setBookmarkLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    if (!docId) { setLoading(false); return; }
    const fetchDoc = async () => {
      setLoading(true);
      try {
        const supabase = createClient();

        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        setCurrentUser(user);

        const { data, error } = await supabase
          .from('documents')
          .select(`id, title, description, subject, university, doc_type,
                   file_type, file_name, file_path, file_size, download_count,
                   tags, created_at, visibility,
                   user_profiles!documents_uploader_id_fkey(full_name, role)`)
          .eq('id', docId)
          .single();
        if (!error && data) setDoc(data as DocumentData);

        // Check if user has bookmarked this document
        if (user) {
          const { data: bm } = await supabase
            .from('bookmarks')
            .select('id')
            .eq('user_id', user.id)
            .eq('document_id', docId)
            .maybeSingle();
          setBookmarked(!!bm);
        }
      } catch {}
      finally { setLoading(false); }
    };
    fetchDoc();
  }, [docId]);

  const handleDownload = async () => {
    if (!doc?.file_path) {
      toast.error('File not available for download.');
      return;
    }
    setDownloading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.storage
        .from('documents')
        .createSignedUrl(doc.file_path, 60);
      if (error || !data?.signedUrl) {
        toast.error('Could not generate download link. Please try again.');
        return;
      }

      // Fetch as blob to avoid Chrome cross-origin download blocking
      const response = await fetch(data.signedUrl);
      if (!response.ok) {
        toast.error('Download failed. Please try again.');
        return;
      }
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);

      // Increment download count
      await supabase
        .from('documents')
        .update({ download_count: (doc.download_count || 0) + 1 })
        .eq('id', doc.id);

      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = doc.file_name || doc.title;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);

      toast.success(`Downloading ${doc.file_name || doc.title}`);
      setDoc(prev => prev ? { ...prev, download_count: (prev.download_count || 0) + 1 } : prev);
    } catch {
      toast.error('Download failed. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  const handleBookmark = async () => {
    if (!currentUser) {
      toast.error('Please sign in to save documents.');
      return;
    }
    if (!docId) return;
    setBookmarkLoading(true);
    try {
      const supabase = createClient();
      if (bookmarked) {
        await supabase
          .from('bookmarks')
          .delete()
          .eq('user_id', currentUser.id)
          .eq('document_id', docId);
        setBookmarked(false);
        toast.success('Removed from saved files');
      } else {
        await supabase
          .from('bookmarks')
          .insert({ user_id: currentUser.id, document_id: docId });
        setBookmarked(true);
        toast.success('Saved to your library');
      }
    } catch {
      toast.error('Failed to update bookmark. Please try again.');
    } finally {
      setBookmarkLoading(false);
    }
  };

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href).catch(() => {});
    toast.success('Link copied to clipboard!');
  };

  const fileType = doc?.file_type?.includes('pdf')
    ? 'pdf'
    : doc?.file_type?.includes('word') || doc?.file_name?.endsWith('.docx')
    ? 'docx' :'ppt';

  const fileTypeColor = fileType === 'pdf' ? 'red' : fileType === 'docx' ? 'blue' : 'orange';
  const uploaderName = doc?.user_profiles?.full_name || 'Anonymous';
  const uploadedAt = doc?.created_at
    ? new Date(doc.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : '';

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 flex items-center justify-center min-h-[200px]">
        <svg className="animate-spin w-6 h-6 text-indigo-400" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 text-center text-gray-500">
        Document not found.
      </div>
    );
  }

  return (
    <div>
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-gray-500 mb-4">
        <Link href="/home-screen" className="hover:text-indigo-600 transition-colors">Home</Link>
        <Icon name="ChevronRightIcon" size={12} className="text-gray-300" />
        <span className="hover:text-indigo-600 cursor-pointer transition-colors">{doc.subject || 'Documents'}</span>
        <Icon name="ChevronRightIcon" size={12} className="text-gray-300" />
        <span className="text-gray-700 font-medium truncate">{doc.title}</span>
      </nav>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 lg:p-6">
        <div className="flex flex-col lg:flex-row lg:items-start gap-4">
          {/* File Type Icon */}
          <div className={`flex-shrink-0 w-14 h-14 bg-${fileTypeColor}-50 border-2 border-${fileTypeColor}-100 rounded-xl flex flex-col items-center justify-center`}>
            <Icon name="DocumentTextIcon" size={22} className={`text-${fileTypeColor}-500`} />
            <span className={`text-xs font-display font-700 text-${fileTypeColor}-600 mt-0.5`}>{fileType.toUpperCase()}</span>
          </div>

          {/* Title + Meta */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-3 flex-wrap">
              <h1 className="font-display font-700 text-xl lg:text-2xl text-gray-900 leading-tight flex-1">
                {doc.title}
              </h1>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <Badge variant={fileType as 'pdf' | 'docx' | 'ppt'} label={fileType.toUpperCase()} />
              </div>
            </div>

            {/* Description */}
            {doc.description && (
              <p className="text-sm text-gray-600 mt-2 leading-relaxed max-w-3xl">{doc.description}</p>
            )}

            {/* Meta Row */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-3">
              {doc.subject && (
                <div className="flex items-center gap-1.5 text-sm text-gray-600">
                  <Icon name="AcademicCapIcon" size={14} className="text-indigo-400" />
                  <span className="font-medium">{doc.subject}</span>
                </div>
              )}
              {doc.university && (
                <div className="flex items-center gap-1.5 text-sm text-gray-600">
                  <Icon name="BuildingLibraryIcon" size={14} className="text-gray-400" />
                  {doc.university}
                </div>
              )}
              <div className="flex items-center gap-1.5 text-sm text-gray-500">
                <Icon name="ArrowDownTrayIcon" size={14} className="text-gray-400" />
                <span className="tabular-nums">{(doc.download_count || 0).toLocaleString()} downloads</span>
              </div>
              {uploadedAt && (
                <div className="flex items-center gap-1.5 text-sm text-gray-500">
                  <Icon name="CalendarDaysIcon" size={14} className="text-gray-400" />
                  {uploadedAt}
                </div>
              )}
              {doc.file_size > 0 && (
                <div className="flex items-center gap-1.5 text-sm text-gray-500">
                  <Icon name="DocumentTextIcon" size={14} className="text-gray-400" />
                  {(doc.file_size / (1024 * 1024)).toFixed(1)} MB
                </div>
              )}
            </div>

            {/* Contributor */}
            <div className="flex items-center gap-2 mt-3">
              <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-display font-600 text-xs">
                {uploaderName.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-xs text-gray-500">Uploaded by</p>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-medium text-gray-800">{uploaderName}</span>
                  <Badge variant="contributor" label="Contributor" />
                </div>
              </div>
            </div>

            {/* Tags */}
            {doc.tags && doc.tags.length > 0 && (
              <div className="flex items-center gap-2 mt-3 flex-wrap">
                <div className="flex items-center gap-1 text-xs text-violet-600 bg-violet-50 px-2 py-0.5 rounded-md border border-violet-100">
                  <Icon name="SparklesIcon" size={11} />
                  <span className="font-medium">Tags</span>
                </div>
                {doc.tags.map((tag) => (
                  <span key={`tag-${tag}`} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-md hover:bg-indigo-50 hover:text-indigo-700 cursor-pointer transition-colors">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-row lg:flex-col gap-2 flex-shrink-0 w-full lg:w-auto lg:min-w-[160px]">
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 disabled:opacity-70 text-white text-sm font-display font-600 rounded-xl transition-all duration-150 shadow-sm w-full"
            >
              {downloading ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Downloading...
                </>
              ) : (
                <>
                  <Icon name="ArrowDownTrayIcon" size={16} />
                  Download {fileType.toUpperCase()}
                </>
              )}
            </button>

            <div className="flex gap-2">
              <button
                onClick={handleBookmark}
                disabled={bookmarkLoading}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border text-sm font-medium transition-all duration-150 disabled:opacity-60 ${
                  bookmarked
                    ? 'bg-amber-50 border-amber-200 text-amber-700' :'bg-white border-gray-200 text-gray-600 hover:border-amber-200 hover:text-amber-600'
                }`}
              >
                {bookmarkLoading ? (
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <Icon name={bookmarked ? 'BookmarkSolidIcon' : 'BookmarkIcon'} size={15} />
                )}
                {bookmarked ? 'Saved' : 'Save'}
              </button>
              <button
                onClick={handleShare}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 bg-white text-gray-600 hover:border-indigo-200 hover:text-indigo-600 text-sm font-medium transition-all duration-150"
              >
                <Icon name="ShareIcon" size={15} />
                Share
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
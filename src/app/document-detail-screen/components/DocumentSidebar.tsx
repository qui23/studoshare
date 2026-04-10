'use client';
import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Icon from '@/components/ui/AppIcon';
import { createClient } from '@/lib/supabase/client';

interface DocStats {
  download_count: number;
  file_type: string;
  file_size: number;
  file_name: string;
  created_at: string;
  updated_at: string | null;
  doc_type: string | null;
  subject: string | null;
  university: string | null;
  semester: string | null;
  year: string | null;
  course_code: string | null;
  visibility: string;
}

export default function DocumentSidebar() {
  const searchParams = useSearchParams();
  const docId = searchParams.get('id');

  const [stats, setStats] = useState<DocStats | null>(null);
  const [bookmarkCount, setBookmarkCount] = useState(0);
  const [commentCount, setCommentCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!docId) return;
    const supabase = createClient();

    const fetchAll = async () => {
      setLoading(true);
      const [docRes, bookmarkRes, commentRes] = await Promise.all([
        supabase
          .from('documents')
          .select('download_count, file_type, file_size, file_name, created_at, updated_at, doc_type, subject, university, semester, year, course_code, visibility')
          .eq('id', docId)
          .single(),
        supabase
          .from('bookmarks')
          .select('id', { count: 'exact', head: true })
          .eq('document_id', docId),
        supabase
          .from('comments')
          .select('id', { count: 'exact', head: true })
          .eq('document_id', docId),
      ]);

      if (docRes.data) setStats(docRes.data as DocStats);
      setBookmarkCount(bookmarkRes.count || 0);
      setCommentCount(commentRes.count || 0);
      setLoading(false);
    };

    fetchAll();
  }, [docId]);

  const fileExt = stats?.file_name?.split('.').pop()?.toUpperCase() || stats?.file_type?.split('/').pop()?.toUpperCase() || '—';
  const fileSizeMB = stats?.file_size ? `${(stats.file_size / (1024 * 1024)).toFixed(2)} MB` : '—';
  const uploadedAt = stats?.created_at
    ? new Date(stats.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : '—';
  const updatedAt = stats?.updated_at
    ? new Date(stats.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : uploadedAt;

  const docInfoItems = [
    stats?.subject ? { label: 'Subject', value: stats.subject, icon: 'AcademicCapIcon' } : null,
    stats?.university ? { label: 'University', value: stats.university, icon: 'BuildingLibraryIcon' } : null,
    stats?.doc_type ? { label: 'Doc Type', value: stats.doc_type, icon: 'DocumentTextIcon' } : null,
    { label: 'File Type', value: fileExt, icon: 'PaperClipIcon' },
    { label: 'File Size', value: fileSizeMB, icon: 'ServerIcon' },
    stats?.course_code ? { label: 'Course Code', value: stats.course_code, icon: 'HashtagIcon' } : null,
    stats?.semester ? { label: 'Semester', value: stats.semester, icon: 'CalendarIcon' } : null,
    stats?.year ? { label: 'Year', value: stats.year, icon: 'CalendarDaysIcon' } : null,
    { label: 'Uploaded', value: uploadedAt, icon: 'ArrowUpTrayIcon' },
    { label: 'Last Updated', value: updatedAt, icon: 'ClockIcon' },
    stats?.visibility ? { label: 'Visibility', value: stats.visibility.charAt(0).toUpperCase() + stats.visibility.slice(1), icon: 'GlobeAltIcon' } : null,
  ].filter(Boolean) as { label: string; value: string; icon: string }[];

  return (
    <aside className="w-full lg:w-64 xl:w-72 flex-shrink-0 space-y-4 lg:sticky lg:top-24">
      {/* Document Stats */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-50 flex items-center gap-2">
          <Icon name="ChartBarIcon" size={15} className="text-indigo-600" />
          <span className="font-display font-600 text-sm text-gray-900">Document Stats</span>
        </div>
        <div className="p-4 grid grid-cols-2 gap-3">
          {[
            {
              label: 'Downloads',
              value: loading ? '—' : (stats?.download_count || 0).toLocaleString(),
              icon: 'ArrowDownTrayIcon',
              color: 'text-indigo-600 bg-indigo-50',
            },
            {
              label: 'Comments',
              value: loading ? '—' : commentCount.toLocaleString(),
              icon: 'ChatBubbleLeftRightIcon',
              color: 'text-cyan-600 bg-cyan-50',
            },
            {
              label: 'Bookmarks',
              value: loading ? '—' : bookmarkCount.toLocaleString(),
              icon: 'BookmarkIcon',
              color: 'text-amber-600 bg-amber-50',
            },
            {
              label: 'File Size',
              value: loading ? '—' : fileSizeMB,
              icon: 'ServerIcon',
              color: 'text-green-600 bg-green-50',
            },
          ].map((stat) => (
            <div key={`stat-${stat.label}`} className="flex flex-col items-center p-2.5 bg-gray-50 rounded-lg">
              <div className={`p-1.5 rounded-md mb-1.5 ${stat.color}`}>
                <Icon name={stat.icon as any} size={14} />
              </div>
              <span className="font-display font-700 text-sm text-gray-900 tabular-nums">{stat.value}</span>
              <span className="text-xs text-gray-500 mt-0.5">{stat.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Document Info */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-50 flex items-center gap-2">
          <Icon name="InformationCircleIcon" size={15} className="text-indigo-600" />
          <span className="font-display font-600 text-sm text-gray-900">Document Info</span>
        </div>
        <div className="p-4 space-y-3">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center justify-between animate-pulse">
                  <div className="h-3 bg-gray-100 rounded w-20" />
                  <div className="h-3 bg-gray-100 rounded w-16" />
                </div>
              ))}
            </div>
          ) : (
            docInfoItems.map((info) => (
              <div key={`info-${info.label}`} className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Icon name={info.icon as any} size={13} className="text-gray-400" />
                  <span className="text-xs text-gray-500">{info.label}</span>
                </div>
                <span className="text-xs font-medium text-gray-800 text-right truncate max-w-[120px]" title={info.value}>
                  {info.value}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Report */}
      <button className="w-full flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200 text-xs text-gray-500 hover:border-red-200 hover:text-red-500 hover:bg-red-50 transition-all duration-150 font-medium">
        <Icon name="FlagIcon" size={13} />
        Report this document
      </button>
    </aside>
  );
}
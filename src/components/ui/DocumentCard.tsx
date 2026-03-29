'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import Badge from './Badge';
import Icon from '@/components/ui/AppIcon';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

export interface DocumentCardData {
  id: string;
  title: string;
  description: string;
  subject: string;
  university: string;
  fileType: 'pdf' | 'docx' | 'ppt';
  rating: number;
  ratingCount: number;
  downloads: number;
  pages: number;
  contributor: string;
  contributorRole: 'contributor' | 'admin';
  uploadedAt: string;
  isNew?: boolean;
  isTrending?: boolean;
  tags: string[];
  filePath?: string;
  fileName?: string;
}

interface DocumentCardProps {
  doc: DocumentCardData;
}

const fileTypeIcons: Record<string, string> = {
  pdf: 'DocumentTextIcon',
  docx: 'DocumentIcon',
  ppt: 'PresentationChartBarIcon',
};

export default function DocumentCard({ doc }: DocumentCardProps) {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!doc.filePath) {
      toast.error('File not available for download.');
      return;
    }
    setDownloading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.storage
        .from('documents')
        .createSignedUrl(doc.filePath, 60);
      if (error || !data?.signedUrl) {
        toast.error('Could not generate download link.');
        return;
      }
      const a = document.createElement('a');
      a.href = data.signedUrl;
      a.download = doc.fileName || doc.title;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      toast.success(`Downloading ${doc.fileName || doc.title}`);
    } catch {
      toast.error('Download failed. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Link
      href={`/document-detail-screen?id=${doc.id}`}
      className="group block bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all duration-200 overflow-hidden"
    >
      {/* File Type Header */}
      <div className={`h-2 w-full ${doc.fileType === 'pdf' ? 'bg-red-400' : doc.fileType === 'docx' ? 'bg-blue-400' : 'bg-orange-400'}`} />

      <div className="p-4">
        {/* Top Row */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <Badge variant={doc.fileType} label={doc.fileType.toUpperCase()} />
            {doc.isNew && <Badge variant="new" label="New" />}
            {doc.isTrending && <Badge variant="trending" label="🔥 Trending" />}
          </div>
          <div className="flex items-center gap-1 text-gray-400 text-xs flex-shrink-0">
            <Icon name="DocumentTextIcon" size={12} />
            <span className="tabular-nums">{doc.pages}p</span>
          </div>
        </div>

        {/* Title */}
        <h3 className="font-display font-600 text-sm text-gray-900 line-clamp-2 group-hover:text-indigo-700 transition-colors mb-1 leading-snug">
          {doc.title}
        </h3>

        {/* Description */}
        <p className="text-xs text-gray-500 line-clamp-2 mb-3 leading-relaxed">{doc.description}</p>

        {/* Subject + University */}
        <div className="flex flex-col gap-1 mb-3">
          <div className="flex items-center gap-1.5 text-xs text-gray-600">
            <Icon name="AcademicCapIcon" size={12} className="text-indigo-400 flex-shrink-0" />
            <span className="truncate font-medium">{doc.subject}</span>
          </div>
        </div>

        {/* Tags */}
        {doc.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {doc.tags.slice(0, 3).map((tag) => (
              <span key={`tag-${doc.id}-${tag}`} className="px-1.5 py-0.5 bg-gray-100 text-gray-500 text-xs rounded-md">
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-50">
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-display font-600 text-xs">
              {doc.contributor.charAt(0)}
            </div>
            <span className="text-xs text-gray-600 truncate max-w-[80px]">{doc.contributor}</span>
            <Badge variant={doc.contributorRole} label={doc.contributorRole === 'admin' ? 'Admin' : 'Pro'} />
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-xs text-gray-400 tabular-nums">
              <Icon name="ArrowDownTrayIcon" size={12} />
              <span>{doc.downloads >= 1000 ? `${(doc.downloads / 1000).toFixed(1)}k` : doc.downloads}</span>
            </div>
            {doc.filePath && (
              <button
                onClick={handleDownload}
                disabled={downloading}
                title="Download file"
                className="flex items-center justify-center w-6 h-6 rounded-md bg-indigo-50 hover:bg-indigo-100 text-indigo-600 disabled:opacity-50 transition-colors"
              >
                {downloading ? (
                  <svg className="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <Icon name="ArrowDownTrayIcon" size={12} />
                )}
              </button>
            )}
          </div>
        </div>

        <div className="mt-1.5 text-xs text-gray-400">{doc.uploadedAt}</div>
      </div>
    </Link>
  );
}
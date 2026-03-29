'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import Badge from '@/components/ui/Badge';
import Icon from '@/components/ui/AppIcon';
import { createClient } from '@/lib/supabase/client';

interface RelatedDoc {
  id: string;
  title: string;
  subject: string;
  file_type: string;
  file_name: string;
  download_count: number;
}

export default function RelatedDocuments() {
  const searchParams = useSearchParams();
  const docId = searchParams.get('id');
  const [related, setRelated] = useState<RelatedDoc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!docId) { setLoading(false); return; }
    const supabase = createClient();

    const fetchRelated = async () => {
      setLoading(true);
      try {
        // Get current doc's subject first
        const { data: current } = await supabase
          .from('documents')
          .select('subject')
          .eq('id', docId)
          .single();

        let query = supabase
          .from('documents')
          .select('id, title, subject, file_type, file_name, download_count')
          .neq('id', docId)
          .eq('visibility', 'public')
          .limit(4);

        if (current?.subject) {
          query = query.eq('subject', current.subject);
        }

        const { data } = await query.order('download_count', { ascending: false });
        setRelated((data as RelatedDoc[]) || []);
      } catch {
        setRelated([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRelated();
  }, [docId]);

  if (loading) {
    return (
      <div className="mt-6">
        <div className="flex items-center gap-2 mb-4">
          <Icon name="SparklesIcon" size={16} className="text-violet-600" />
          <h2 className="font-display font-700 text-lg text-gray-900">Related Documents</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 shadow-sm h-36 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (related.length === 0) return null;

  return (
    <div className="mt-6">
      <div className="flex items-center gap-2 mb-4">
        <Icon name="SparklesIcon" size={16} className="text-violet-600" />
        <h2 className="font-display font-700 text-lg text-gray-900">Related Documents</h2>
        <span className="text-sm text-gray-400">— you might also like</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {related.map((doc) => {
          const ext = doc.file_name?.split('.').pop()?.toLowerCase() || doc.file_type?.split('/').pop()?.toLowerCase() || 'pdf';
          const fileType = ext === 'docx' || ext === 'doc' ? 'docx' : ext === 'ppt' || ext === 'pptx' ? 'ppt' : 'pdf';
          const barColor = fileType === 'pdf' ? 'bg-red-400' : fileType === 'docx' ? 'bg-blue-400' : 'bg-orange-400';

          return (
            <Link
              key={doc.id}
              href={`/document-detail-screen?id=${doc.id}`}
              className="group bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all duration-200 overflow-hidden"
            >
              <div className={`h-1.5 w-full ${barColor}`} />
              <div className="p-4">
                <div className="flex items-center gap-1.5 mb-2">
                  <Badge variant={fileType as 'pdf' | 'docx' | 'ppt'} label={fileType.toUpperCase()} />
                  {doc.subject && (
                    <span className="text-xs text-violet-600 bg-violet-50 px-1.5 py-0.5 rounded-md font-medium truncate max-w-[80px]">{doc.subject}</span>
                  )}
                </div>
                <h3 className="font-display font-600 text-sm text-gray-900 line-clamp-2 group-hover:text-indigo-700 transition-colors mb-2 leading-snug">
                  {doc.title}
                </h3>
                <div className="flex items-center justify-end mt-3 pt-2 border-t border-gray-50">
                  <div className="flex items-center gap-1 text-xs text-gray-400 tabular-nums">
                    <Icon name="ArrowDownTrayIcon" size={11} />
                    {(doc.download_count || 0) >= 1000
                      ? `${((doc.download_count || 0) / 1000).toFixed(1)}k`
                      : (doc.download_count || 0)}
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
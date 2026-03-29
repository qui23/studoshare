'use client';
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Icon from '@/components/ui/AppIcon';
import { createClient } from '@/lib/supabase/client';

interface PreviewData {
  file_path: string;
  file_name: string;
  file_type: string;
  title: string;
}

export default function DocumentPreviewPanel() {
  const searchParams = useSearchParams();
  const docId = searchParams.get('id');

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [docData, setDocData] = useState<PreviewData | null>(null);
  const [fullscreen, setFullscreen] = useState(false);

  useEffect(() => {
    if (!docId) {
      setLoading(false);
      setError('No document selected.');
      return;
    }

    const fetchPreview = async () => {
      setLoading(true);
      setError(null);
      try {
        const supabase = createClient();

        const { data: doc, error: docError } = await supabase
          .from('documents')
          .select('file_path, file_name, file_type, title')
          .eq('id', docId)
          .single();

        if (docError || !doc) {
          setError('Document not found.');
          setLoading(false);
          return;
        }

        setDocData(doc as PreviewData);

        if (!doc.file_path) {
          setError('No file available for preview.');
          setLoading(false);
          return;
        }

        const { data: signedData, error: signedError } = await supabase.storage
          .from('documents')
          .createSignedUrl(doc.file_path, 3600);

        if (signedError || !signedData?.signedUrl) {
          setError('Could not generate preview link.');
          setLoading(false);
          return;
        }

        setPreviewUrl(signedData.signedUrl);
      } catch (err) {
        setError('Failed to load document preview.');
      } finally {
        setLoading(false);
      }
    };

    fetchPreview();
  }, [docId]);

  const isPdf = docData?.file_type?.includes('pdf') || docData?.file_name?.endsWith('.pdf');

  return (
    <div className={`bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden ${fullscreen ? 'fixed inset-4 z-50' : ''}`}>
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 bg-gray-50">
        <div className="flex items-center gap-2">
          <Icon name="DocumentTextIcon" size={15} className="text-indigo-600" />
          <span className="font-display font-600 text-sm text-gray-700 truncate max-w-[200px]">
            {docData?.title || 'Document Preview'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {previewUrl && (
            <a
              href={previewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-lg border border-gray-200 bg-white text-gray-500 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50 transition-all duration-150"
              title="Open in new tab"
            >
              <Icon name="ArrowTopRightOnSquareIcon" size={14} />
            </a>
          )}
          <button
            onClick={() => setFullscreen(!fullscreen)}
            className="p-1.5 rounded-lg border border-gray-200 bg-white text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-all duration-150"
            aria-label={fullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          >
            <Icon name={fullscreen ? 'ArrowsPointingInIcon' : 'ArrowsPointingOutIcon'} size={14} />
          </button>
        </div>
      </div>

      {/* Preview Content */}
      <div className={`bg-gray-100 ${fullscreen ? 'h-[calc(100%-48px)]' : 'min-h-[520px]'} flex items-center justify-center`}>
        {loading && (
          <div className="flex flex-col items-center gap-3 py-20">
            <svg className="animate-spin w-8 h-8 text-indigo-400" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <p className="text-sm text-gray-400">Loading preview...</p>
          </div>
        )}

        {!loading && error && (
          <div className="flex flex-col items-center gap-3 py-20 text-center px-6">
            <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center">
              <Icon name="ExclamationCircleIcon" size={24} className="text-red-400" />
            </div>
            <p className="text-sm font-medium text-gray-700">{error}</p>
          </div>
        )}

        {!loading && !error && previewUrl && isPdf && (
          <iframe
            src={`${previewUrl}#toolbar=1&navpanes=1`}
            className="w-full border-0"
            style={{ height: fullscreen ? '100%' : '520px' }}
            title={docData?.title || 'Document Preview'}
          />
        )}

        {!loading && !error && previewUrl && !isPdf && (
          <div className="flex flex-col items-center gap-4 py-20 text-center px-6">
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex flex-col items-center justify-center border-2 border-blue-100">
              <Icon name="DocumentIcon" size={28} className="text-blue-500" />
              <span className="text-xs font-display font-700 text-blue-600 mt-0.5">
                {docData?.file_name?.split('.').pop()?.toUpperCase() || 'FILE'}
              </span>
            </div>
            <div>
              <p className="font-display font-600 text-gray-800 mb-1">{docData?.title}</p>
              <p className="text-sm text-gray-500 mb-4">Preview not available for this file type.</p>
              <a
                href={previewUrl}
                download={docData?.file_name}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-display font-600 rounded-xl transition-all duration-150"
              >
                <Icon name="ArrowDownTrayIcon" size={15} />
                Download File
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
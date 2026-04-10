import React, { Suspense } from 'react';
import AppLayout from '@/components/AppLayout';
import DocumentDetailHeader from './components/DocumentDetailHeader';
import DocumentSidebar from './components/DocumentSidebar';
import DocumentPreviewPanel from './components/DocumentPreviewPanel';
import CommentSection from './components/CommentSection';
import RelatedDocuments from './components/RelatedDocuments';

interface DocumentDetailScreenProps {
  searchParams: Promise<{ id?: string }>;
}

export default async function DocumentDetailScreen({ searchParams }: DocumentDetailScreenProps) {
  const params = await searchParams;
  const documentId = params.id;

  return (
    <AppLayout>
      <Suspense fallback={<div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 h-48 animate-pulse" />}>
        <DocumentDetailHeader />
      </Suspense>

      {/* Document Preview */}
      <div className="mt-6">
        <Suspense fallback={<div className="bg-white rounded-xl border border-gray-100 shadow-sm h-[520px] animate-pulse" />}>
          <DocumentPreviewPanel />
        </Suspense>
      </div>

      <div className="mt-6 flex flex-col lg:flex-row gap-6 items-start">
        <div className="flex-1 min-w-0 space-y-6 w-full">
          <CommentSection documentId={documentId} />
        </div>
        {/* Sidebar: shown inline on mobile (below comments), sticky on desktop */}
        <Suspense fallback={<div className="w-full lg:w-64 xl:w-72 flex-shrink-0 space-y-4" />}>
          <DocumentSidebar />
        </Suspense>
      </div>
      <Suspense fallback={null}>
        <RelatedDocuments />
      </Suspense>
    </AppLayout>
  );
}
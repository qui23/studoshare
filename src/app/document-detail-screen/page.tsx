import React, { Suspense } from 'react';
import AppLayout from '@/components/AppLayout';
import DocumentDetailHeader from './components/DocumentDetailHeader';
import DocumentSidebar from './components/DocumentSidebar';
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
      <div className="mt-6 flex gap-6 items-start">
        <div className="flex-1 min-w-0 space-y-6">
          <CommentSection documentId={documentId} />
        </div>
        <Suspense fallback={<div className="hidden lg:block w-64 xl:w-72 flex-shrink-0 space-y-4" />}>
          <DocumentSidebar />
        </Suspense>
      </div>
      <Suspense fallback={null}>
        <RelatedDocuments />
      </Suspense>
    </AppLayout>
  );
}
import React from 'react';
import AppLayout from '@/components/AppLayout';
import UploadForm from './components/UploadForm';

export default function UploadScreen() {
  return (
    <AppLayout>
      <div className="max-w-3xl xl:max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="font-display font-700 text-2xl text-gray-900 mb-1">Upload Study Material</h1>
          <p className="text-sm text-gray-500">Share your notes, past papers, or summaries with students worldwide. Earn Contributor status and help others succeed.</p>
        </div>
        <UploadForm />
      </div>
    </AppLayout>
  );
}
import React from 'react';
import Topbar from './Topbar';
import { Toaster } from 'sonner';

interface AppLayoutProps {
  children: React.ReactNode;
  fullWidth?: boolean;
}

export default function AppLayout({ children, fullWidth }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Topbar />
      <main className={fullWidth ? 'w-full' : 'max-w-screen-2xl mx-auto px-3 sm:px-4 lg:px-8 xl:px-10 2xl:px-16 py-4 sm:py-6'}>
        {children}
      </main>
      <Toaster position="bottom-right" richColors expand={false} />
    </div>
  );
}
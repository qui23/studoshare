import React from 'react';
import { Toaster } from 'sonner';
import AuthForm from './components/AuthForm';
import AuthBrandPanel from './components/AuthBrandPanel';

export default function LoginRegisterScreen() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-violet-50 flex">
      <Toaster position="bottom-right" richColors />
      <AuthBrandPanel />
      <div className="flex-1 flex items-center justify-center p-6 lg:p-10">
        <AuthForm />
      </div>
    </div>
  );
}
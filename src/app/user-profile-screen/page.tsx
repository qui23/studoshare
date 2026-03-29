'use client';
import React, { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import Icon from '@/components/ui/AppIcon';
import DocumentCard, { DocumentCardData } from '@/components/ui/DocumentCard';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

interface ProfileStats {
  totalDocuments: number;
  totalDownloads: number;
}

interface UserSettings {
  full_name: string;
  email: string;
  role: string;
}

function mapDocToCard(doc: any): DocumentCardData {
  const fileType = doc.file_type?.includes('pdf')
    ? 'pdf'
    : doc.file_type?.includes('word') || doc.file_name?.endsWith('.docx')
    ? 'docx' :'ppt';

  const uploadedAt = doc.created_at
    ? new Date(doc.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : '';

  const daysSinceUpload = doc.created_at
    ? (Date.now() - new Date(doc.created_at).getTime()) / (1000 * 60 * 60 * 24)
    : 999;

  return {
    id: doc.id,
    title: doc.title,
    description: doc.description || '',
    subject: doc.subject || '',
    university: doc.university || '',
    fileType,
    rating: 4.5,
    ratingCount: Math.floor((doc.download_count || 0) / 10),
    downloads: doc.download_count || 0,
    pages: 0,
    contributor: doc.user_profiles?.full_name || 'You',
    contributorRole: (doc.user_profiles?.role === 'admin' ? 'admin' : 'contributor') as 'contributor' | 'admin',
    uploadedAt,
    isNew: daysSinceUpload <= 7,
    isTrending: (doc.download_count || 0) > 5000,
    tags: doc.tags || [],
  };
}

export default function UserProfileScreen() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const supabase = createClient();

  const [activeTab, setActiveTab] = useState<'documents' | 'settings'>('documents');
  const [documents, setDocuments] = useState<DocumentCardData[]>([]);
  const [stats, setStats] = useState<ProfileStats>({ totalDocuments: 0, totalDownloads: 0 });
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [settings, setSettings] = useState<UserSettings>({ full_name: '', email: '', role: '' });
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [settingsError, setSettingsError] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login-register-screen');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;
    setSettings({
      full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || '',
      email: user.email || '',
      role: 'student',
    });
    fetchUserData();
  }, [user]);

  const fetchUserData = async () => {
    if (!user) return;
    setLoadingDocs(true);
    try {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('full_name, role')
        .eq('id', user.id)
        .single();

      if (profile) {
        setSettings((prev) => ({ ...prev, full_name: profile.full_name || prev.full_name, role: profile.role || 'student' }));
      }

      const { data: docs, error } = await supabase
        .from('documents')
        .select(
          `id, title, description, subject, university, doc_type,
           file_type, file_name, file_size, download_count, tags,
           created_at, visibility,
           user_profiles!documents_uploader_id_fkey(full_name, role)`
        )
        .eq('uploader_id', user.id)
        .order('created_at', { ascending: false });

      if (!error && docs) {
        const mapped = docs.map(mapDocToCard);
        setDocuments(mapped);

        const totalDownloads = docs.reduce((sum, d) => sum + (d.download_count || 0), 0);

        setStats({
          totalDocuments: docs.length,
          totalDownloads,
        });
      }
    } catch (err) {
      console.log('Failed to load user data');
    } finally {
      setLoadingDocs(false);
    }
  };

  const handleDeleteDocument = async (docId: string) => {
    if (!user) return;
    setDeletingId(docId);
    try {
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', docId)
        .eq('uploader_id', user.id);

      if (!error) {
        setDocuments((prev) => prev.filter((d) => d.id !== docId));
        setStats((prev) => ({ ...prev, totalDocuments: prev.totalDocuments - 1 }));
      }
    } catch (err) {
      console.log('Failed to delete document');
    } finally {
      setDeletingId(null);
      setDeleteConfirmId(null);
    }
  };

  const handleSaveSettings = async () => {
    if (!user) return;
    setSettingsSaving(true);
    setSettingsError('');
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ full_name: settings.full_name, updated_at: new Date().toISOString() })
        .eq('id', user.id);

      if (error) throw error;

      await supabase.auth.updateUser({ data: { full_name: settings.full_name } });

      setSettingsSaved(true);
      setTimeout(() => setSettingsSaved(false), 3000);
    } catch (err: any) {
      setSettingsError(err?.message || 'Failed to save settings');
    } finally {
      setSettingsSaving(false);
    }
  };

  if (authLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-32">
          <svg className="animate-spin w-8 h-8 text-indigo-400" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      </AppLayout>
    );
  }

  if (!user) return null;

  const displayName = settings.full_name || user.email?.split('@')[0] || 'User';
  const initials = displayName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto py-8 px-4">
        {/* Profile Header */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            {/* Avatar */}
            <div className="w-20 h-20 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-700 font-display font-700 text-2xl flex-shrink-0">
              {initials}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h1 className="font-display font-700 text-xl text-gray-900">{displayName}</h1>
              <p className="text-sm text-gray-500 mt-0.5">{user.email}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-medium capitalize">
                  <Icon name="AcademicCapIcon" size={12} />
                  {settings.role}
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-50 text-green-700 text-xs font-medium">
                  <Icon name="CheckCircleIcon" size={12} />
                  Active
                </span>
              </div>
            </div>

            {/* Member Since */}
            <div className="text-right hidden sm:block">
              <p className="text-xs text-gray-400">Member since</p>
              <p className="text-sm font-medium text-gray-700">
                {user.created_at
                  ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                  : '—'}
              </p>
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {[
            { label: 'Documents', value: stats.totalDocuments, icon: 'DocumentTextIcon', color: 'indigo' },
            { label: 'Total Downloads', value: stats.totalDownloads.toLocaleString(), icon: 'ArrowDownTrayIcon', color: 'blue' },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-col gap-2">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-${stat.color}-50`}>
                <Icon name={stat.icon as any} size={16} className={`text-${stat.color}-500`} />
              </div>
              <div>
                <p className="font-display font-700 text-xl text-gray-900 tabular-nums">{stat.value}</p>
                <p className="text-xs text-gray-500">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1 mb-6 w-fit">
          {[
            { key: 'documents', label: 'My Documents', icon: 'DocumentTextIcon' },
            { key: 'settings', label: 'Settings', icon: 'Cog6ToothIcon' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                activeTab === tab.key
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon name={tab.icon as any} size={15} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Documents Tab */}
        {activeTab === 'documents' && (
          <div>
            {loadingDocs ? (
              <div className="flex flex-col items-center justify-center py-20">
                <svg className="animate-spin w-8 h-8 text-indigo-400 mb-3" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <p className="text-sm text-gray-400">Loading your documents...</p>
              </div>
            ) : documents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-xl border border-gray-100">
                <Icon name="DocumentTextIcon" size={40} className="text-gray-300 mb-3" />
                <p className="text-base font-medium text-gray-600">No documents yet</p>
                <p className="text-sm text-gray-400 mt-1 mb-4">Start contributing by uploading your first document</p>
                <a
                  href="/upload-screen"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  <Icon name="ArrowUpTrayIcon" size={15} />
                  Upload Document
                </a>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm text-gray-600">
                    <span className="font-display font-600 text-gray-900">{documents.length}</span> document{documents.length !== 1 ? 's' : ''} uploaded
                  </p>
                  <a
                    href="/upload-screen"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white text-xs font-medium rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    <Icon name="PlusIcon" size={13} />
                    Upload New
                  </a>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {documents.map((doc) => (
                    <div key={doc.id} className="relative group">
                      <DocumentCard doc={doc} />
                      {/* Delete overlay */}
                      {deleteConfirmId === doc.id ? (
                        <div className="absolute inset-0 bg-white/95 rounded-xl border border-red-100 flex flex-col items-center justify-center gap-3 p-4 z-10">
                          <Icon name="ExclamationTriangleIcon" size={28} className="text-red-400" />
                          <p className="text-sm font-medium text-gray-800 text-center">Delete this document?</p>
                          <p className="text-xs text-gray-500 text-center">This action cannot be undone.</p>
                          <div className="flex gap-2 mt-1">
                            <button
                              onClick={() => setDeleteConfirmId(null)}
                              className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleDeleteDocument(doc.id)}
                              disabled={deletingId === doc.id}
                              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 disabled:opacity-60 transition-colors"
                            >
                              {deletingId === doc.id ? (
                                <svg className="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                              ) : (
                                <Icon name="TrashIcon" size={12} />
                              )}
                              Delete
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirmId(doc.id)}
                          className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-red-50 hover:border-red-200 hover:text-red-500 text-gray-400"
                          title="Delete document"
                        >
                          <Icon name="TrashIcon" size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 max-w-lg">
            <h2 className="font-display font-600 text-base text-gray-900 mb-5">Account Settings</h2>

            <div className="flex flex-col gap-4">
              {/* Display Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Display Name</label>
                <input
                  type="text"
                  value={settings.full_name}
                  onChange={(e) => setSettings((prev) => ({ ...prev, full_name: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-900 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 transition-all"
                  placeholder="Your display name"
                />
              </div>

              {/* Email (read-only) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
                <input
                  type="email"
                  value={settings.email}
                  readOnly
                  className="w-full px-3 py-2.5 border border-gray-100 rounded-lg text-sm text-gray-500 bg-gray-50 outline-none cursor-not-allowed"
                />
                <p className="text-xs text-gray-400 mt-1">Email cannot be changed here</p>
              </div>

              {/* Role (read-only) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Role</label>
                <div className="flex items-center gap-2 px-3 py-2.5 border border-gray-100 rounded-lg bg-gray-50">
                  <Icon name="AcademicCapIcon" size={15} className="text-indigo-400" />
                  <span className="text-sm text-gray-600 capitalize">{settings.role}</span>
                </div>
              </div>

              {/* Error */}
              {settingsError && (
                <div className="flex items-center gap-2 px-3 py-2.5 bg-red-50 border border-red-100 rounded-lg">
                  <Icon name="ExclamationCircleIcon" size={15} className="text-red-500 flex-shrink-0" />
                  <p className="text-sm text-red-600">{settingsError}</p>
                </div>
              )}

              {/* Success */}
              {settingsSaved && (
                <div className="flex items-center gap-2 px-3 py-2.5 bg-green-50 border border-green-100 rounded-lg">
                  <Icon name="CheckCircleIcon" size={15} className="text-green-500 flex-shrink-0" />
                  <p className="text-sm text-green-600">Settings saved successfully!</p>
                </div>
              )}

              {/* Save Button */}
              <button
                onClick={handleSaveSettings}
                disabled={settingsSaving}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
              >
                {settingsSaving ? (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Saving...
                  </>
                ) : (
                  <>
                    <Icon name="CheckIcon" size={15} />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

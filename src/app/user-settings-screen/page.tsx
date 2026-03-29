'use client';
import React, { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import Icon from '@/components/ui/AppIcon';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

type SettingsTab = 'account' | 'privacy';

interface PrivacyPrefs {
  profileVisibility: 'public' | 'registered' | 'private';
  showEmail: boolean;
  showDocuments: boolean;
  showStats: boolean;
}

export default function UserSettingsScreen() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const supabase = createClient();

  const [activeTab, setActiveTab] = useState<SettingsTab>('account');

  // Account state
  const [email, setEmail] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [emailSaving, setEmailSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [emailMsg, setEmailMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Privacy state
  const [privacyPrefs, setPrivacyPrefs] = useState<PrivacyPrefs>({
    profileVisibility: 'public',
    showEmail: false,
    showDocuments: true,
    showStats: true,
  });
  const [privacySaving, setPrivacySaving] = useState(false);
  const [privacyMsg, setPrivacyMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login-register-screen');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;
    setEmail(user.email || '');
    setNewEmail(user.email || '');

    // Load saved preferences from user metadata
    const meta = user.user_metadata || {};
    if (meta.privacy_prefs) {
      setPrivacyPrefs({ ...privacyPrefs, ...meta.privacy_prefs });
    }
  }, [user]);

  const handleEmailUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail || newEmail === email) {
      setEmailMsg({ type: 'error', text: 'Please enter a different email address.' });
      return;
    }
    setEmailSaving(true);
    setEmailMsg(null);
    try {
      const { error } = await supabase.auth.updateUser({ email: newEmail });
      if (error) throw error;
      setEmailMsg({ type: 'success', text: 'Confirmation email sent. Check your inbox to verify the new address.' });
    } catch (err: any) {
      setEmailMsg({ type: 'error', text: err.message || 'Failed to update email.' });
    } finally {
      setEmailSaving(false);
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 8) {
      setPasswordMsg({ type: 'error', text: 'Password must be at least 8 characters.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'Passwords do not match.' });
      return;
    }
    setPasswordSaving(true);
    setPasswordMsg(null);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setPasswordMsg({ type: 'success', text: 'Password updated successfully.' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPasswordMsg({ type: 'error', text: err.message || 'Failed to update password.' });
    } finally {
      setPasswordSaving(false);
    }
  };

  const handlePrivacySave = async () => {
    setPrivacySaving(true);
    setPrivacyMsg(null);
    try {
      const { error } = await supabase.auth.updateUser({
        data: { privacy_prefs: privacyPrefs },
      });
      if (error) throw error;
      // Also update user_profiles table if it exists
      if (user) {
        await supabase
          .from('user_profiles')
          .update({ profile_visibility: privacyPrefs.profileVisibility })
          .eq('id', user.id);
      }
      setPrivacyMsg({ type: 'success', text: 'Privacy settings saved.' });
    } catch (err: any) {
      setPrivacyMsg({ type: 'error', text: err.message || 'Failed to save settings.' });
    } finally {
      setPrivacySaving(false);
    }
  };

  const tabs: { id: SettingsTab; label: string; icon: string }[] = [
    { id: 'account', label: 'Account', icon: 'UserCircleIcon' },
    { id: 'privacy', label: 'Privacy', icon: 'ShieldCheckIcon' },
  ];

  if (authLoading) {
    return (
      <AppLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 lg:px-8 py-10">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-display font-700 text-gray-900">Settings</h1>
            <p className="text-sm text-gray-500 mt-1">Manage your account and privacy preferences.</p>
          </div>

          <div className="flex flex-col md:flex-row gap-6">
            {/* Sidebar Tabs */}
            <aside className="md:w-52 flex-shrink-0">
              <nav className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3.5 text-sm font-medium transition-all duration-150 border-b border-gray-50 last:border-0 ${
                      activeTab === tab.id
                        ? 'bg-indigo-50 text-indigo-700 border-l-2 border-l-indigo-600' :'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <Icon name={tab.icon as any} size={16} />
                    {tab.label}
                  </button>
                ))}
              </nav>
            </aside>

            {/* Main Content */}
            <div className="flex-1 min-w-0 space-y-5">
              {/* ── ACCOUNT TAB ── */}
              {activeTab === 'account' && (
                <>
                  {/* Change Email */}
                  <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                    <h2 className="text-base font-display font-600 text-gray-900 mb-1">Email Address</h2>
                    <p className="text-xs text-gray-500 mb-5">Update the email associated with your account.</p>
                    <form onSubmit={handleEmailUpdate} className="space-y-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1.5">Current Email</label>
                        <input
                          type="email"
                          value={email}
                          disabled
                          className="w-full px-3 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-sm text-gray-500 cursor-not-allowed"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1.5">New Email</label>
                        <input
                          type="email"
                          value={newEmail}
                          onChange={(e) => setNewEmail(e.target.value)}
                          placeholder="Enter new email address"
                          className="w-full px-3 py-2.5 rounded-lg border border-gray-200 bg-white text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                        />
                      </div>
                      {emailMsg && (
                        <div className={`flex items-start gap-2 p-3 rounded-lg text-xs ${emailMsg.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                          <Icon name={emailMsg.type === 'success' ? 'CheckCircleIcon' : 'ExclamationCircleIcon'} size={14} className="mt-0.5 flex-shrink-0" />
                          {emailMsg.text}
                        </div>
                      )}
                      <button
                        type="submit"
                        disabled={emailSaving}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-60 transition-colors"
                      >
                        {emailSaving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Icon name="EnvelopeIcon" size={14} />}
                        Update Email
                      </button>
                    </form>
                  </div>

                  {/* Change Password */}
                  <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                    <h2 className="text-base font-display font-600 text-gray-900 mb-1">Password</h2>
                    <p className="text-xs text-gray-500 mb-5">Choose a strong password with at least 8 characters.</p>
                    <form onSubmit={handlePasswordUpdate} className="space-y-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1.5">New Password</label>
                        <input
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Enter new password"
                          className="w-full px-3 py-2.5 rounded-lg border border-gray-200 bg-white text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1.5">Confirm New Password</label>
                        <input
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Repeat new password"
                          className="w-full px-3 py-2.5 rounded-lg border border-gray-200 bg-white text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                        />
                      </div>
                      {passwordMsg && (
                        <div className={`flex items-start gap-2 p-3 rounded-lg text-xs ${passwordMsg.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                          <Icon name={passwordMsg.type === 'success' ? 'CheckCircleIcon' : 'ExclamationCircleIcon'} size={14} className="mt-0.5 flex-shrink-0" />
                          {passwordMsg.text}
                        </div>
                      )}
                      <button
                        type="submit"
                        disabled={passwordSaving}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-60 transition-colors"
                      >
                        {passwordSaving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Icon name="LockClosedIcon" size={14} />}
                        Update Password
                      </button>
                    </form>
                  </div>
                </>
              )}

              {/* ── PRIVACY TAB ── */}
              {activeTab === 'privacy' && (
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                  <h2 className="text-base font-display font-600 text-gray-900 mb-1">Privacy Controls</h2>
                  <p className="text-xs text-gray-500 mb-6">Control who can see your profile and activity.</p>

                  {/* Profile Visibility */}
                  <div className="mb-6">
                    <p className="text-sm font-medium text-gray-800 mb-1">Profile Visibility</p>
                    <p className="text-xs text-gray-500 mb-3">Who can view your profile page.</p>
                    <div className="space-y-2">
                      {([
                        { value: 'public', label: 'Public', desc: 'Anyone on the internet can view your profile', icon: 'GlobeAltIcon' },
                        { value: 'registered', label: 'Registered users only', desc: 'Only signed-in StudoShare members can view your profile', icon: 'UsersIcon' },
                        { value: 'private', label: 'Private', desc: 'Only you can view your profile', icon: 'LockClosedIcon' },
                      ] as const).map(({ value, label, desc, icon }) => (
                        <label
                          key={value}
                          className={`flex items-start gap-3 p-3.5 rounded-lg border cursor-pointer transition-all ${
                            privacyPrefs.profileVisibility === value
                              ? 'border-indigo-400 bg-indigo-50' :'border-gray-200 hover:border-gray-300 bg-white'
                          }`}
                        >
                          <input
                            type="radio"
                            name="profileVisibility"
                            value={value}
                            checked={privacyPrefs.profileVisibility === value}
                            onChange={() => setPrivacyPrefs((p) => ({ ...p, profileVisibility: value }))}
                            className="mt-0.5 accent-indigo-600"
                          />
                          <div className="flex items-start gap-2.5 flex-1">
                            <Icon name={icon as any} size={16} className={`mt-0.5 flex-shrink-0 ${privacyPrefs.profileVisibility === value ? 'text-indigo-600' : 'text-gray-400'}`} />
                            <div>
                              <p className="text-sm font-medium text-gray-800">{label}</p>
                              <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Visibility Toggles */}
                  <div className="border-t border-gray-100 pt-5 space-y-1 mb-5">
                    <p className="text-sm font-medium text-gray-800 mb-3">Show on Profile</p>
                    {[
                      { key: 'showEmail', label: 'Email address', desc: 'Display your email on your public profile' },
                      { key: 'showDocuments', label: 'Uploaded documents', desc: 'Show your document library on your profile' },
                      { key: 'showStats', label: 'Contribution stats', desc: 'Show download counts, ratings, and contribution metrics' },
                    ].map(({ key, label, desc }) => (
                      <label
                        key={key}
                        className="flex items-center justify-between gap-4 px-4 py-3.5 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        <div>
                          <p className="text-sm font-medium text-gray-800">{label}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
                        </div>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={privacyPrefs[key as keyof PrivacyPrefs] as boolean}
                          onClick={() => setPrivacyPrefs((p) => ({ ...p, [key]: !p[key as keyof PrivacyPrefs] }))}
                          className={`relative inline-flex h-5 w-9 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 ${
                            privacyPrefs[key as keyof PrivacyPrefs] ? 'bg-indigo-600' : 'bg-gray-200'
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                              privacyPrefs[key as keyof PrivacyPrefs] ? 'translate-x-4' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </label>
                    ))}
                  </div>

                  {privacyMsg && (
                    <div className={`flex items-start gap-2 p-3 rounded-lg text-xs ${privacyMsg.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                      <Icon name={privacyMsg.type === 'success' ? 'CheckCircleIcon' : 'ExclamationCircleIcon'} size={14} className="mt-0.5 flex-shrink-0" />
                      {privacyMsg.text}
                    </div>
                  )}

                  <button
                    onClick={handlePrivacySave}
                    disabled={privacySaving}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-60 transition-colors"
                  >
                    {privacySaving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Icon name="CheckIcon" size={14} />}
                    Save Settings
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

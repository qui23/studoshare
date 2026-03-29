'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import AppLogo from '@/components/ui/AppLogo';
import Icon from '@/components/ui/AppIcon';
import { useAuth } from '@/contexts/AuthContext';

const navItems = [
  { label: 'Explore', href: '/home-screen', icon: 'BookOpenIcon' },
  { label: 'Upload', href: '/upload-screen', icon: 'ArrowUpTrayIcon' },
  { label: 'Profile', href: '/user-profile-screen', icon: 'UserCircleIcon' },
  { label: 'Settings', href: '/user-settings-screen', icon: 'Cog6ToothIcon' },
];

export default function Topbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const { user, signOut } = useAuth();

  const isAuth = pathname === '/login-register-screen';

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/login-register-screen');
      router.refresh();
    } catch (err) {
      console.log('Sign out error');
    }
  };

  const displayName = user?.user_metadata?.full_name
    || user?.email?.split('@')[0]
    || 'User';

  const initials = displayName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-screen-2xl mx-auto px-4 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/home-screen" className="flex items-center gap-2 flex-shrink-0">
          <AppLogo size={34} />
          <span className="font-display font-700 text-lg tracking-tight text-gray-900 hidden sm:block">
            StudoShare
          </span>
        </Link>

        {/* Center Nav */}
        {!isAuth && (
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={`nav-${item.href}`}
                href={item.href}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                  pathname === item.href
                    ? 'bg-indigo-50 text-indigo-700' :'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <Icon name={item.icon as any} size={16} />
                {item.label}
              </Link>
            ))}
          </nav>
        )}

        {/* Right Actions */}
        {!isAuth && (
          <div className="flex items-center gap-2">
            {/* User Avatar / Sign In */}
            {user ? (
              <div className="flex items-center gap-2">
                <a href="/user-profile-screen" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-display font-600 text-sm">
                    {initials}
                  </div>
                  <span className="hidden lg:block text-sm font-medium text-gray-700 max-w-[120px] truncate">{displayName}</span>
                </a>
              </div>
            ) : (
              <Link
                href="/login-register-screen"
                className="hidden md:flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-indigo-600 hover:bg-indigo-50 transition-all duration-150"
              >
                <Icon name="ArrowRightOnRectangleIcon" size={16} />
                Sign In
              </Link>
            )}

            {user ? (
              <button
                onClick={handleSignOut}
                className="hidden md:flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-all duration-150"
              >
                <Icon name="ArrowRightOnRectangleIcon" size={16} />
                Sign Out
              </button>
            ) : null}
          </div>
        )}

        {isAuth && (
          <Link href="/home-screen" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium transition-colors">
            Browse Documents →
          </Link>
        )}

        {/* Mobile hamburger */}
        {!isAuth && (
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
            aria-label="Toggle menu"
          >
            <Icon name={mobileOpen ? 'XMarkIcon' : 'Bars3Icon'} size={20} />
          </button>
        )}
      </div>

      {/* Mobile Menu */}
      {mobileOpen && !isAuth && (
        <div className="md:hidden bg-white border-t border-gray-100 px-4 py-3 flex flex-col gap-1">
          {navItems.map((item) => (
            <Link
              key={`mobile-nav-${item.href}`}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                pathname === item.href ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Icon name={item.icon as any} size={16} />
              {item.label}
            </Link>
          ))}
          {user ? (
            <button
              onClick={() => { setMobileOpen(false); handleSignOut(); }}
              className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 transition-colors mt-1"
            >
              <Icon name="ArrowRightOnRectangleIcon" size={16} />
              Sign Out
            </button>
          ) : (
            <Link
              href="/login-register-screen"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-indigo-600 hover:bg-indigo-50 transition-colors mt-1"
            >
              <Icon name="ArrowRightOnRectangleIcon" size={16} />
              Sign In
            </Link>
          )}
        </div>
      )}
    </header>
  );
}
'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

const AuthContext = createContext<any>({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

const clearSupabaseTokens = () => {
  try {
    // Remove all Supabase auth keys from localStorage
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith('sb-') || key.includes('supabase')) {
        localStorage.removeItem(key);
      }
    });
  } catch {
    // localStorage may not be available in SSR
  }
};

const isInvalidRefreshTokenError = (error: any): boolean => {
  if (!error) return false;
  const msg = (error.message || error.error_description || '').toLowerCase();
  return (
    msg.includes('invalid refresh token') ||
    msg.includes('refresh token not found') ||
    msg.includes('refresh_token_not_found')
  );
};

const isRateLimitError = (error: any): boolean => {
  if (!error) return false;
  const msg = (error.message || error.error_description || '').toLowerCase();
  return (
    msg.includes('rate limit') ||
    msg.includes('too many requests') ||
    error.status === 429
  );
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any>(null);
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    let mounted = true;

    const handleInvalidToken = async () => {
      clearSupabaseTokens();
      try {
        await supabase.auth.signOut({ scope: 'local' });
      } catch {
        // ignore
      }
      if (!mounted) return;
      setSession(null);
      setUser(null);
      setLoading(false);
    };

    // Get initial session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (!mounted) return;
      if (error) {
        if (isRateLimitError(error)) {
          // Rate limit: keep existing session state, just stop loading
          setLoading(false);
          return;
        }
        if (isInvalidRefreshTokenError(error)) {
          handleInvalidToken();
        } else {
          setSession(null);
          setUser(null);
          setLoading(false);
        }
        return;
      }
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    }).catch((err) => {
      if (!mounted) return;
      if (isRateLimitError(err)) {
        setLoading(false);
        return;
      }
      if (isInvalidRefreshTokenError(err)) {
        handleInvalidToken();
      } else {
        setSession(null);
        setUser(null);
        setLoading(false);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;

      if (_event === 'TOKEN_REFRESHED' && !session) {
        handleInvalidToken();
        return;
      }

      if (_event === 'SIGNED_OUT') {
        setSession(null);
        setUser(null);
        setLoading(false);
        return;
      }

      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Also listen for unhandled promise rejections from Supabase token refresh
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      if (isRateLimitError(reason)) {
        event.preventDefault();
        // Rate limit: do nothing, let it recover naturally
        return;
      }
      if (isInvalidRefreshTokenError(reason)) {
        event.preventDefault();
        handleInvalidToken();
      }
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      mounted = false;
      subscription.unsubscribe();
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [supabase]);

  // Email/Password Sign Up
  const signUp = async (email: string, password: string, metadata = {}) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: (metadata as any)?.fullName || '',
          avatar_url: (metadata as any)?.avatarUrl || ''
        },
        emailRedirectTo: `${window.location.origin}/auth/callback`
      }
    });
    if (error) throw error;
    return data;
  };

  // Email/Password Sign In
  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    if (error) throw error;
    return data;
  };

  // Sign Out
  const signOut = async () => {
    clearSupabaseTokens();
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  // Get Current User
  const getCurrentUser = async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
  };

  // Check if Email is Verified
  const isEmailVerified = () => {
    return user?.email_confirmed_at !== null;
  };

  // Get User Profile from Database
  const getUserProfile = async () => {
    if (!user) return null;
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    if (error) throw error;
    return data;
  };

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    getCurrentUser,
    isEmailVerified,
    getUserProfile
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

'use client';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import AppLogo from '@/components/ui/AppLogo';
import Icon from '@/components/ui/AppIcon';
import { useAuth } from '@/contexts/AuthContext';

interface LoginValues {
  email: string;
  password: string;
  remember: boolean;
}

interface RegisterValues {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: string;
  terms: boolean;
}

export default function AuthForm() {
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { signIn, signUp } = useAuth();

  const loginForm = useForm<LoginValues>({ defaultValues: { remember: false } });
  const registerForm = useForm<RegisterValues>({ defaultValues: { role: 'student' } });

  const handleLogin = async (data: LoginValues) => {
    setLoading(true);
    try {
      await signIn(data.email, data.password);
      toast.success('Welcome back! Redirecting...');
      router.push('/home-screen');
      router.refresh();
    } catch (error: any) {
      loginForm.setError('email', {
        message: error?.message || 'Invalid email or password.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (data: RegisterValues) => {
    if (data.password !== data.confirmPassword) {
      registerForm.setError('confirmPassword', { message: 'Passwords do not match' });
      return;
    }
    if (!data.terms) {
      toast.error('Please accept the terms to proceed.');
      return;
    }
    setLoading(true);
    try {
      await signUp(data.email, data.password, { fullName: data.fullName, role: data.role });
      toast.success('Account created! You are now signed in.');
      router.push('/home-screen');
      router.refresh();
    } catch (error: any) {
      registerForm.setError('email', {
        message: error?.message || 'Could not create account. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      {/* Mobile Logo */}
      <div className="flex items-center gap-2 justify-center mb-8 lg:hidden">
        <AppLogo size={36} />
        <span className="font-display font-700 text-xl text-gray-900 tracking-tight">StudoShare</span>
      </div>

      {/* Card */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xl overflow-hidden">
        {/* Tab Header */}
        <div className="flex border-b border-gray-100">
          {(['login', 'register'] as const).map((t) => (
            <button
              key={`tab-${t}`}
              onClick={() => setTab(t)}
              className={`flex-1 py-4 text-sm font-display font-600 transition-all duration-150 ${
                tab === t
                  ? 'text-indigo-700 border-b-2 border-indigo-600 bg-indigo-50/50' :'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              {t === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          ))}
        </div>

        <div className="p-6 lg:p-8">
          {tab === 'login' ? (
            <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
              <div>
                <p className="font-display font-700 text-xl text-gray-900 mb-1">Welcome back</p>
                <p className="text-sm text-gray-500">Sign in to access your documents and saved materials</p>
              </div>

              {/* Social Auth */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  className="flex items-center justify-center gap-2 px-3 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 active:scale-95 transition-all duration-150"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Google
                </button>
                <button
                  type="button"
                  className="flex items-center justify-center gap-2 px-3 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 active:scale-95 transition-all duration-150"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                  GitHub
                </button>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-xs text-gray-400 font-medium">or continue with email</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-display font-600 text-gray-700 mb-1.5">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2">
                    <Icon name="EnvelopeIcon" size={15} className="text-gray-400" />
                  </div>
                  <input
                    type="email"
                    placeholder="you@university.edu"
                    className={`w-full pl-9 pr-3 py-2.5 text-sm text-gray-800 placeholder-gray-400 border rounded-xl outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all duration-150 ${loginForm.formState.errors.email ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}
                    {...loginForm.register('email', {
                      required: 'Email is required',
                      pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Enter a valid email address' },
                    })}
                  />
                </div>
                {loginForm.formState.errors.email && (
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                    <Icon name="ExclamationCircleIcon" size={12} />
                    {loginForm.formState.errors.email.message}
                  </p>
                )}
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-display font-600 text-gray-700">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <button type="button" className="text-xs text-indigo-600 hover:text-indigo-700 font-medium transition-colors">
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2">
                    <Icon name="LockClosedIcon" size={15} className="text-gray-400" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    className={`w-full pl-9 pr-10 py-2.5 text-sm text-gray-800 placeholder-gray-400 border rounded-xl outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all duration-150 ${loginForm.formState.errors.password ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}
                    {...loginForm.register('password', {
                      required: 'Password is required',
                      minLength: { value: 6, message: 'Password must be at least 6 characters' },
                    })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    <Icon name={showPassword ? 'EyeSlashIcon' : 'EyeIcon'} size={15} />
                  </button>
                </div>
                {loginForm.formState.errors.password && (
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                    <Icon name="ExclamationCircleIcon" size={12} />
                    {loginForm.formState.errors.password.message}
                  </p>
                )}
              </div>

              {/* Remember Me */}
              <label className="flex items-center gap-2.5 cursor-pointer">
                <div
                  className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all duration-150 ${
                    loginForm.watch('remember') ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300 hover:border-indigo-400'
                  }`}
                  onClick={() => loginForm.setValue('remember', !loginForm.watch('remember'))}
                >
                  {loginForm.watch('remember') && <Icon name="CheckIcon" size={10} className="text-white" />}
                </div>
                <span className="text-xs text-gray-600">Remember me for 30 days</span>
              </label>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] disabled:opacity-70 text-white text-sm font-display font-600 rounded-xl transition-all duration-150 shadow-sm"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Signing in...
                  </>
                ) : (
                  <>
                    <Icon name="ArrowRightOnRectangleIcon" size={15} />
                    Sign In to StudoShare
                  </>
                )}
              </button>

              <p className="text-center text-xs text-gray-500">
                Don&apos;t have an account?{' '}
                <button type="button" onClick={() => setTab('register')} className="text-indigo-600 hover:text-indigo-700 font-medium transition-colors">
                  Create one free
                </button>
              </p>
            </form>
          ) : (
            <form onSubmit={registerForm.handleSubmit(handleRegister)} className="space-y-4">
              <div>
                <p className="font-display font-700 text-xl text-gray-900 mb-1">Create your account</p>
                <p className="text-sm text-gray-500">Join 180,000+ students sharing study materials</p>
              </div>

              {/* Social Auth */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  className="flex items-center justify-center gap-2 px-3 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 active:scale-95 transition-all duration-150"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Google
                </button>
                <button
                  type="button"
                  className="flex items-center justify-center gap-2 px-3 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 active:scale-95 transition-all duration-150"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                  GitHub
                </button>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-xs text-gray-400 font-medium">or register with email</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>

              {/* Full Name */}
              <div>
                <label className="block text-xs font-display font-600 text-gray-700 mb-1.5">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2">
                    <Icon name="UserIcon" size={15} className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Your full name"
                    className={`w-full pl-9 pr-3 py-2.5 text-sm text-gray-800 placeholder-gray-400 border rounded-xl outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all duration-150 ${registerForm.formState.errors.fullName ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}
                    {...registerForm.register('fullName', {
                      required: 'Full name is required',
                      minLength: { value: 2, message: 'Name must be at least 2 characters' },
                    })}
                  />
                </div>
                {registerForm.formState.errors.fullName && (
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                    <Icon name="ExclamationCircleIcon" size={12} />
                    {registerForm.formState.errors.fullName.message}
                  </p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-display font-600 text-gray-700 mb-1.5">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2">
                    <Icon name="EnvelopeIcon" size={15} className="text-gray-400" />
                  </div>
                  <input
                    type="email"
                    placeholder="you@university.edu"
                    className={`w-full pl-9 pr-3 py-2.5 text-sm text-gray-800 placeholder-gray-400 border rounded-xl outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all duration-150 ${registerForm.formState.errors.email ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}
                    {...registerForm.register('email', {
                      required: 'Email is required',
                      pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Enter a valid email address' },
                    })}
                  />
                </div>
                {registerForm.formState.errors.email && (
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                    <Icon name="ExclamationCircleIcon" size={12} />
                    {registerForm.formState.errors.email.message}
                  </p>
                )}
              </div>

              {/* Role */}
              <div>
                <label className="block text-xs font-display font-600 text-gray-700 mb-1.5">I am a...</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'student', label: 'Student', icon: 'AcademicCapIcon', desc: 'Discover materials' },
                    { value: 'contributor', label: 'Contributor', icon: 'ArrowUpTrayIcon', desc: 'Share & earn' },
                    { value: 'educator', label: 'Educator', icon: 'BookOpenIcon', desc: 'Teach & guide' },
                  ].map((r) => (
                    <label key={`role-${r.value}`} className="cursor-pointer">
                      <input type="radio" value={r.value} className="sr-only" {...registerForm.register('role')} />
                      <div className={`p-2.5 rounded-xl border-2 text-center transition-all duration-150 ${
                        registerForm.watch('role') === r.value
                          ? 'border-indigo-500 bg-indigo-50' :'border-gray-200 bg-white hover:border-gray-300'
                      }`}>
                        <Icon name={r.icon as any} size={16} className={`mx-auto mb-1 ${registerForm.watch('role') === r.value ? 'text-indigo-600' : 'text-gray-400'}`} />
                        <p className={`text-xs font-display font-600 ${registerForm.watch('role') === r.value ? 'text-indigo-700' : 'text-gray-700'}`}>{r.label}</p>
                        <p className="text-xs text-gray-400 leading-tight mt-0.5">{r.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-display font-600 text-gray-700 mb-1.5">
                  Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2">
                    <Icon name="LockClosedIcon" size={15} className="text-gray-400" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Min. 8 characters"
                    className={`w-full pl-9 pr-10 py-2.5 text-sm text-gray-800 placeholder-gray-400 border rounded-xl outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all duration-150 ${registerForm.formState.errors.password ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}
                    {...registerForm.register('password', {
                      required: 'Password is required',
                      minLength: { value: 8, message: 'Password must be at least 8 characters' },
                      pattern: {
                        value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                        message: 'Include uppercase, lowercase, and a number',
                      },
                    })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    <Icon name={showPassword ? 'EyeSlashIcon' : 'EyeIcon'} size={15} />
                  </button>
                </div>
                {registerForm.formState.errors.password && (
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                    <Icon name="ExclamationCircleIcon" size={12} />
                    {registerForm.formState.errors.password.message}
                  </p>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-xs font-display font-600 text-gray-700 mb-1.5">
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2">
                    <Icon name="LockClosedIcon" size={15} className="text-gray-400" />
                  </div>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Re-enter your password"
                    className={`w-full pl-9 pr-10 py-2.5 text-sm text-gray-800 placeholder-gray-400 border rounded-xl outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all duration-150 ${registerForm.formState.errors.confirmPassword ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}
                    {...registerForm.register('confirmPassword', {
                      required: 'Please confirm your password',
                    })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    <Icon name={showConfirmPassword ? 'EyeSlashIcon' : 'EyeIcon'} size={15} />
                  </button>
                </div>
                {registerForm.formState.errors.confirmPassword && (
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                    <Icon name="ExclamationCircleIcon" size={12} />
                    {registerForm.formState.errors.confirmPassword.message}
                  </p>
                )}
              </div>

              {/* Terms */}
              <label className="flex items-start gap-2.5 cursor-pointer">
                <div
                  className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all duration-150 ${
                    registerForm.watch('terms') ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300 hover:border-indigo-400'
                  }`}
                  onClick={() => registerForm.setValue('terms', !registerForm.watch('terms'))}
                >
                  {registerForm.watch('terms') && <Icon name="CheckIcon" size={10} className="text-white" />}
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">
                  I agree to the{' '}
                  <span className="text-indigo-600 hover:underline cursor-pointer">Terms of Service</span>,{' '}
                  <span className="text-indigo-600 hover:underline cursor-pointer">Privacy Policy</span>, and{' '}
                  <span className="text-indigo-600 hover:underline cursor-pointer">Content Policy</span>.
                  I confirm I am at least 13 years old.
                </p>
              </label>
              {registerForm.formState.errors.terms && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <Icon name="ExclamationCircleIcon" size={12} />
                  You must accept the terms to create an account
                </p>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] disabled:opacity-70 text-white text-sm font-display font-600 rounded-xl transition-all duration-150 shadow-sm"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Creating account...
                  </>
                ) : (
                  <>
                    <Icon name="UserPlusIcon" size={15} />
                    Create Free Account
                  </>
                )}
              </button>

              <p className="text-center text-xs text-gray-500">
                Already have an account?{' '}
                <button type="button" onClick={() => setTab('login')} className="text-indigo-600 hover:text-indigo-700 font-medium transition-colors">
                  Sign in
                </button>
              </p>
            </form>
          )}
        </div>
      </div>

      {/* Footer Links */}
      <div className="flex items-center justify-center gap-4 mt-6 flex-wrap">
        {['Privacy Policy', 'Terms of Service', 'Help Center', 'Contact'].map((link) => (
          <button key={`footer-${link}`} className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
            {link}
          </button>
        ))}
      </div>
    </div>
  );
}
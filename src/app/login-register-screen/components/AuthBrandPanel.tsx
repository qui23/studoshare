import React from 'react';
import AppLogo from '@/components/ui/AppLogo';
import Icon from '@/components/ui/AppIcon';

const STATS = [
  { value: '47,382', label: 'Study Documents' },
  { value: '8,910', label: 'Contributors' },
  { value: '1,240', label: 'Universities' },
];

const TESTIMONIALS = [
  {
    text: 'Found the exact Quantum Mechanics notes I needed the night before my exam. Scored an A.',
    author: 'Riya S.',
    role: 'Physics, IIT Bombay',
    initials: 'RS',
    color: 'bg-indigo-100 text-indigo-700',
  },
  {
    text: 'Uploaded my DSA notes and they\'ve been downloaded over 12,000 times. Feels great to help!',
    author: 'Marcus C.',
    role: 'CS, Stanford',
    initials: 'MC',
    color: 'bg-violet-100 text-violet-700',
  },
];

export default function AuthBrandPanel() {
  return (
    <div className="hidden lg:flex lg:w-[480px] xl:w-[540px] flex-col bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-700 p-10 xl:p-12 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 right-0 w-80 h-80 bg-white rounded-full -translate-y-1/3 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white rounded-full translate-y-1/3 -translate-x-1/3" />
      </div>

      <div className="relative z-10 flex flex-col h-full">
        {/* Logo */}
        <div className="flex items-center gap-2.5 mb-10">
          <AppLogo size={38} />
          <span className="font-display font-700 text-xl text-white tracking-tight">StudoShare</span>
        </div>

        {/* Headline */}
        <div className="mb-8">
          <h2 className="font-display font-800 text-3xl xl:text-4xl text-white leading-tight mb-3">
            Study Smarter.<br />Share Freely.
          </h2>
          <p className="text-indigo-200 text-base leading-relaxed">
            Join over 180,000 students who share and discover academic materials for every subject and university.
          </p>
        </div>

        {/* Features */}
        <div className="space-y-3 mb-8">
          {[
            { icon: 'MagnifyingGlassIcon', title: 'Find anything instantly', desc: 'Search by subject, university, or keyword across 47k+ documents' },
            { icon: 'SparklesIcon', title: 'AI-powered recommendations', desc: 'Get personalized study material suggestions based on your courses' },
            { icon: 'TrophyIcon', title: 'Earn Contributor status', desc: 'Upload notes and build your academic reputation across universities' },
          ].map((f) => (
            <div key={`feat-${f.icon}`} className="flex items-start gap-3 p-3 bg-white/10 backdrop-blur-sm rounded-xl">
              <div className="p-1.5 bg-white/20 rounded-lg flex-shrink-0 mt-0.5">
                <Icon name={f.icon as any} size={14} className="text-white" />
              </div>
              <div>
                <p className="text-sm font-display font-600 text-white">{f.title}</p>
                <p className="text-xs text-indigo-200 mt-0.5 leading-snug">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Stats */}
        <div className="flex gap-4 mb-8">
          {STATS.map((s) => (
            <div key={`auth-stat-${s.label}`} className="flex-1 text-center p-3 bg-white/10 rounded-xl">
              <p className="font-display font-800 text-xl text-white tabular-nums">{s.value}</p>
              <p className="text-xs text-indigo-200 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Testimonials */}
        <div className="space-y-3 mt-auto">
          {TESTIMONIALS.map((t) => (
            <div key={`test-${t.author}`} className="p-3.5 bg-white/10 backdrop-blur-sm rounded-xl">
              <p className="text-xs text-indigo-100 leading-relaxed mb-2">"{t.text}"</p>
              <div className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center font-display font-600 text-xs ${t.color}`}>
                  {t.initials}
                </div>
                <div>
                  <p className="text-xs font-display font-600 text-white">{t.author}</p>
                  <p className="text-xs text-indigo-300">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
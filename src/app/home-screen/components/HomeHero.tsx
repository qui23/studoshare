'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Icon from '@/components/ui/AppIcon';
import { createClient } from '@/lib/supabase/client';

const SUBJECTS = ['Mathematics', 'Physics', 'Computer Science', 'Biology', 'Chemistry', 'Economics', 'Psychology', 'History', 'Engineering', 'Law'];

const QUICK_FILTERS = [
  { label: '📄 PDF Only', value: 'pdf' },
  { label: '📝 Word', value: 'word' },
];

interface HomeHeroProps {
  onSearch?: (query: string) => void;
  onSubjectChange?: (subject: string) => void;
  onFileTypeChange?: (fileType: string) => void;
}

interface Stats {
  documents: number;
  universities: number;
  contributors: number;
  downloads: number;
}

function formatNumber(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return n.toString();
}

export default function HomeHero({ onSearch, onSubjectChange, onFileTypeChange }: HomeHeroProps) {
  const [query, setQuery] = useState('');
  const [subject, setSubject] = useState('');
  const [otherSubject, setOtherSubject] = useState('');
  const [activeFilter, setActiveFilter] = useState('');
  const [stats, setStats] = useState<Stats | null>(null);
  const router = useRouter();

  // Debounced live search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (onSearch) onSearch(query.trim());
    }, 350);
    return () => clearTimeout(timer);
  }, [query, onSearch]);

  useEffect(() => {
    const fetchStats = async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('documents')
        .select('id, university, uploader_id, download_count');
      if (error || !data) return;

      const documents = data.length;
      const universities = new Set(data.map((d) => d.university).filter(Boolean)).size;
      const contributors = new Set(data.map((d) => d.uploader_id).filter(Boolean)).size;
      const downloads = data.reduce((sum, d) => sum + (d.download_count || 0), 0);

      setStats({ documents, universities, contributors, downloads });
    };
    fetchStats();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch) onSearch(query.trim());
    if (subject === 'other' && otherSubject.trim() && onSubjectChange) {
      onSubjectChange(otherSubject.trim());
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  const statItems = stats
    ? [
        { label: 'Documents', value: formatNumber(stats.documents) },
        ...(stats.universities > 0 ? [{ label: 'Universities', value: formatNumber(stats.universities) }] : []),
        { label: 'Contributors', value: formatNumber(stats.contributors) },
        { label: 'Downloads', value: formatNumber(stats.downloads) },
      ]
    : [];

  return (
    <div className="relative bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-700 rounded-2xl overflow-hidden px-4 py-8 sm:px-6 sm:py-10 lg:px-10">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white rounded-full translate-y-1/2 -translate-x-1/2" />
      </div>

      <div className="relative z-10">
        {/* Stats Row */}
        {statItems.length > 0 && (
          <div className="flex flex-wrap gap-4 mb-6">
            {statItems.map((stat) => (
              <div key={`stat-${stat.label}`} className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-lg px-3 py-1.5" suppressHydrationWarning>
                <span className="text-white font-display font-700 text-sm tabular-nums">{stat.value}</span>
                <span className="text-indigo-200 text-xs">{stat.label}</span>
              </div>
            ))}
          </div>
        )}

        <h1 className="font-display font-800 text-xl sm:text-2xl lg:text-4xl text-white mb-2 leading-tight">
          Find Study Materials for<br className="hidden md:block" /> Any Subject, Any University
        </h1>
        <p className="text-indigo-200 text-sm lg:text-base mb-6 max-w-xl">
          Access notes, past papers, summaries, and lecture slides shared by students worldwide.
        </p>

        {/* Search Form */}
        <form onSubmit={handleSearch} className="bg-white rounded-xl p-2 shadow-xl flex flex-col gap-2 max-w-3xl">
          {/* Keyword Input */}
          <div className="flex items-center gap-2 px-3">
            <Icon name="MagnifyingGlassIcon" size={18} className="text-gray-400 flex-shrink-0" />
            <input
              type="text"
              value={query}
              onChange={handleInputChange}
              placeholder="Search by keyword, course code, topic..."
              className="flex-1 text-sm text-gray-900 placeholder-gray-400 outline-none bg-transparent py-2"
            />
          </div>

          {/* Subject Select */}
          <div className="flex items-center gap-2 px-3 border-t border-gray-100">
            <Icon name="AcademicCapIcon" size={16} className="text-gray-400 flex-shrink-0" />
            {subject === 'other' ? (
              <input
                type="text"
                value={otherSubject}
                onChange={(e) => setOtherSubject(e.target.value)}
                placeholder="Enter subject..."
                autoFocus
                className="flex-1 text-sm text-gray-700 outline-none bg-transparent py-2 placeholder-gray-400"
              />
            ) : (
              <select
                value={subject}
                onChange={(e) => {
                  const val = e.target.value;
                  setSubject(val);
                  setOtherSubject('');
                  if (val !== 'other' && onSubjectChange) onSubjectChange(val);
                }}
                className="flex-1 text-sm text-gray-700 outline-none bg-transparent py-2 cursor-pointer"
              >
                <option value="">All Subjects</option>
                {SUBJECTS.map((s) => <option key={`subject-${s}`} value={s}>{s}</option>)}
                <option value="other">Other...</option>
              </select>
            )}
            {subject === 'other' && (
              <button
                type="button"
                onClick={() => { setSubject(''); setOtherSubject(''); if (onSubjectChange) onSubjectChange(''); }}
                className="text-gray-400 hover:text-gray-600 flex-shrink-0"
              >
                <Icon name="XMarkIcon" size={14} />
              </button>
            )}
          </div>

          <button
            type="submit"
            className="flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-sm font-display font-600 rounded-lg transition-all duration-150"
          >
            <Icon name="MagnifyingGlassIcon" size={16} />
            Search
          </button>
        </form>

        {/* Quick Filters */}
        <div className="flex flex-wrap gap-2 mt-4">
          {QUICK_FILTERS.map((f) => (
            <button
              key={`qf-${f.value}`}
              onClick={() => {
                const next = activeFilter === f.value ? '' : f.value;
                setActiveFilter(next);
                if (onFileTypeChange) onFileTypeChange(next);
              }}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-150 ${
                activeFilter === f.value
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
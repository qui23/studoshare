'use client';
import React, { useState, useEffect } from 'react';
import Icon from '@/components/ui/AppIcon';
import { createClient } from '@/lib/supabase/client';

interface SubjectCount {
  name: string;
  count: number;
  color: string;
}

const SUBJECT_COLORS: Record<string, string> = {
  'Computer Science': 'bg-blue-400',
  'Mathematics': 'bg-indigo-400',
  'Physics': 'bg-violet-400',
  'Engineering': 'bg-cyan-400',
  'Economics': 'bg-green-400',
  'Biology': 'bg-emerald-400',
  'Chemistry': 'bg-teal-400',
  'Psychology': 'bg-pink-400',
  'History': 'bg-orange-400',
  'Law': 'bg-red-400',
};

const DEFAULT_COLORS = [
  'bg-blue-400', 'bg-indigo-400', 'bg-violet-400', 'bg-cyan-400',
  'bg-green-400', 'bg-emerald-400', 'bg-teal-400', 'bg-pink-400',
  'bg-orange-400', 'bg-red-400',
];

interface FilterSidebarProps {
  onFileTypeChange?: (types: string[]) => void;
  onDateRangeChange?: (range: string) => void;
  mobile?: boolean;
}

export default function FilterSidebar({ onFileTypeChange, onDateRangeChange, mobile }: FilterSidebarProps) {
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [fileTypes, setFileTypes] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState('all');
  const [expanded, setExpanded] = useState(true);
  const [subjects, setSubjects] = useState<SubjectCount[]>([]);
  const [maxCount, setMaxCount] = useState(1);

  useEffect(() => {
    async function fetchSubjects() {
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from('documents')
          .select('subject')
          .eq('visibility', 'public')
          .not('subject', 'is', null)
          .neq('subject', '');

        if (data) {
          const countMap: Record<string, number> = {};
          data.forEach((doc) => {
            if (doc.subject) countMap[doc.subject] = (countMap[doc.subject] || 0) + 1;
          });
          const sorted: SubjectCount[] = Object.entries(countMap)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([name, count], i) => ({
              name,
              count,
              color: SUBJECT_COLORS[name] || DEFAULT_COLORS[i % DEFAULT_COLORS.length],
            }));
          setSubjects(sorted);
          setMaxCount(sorted[0]?.count || 1);
        }
      } catch (err) {
        console.log('FilterSidebar fetch error:', err);
      }
    }
    fetchSubjects();
  }, []);

  const toggleSubject = (name: string) => {
    setSelectedSubjects(prev => prev.includes(name) ? prev.filter(s => s !== name) : [...prev, name]);
  };

  const toggleFileType = (type: string) => {
    const next = fileTypes.includes(type) ? fileTypes.filter(t => t !== type) : [...fileTypes, type];
    setFileTypes(next);
    onFileTypeChange?.(next);
  };

  const handleDateRange = (value: string) => {
    setDateRange(value);
    onDateRangeChange?.(value);
  };

  const clearAll = () => {
    setSelectedSubjects([]);
    setFileTypes([]);
    setDateRange('all');
    onFileTypeChange?.([]);
    onDateRangeChange?.('all');
  };

  const activeCount = selectedSubjects.length + fileTypes.length + (dateRange !== 'all' ? 1 : 0);

  // Mobile variant: horizontal compact layout
  if (mobile) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon name="FunnelIcon" size={15} className="text-indigo-600" />
            <span className="font-display font-600 text-sm text-gray-900">Filters</span>
            {activeCount > 0 && (
              <span className="px-1.5 py-0.5 bg-indigo-100 text-indigo-700 text-xs rounded-full font-medium tabular-nums">{activeCount}</span>
            )}
          </div>
          {activeCount > 0 && (
            <button onClick={clearAll} className="text-xs text-red-500 hover:text-red-600 font-medium transition-colors">Clear all</button>
          )}
        </div>

        {/* File Type */}
        <div>
          <p className="text-xs font-display font-600 text-gray-500 uppercase tracking-wide mb-2">File Type</p>
          <div className="flex gap-3">
            {[
              { type: 'pdf', label: 'PDF', color: 'text-red-600' },
              { type: 'docx', label: 'Word (DOCX)', color: 'text-blue-600' },
            ].map((ft) => (
              <label key={`ft-mob-${ft.type}`} className="flex items-center gap-2 cursor-pointer">
                <div
                  onClick={() => toggleFileType(ft.type)}
                  className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all duration-150 ${
                    fileTypes.includes(ft.type)
                      ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300'
                  }`}
                >
                  {fileTypes.includes(ft.type) && (
                    <Icon name="CheckIcon" size={10} className="text-white" />
                  )}
                </div>
                <span className={`text-xs font-medium ${fileTypes.includes(ft.type) ? ft.color : 'text-gray-600'}`}>{ft.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Date Range */}
        <div>
          <p className="text-xs font-display font-600 text-gray-500 uppercase tracking-wide mb-2">Upload Date</p>
          <div className="flex flex-wrap gap-2">
            {[
              { value: 'all', label: 'All time' },
              { value: 'today', label: 'Today' },
              { value: 'week', label: 'This week' },
              { value: 'month', label: 'This month' },
              { value: 'year', label: 'This year' },
            ].map((dr) => (
              <button
                key={`dr-mob-${dr.value}`}
                onClick={() => handleDateRange(dr.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 border ${
                  dateRange === dr.value
                    ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :'text-gray-600 border-gray-200 hover:bg-gray-50'
                }`}
              >
                {dr.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <aside className="hidden lg:block w-56 xl:w-60 flex-shrink-0 space-y-4 sticky top-24">
      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
          <div className="flex items-center gap-2">
            <Icon name="FunnelIcon" size={15} className="text-indigo-600" />
            <span className="font-display font-600 text-sm text-gray-900">Filters</span>
            {activeCount > 0 && (
              <span className="px-1.5 py-0.5 bg-indigo-100 text-indigo-700 text-xs rounded-full font-medium tabular-nums">{activeCount}</span>
            )}
          </div>
          {activeCount > 0 && (
            <button onClick={clearAll} className="text-xs text-red-500 hover:text-red-600 font-medium transition-colors">Clear all</button>
          )}
        </div>

        <div className="p-4 space-y-5">
          {/* File Type */}
          <div>
            <p className="text-xs font-display font-600 text-gray-500 uppercase tracking-wide mb-2">File Type</p>
            <div className="space-y-1.5">
              {[
                { type: 'pdf', label: 'PDF', color: 'text-red-600', bg: 'bg-red-50 border-red-200' },
                { type: 'docx', label: 'Word (DOCX)', color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200' },
              ].map((ft) => (
                <label key={`ft-${ft.type}`} className="flex items-center gap-2.5 cursor-pointer group">
                  <div
                    onClick={() => toggleFileType(ft.type)}
                    className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all duration-150 ${
                      fileTypes.includes(ft.type)
                        ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300 group-hover:border-indigo-400'
                    }`}
                  >
                    {fileTypes.includes(ft.type) && (
                      <Icon name="CheckIcon" size={10} className="text-white" />
                    )}
                  </div>
                  <span className={`text-xs font-medium ${fileTypes.includes(ft.type) ? ft.color : 'text-gray-600'}`}>{ft.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Date Range */}
          <div>
            <p className="text-xs font-display font-600 text-gray-500 uppercase tracking-wide mb-2">Upload Date</p>
            <div className="space-y-1">
              {[
                { value: 'all', label: 'All time' },
                { value: 'today', label: 'Today' },
                { value: 'week', label: 'This week' },
                { value: 'month', label: 'This month' },
                { value: 'year', label: 'This year' },
              ].map((dr) => (
                <button
                  key={`dr-${dr.value}`}
                  onClick={() => handleDateRange(dr.value)}
                  className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-xs transition-all duration-150 ${
                    dateRange === dr.value ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {dr.label}
                  {dateRange === dr.value && <Icon name="CheckIcon" size={12} className="text-indigo-600" />}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Subjects */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-between px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Icon name="AcademicCapIcon" size={15} className="text-indigo-600" />
            <span className="font-display font-600 text-sm text-gray-900">Top Subjects</span>
          </div>
          <Icon name={expanded ? 'ChevronUpIcon' : 'ChevronDownIcon'} size={14} className="text-gray-400" />
        </button>

        {expanded && (
          <div className="p-4 space-y-2">
            {subjects.length === 0 && (
              <p className="text-xs text-gray-400">No subjects yet</p>
            )}
            {subjects.map((subj) => (
              <button
                key={`subj-${subj.name}`}
                onClick={() => toggleSubject(subj.name)}
                className={`w-full group transition-all duration-150 rounded-lg px-2 py-1.5 ${
                  selectedSubjects.includes(subj.name) ? 'bg-indigo-50' : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-xs font-medium truncate ${selectedSubjects.includes(subj.name) ? 'text-indigo-700' : 'text-gray-700'}`}>
                    {subj.name}
                  </span>
                  <span className="text-xs text-gray-400 tabular-nums ml-1 flex-shrink-0">{subj.count.toLocaleString('en-US')}</span>
                </div>
                <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${subj.color} rounded-full transition-all duration-500`}
                    style={{ width: `${(subj.count / maxCount) * 100}%` }}
                  />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}
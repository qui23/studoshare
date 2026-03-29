'use client';
import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Icon from '@/components/ui/AppIcon';
import { createClient } from '@/lib/supabase/client';

interface DocStats {
  download_count: number;
  view_count: number;
  file_type: string;
  file_size: number;
  file_name: string;
  created_at: string;
  doc_type: string | null;
}

interface RatingRow {
  stars: number;
  count: number;
  pct: number;
}

export default function DocumentSidebar() {
  const searchParams = useSearchParams();
  const docId = searchParams.get('id');

  const [stats, setStats] = useState<DocStats | null>(null);
  const [ratings, setRatings] = useState<RatingRow[]>([]);
  const [avgRating, setAvgRating] = useState<number | null>(null);
  const [totalRatings, setTotalRatings] = useState(0);
  const [bookmarkCount, setBookmarkCount] = useState(0);

  useEffect(() => {
    if (!docId) return;
    const supabase = createClient();

    const fetchStats = async () => {
      const { data } = await supabase
        .from('documents')
        .select('download_count, view_count, file_type, file_size, file_name, created_at, doc_type')
        .eq('id', docId)
        .single();
      if (data) setStats(data as DocStats);
    };

    const fetchRatings = async () => {
      const { data } = await supabase
        .from('ratings')
        .select('rating')
        .eq('document_id', docId);

      if (!data || data.length === 0) {
        setRatings([]);
        setAvgRating(null);
        setTotalRatings(0);
        return;
      }

      const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      let sum = 0;
      data.forEach((r: any) => {
        const s = Math.round(r.rating);
        if (s >= 1 && s <= 5) { counts[s]++; sum += r.rating; }
      });
      const total = data.length;
      const dist = [5, 4, 3, 2, 1].map(s => ({
        stars: s,
        count: counts[s],
        pct: total > 0 ? Math.round((counts[s] / total) * 100) : 0,
      }));
      setRatings(dist);
      setAvgRating(Math.round((sum / total) * 10) / 10);
      setTotalRatings(total);
    };

    const fetchBookmarks = async () => {
      const { count } = await supabase
        .from('bookmarks')
        .select('id', { count: 'exact', head: true })
        .eq('document_id', docId);
      setBookmarkCount(count || 0);
    };

    fetchStats();
    fetchRatings();
    fetchBookmarks();
  }, [docId]);

  const fileExt = stats?.file_name?.split('.').pop()?.toUpperCase() || stats?.file_type?.split('/').pop()?.toUpperCase() || '—';
  const fileSizeMB = stats?.file_size ? `${(stats.file_size / (1024 * 1024)).toFixed(1)} MB` : '—';
  const lastUpdated = stats?.created_at
    ? new Date(stats.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : '—';

  return (
    <aside className="hidden lg:block w-64 xl:w-72 flex-shrink-0 space-y-4 sticky top-24">
      {/* Document Stats */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-50 flex items-center gap-2">
          <Icon name="ChartBarIcon" size={15} className="text-indigo-600" />
          <span className="font-display font-600 text-sm text-gray-900">Document Stats</span>
        </div>
        <div className="p-4 grid grid-cols-2 gap-3">
          {[
            { label: 'Downloads', value: stats ? (stats.download_count || 0).toLocaleString() : '—', icon: 'ArrowDownTrayIcon', color: 'text-indigo-600 bg-indigo-50' },
            { label: 'Views', value: stats ? (stats.view_count || 0).toLocaleString() : '—', icon: 'EyeIcon', color: 'text-cyan-600 bg-cyan-50' },
            { label: 'Bookmarks', value: bookmarkCount.toLocaleString(), icon: 'BookmarkIcon', color: 'text-amber-600 bg-amber-50' },
            { label: 'Ratings', value: totalRatings > 0 ? totalRatings.toLocaleString() : '—', icon: 'StarIcon', color: 'text-green-600 bg-green-50' },
          ].map((stat) => (
            <div key={`stat-${stat.label}`} className="flex flex-col items-center p-2.5 bg-gray-50 rounded-lg">
              <div className={`p-1.5 rounded-md mb-1.5 ${stat.color}`}>
                <Icon name={stat.icon as any} size={14} />
              </div>
              <span className="font-display font-700 text-sm text-gray-900 tabular-nums">{stat.value}</span>
              <span className="text-xs text-gray-500 mt-0.5">{stat.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Rating Distribution */}
      {totalRatings > 0 && avgRating !== null && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-50 flex items-center gap-2">
            <Icon name="StarIcon" size={15} className="text-amber-500" />
            <span className="font-display font-600 text-sm text-gray-900">Rating Breakdown</span>
          </div>
          <div className="p-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="text-center">
                <p className="font-display font-800 text-4xl text-gray-900 tabular-nums">{avgRating.toFixed(1)}</p>
                <div className="flex justify-center gap-0.5 my-1">
                  {[1,2,3,4,5].map(s => (
                    <svg key={`big-star-${s}`} width="12" height="12" viewBox="0 0 24 24"
                      fill={s <= Math.round(avgRating) ? '#F59E0B' : 'none'}
                      stroke="#F59E0B"
                      strokeWidth="2"
                    >
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                  ))}
                </div>
                <p className="text-xs text-gray-500 tabular-nums">{totalRatings} ratings</p>
              </div>
              <div className="flex-1 space-y-1.5">
                {ratings.map((r) => (
                  <div key={`rd-${r.stars}`} className="flex items-center gap-1.5">
                    <span className="text-xs text-gray-500 w-3 tabular-nums">{r.stars}</span>
                    <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-400 rounded-full transition-all duration-700"
                        style={{ width: `${r.pct}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-400 w-7 tabular-nums text-right">{r.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Document Info */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-50 flex items-center gap-2">
          <Icon name="InformationCircleIcon" size={15} className="text-indigo-600" />
          <span className="font-display font-600 text-sm text-gray-900">Document Info</span>
        </div>
        <div className="p-4 space-y-3">
          {[
            { label: 'File Type', value: fileExt, icon: 'DocumentTextIcon' },
            { label: 'File Size', value: fileSizeMB, icon: 'ServerIcon' },
            { label: 'Last Updated', value: lastUpdated, icon: 'ClockIcon' },
          ].map((info) => (
            <div key={`info-${info.label}`} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icon name={info.icon as any} size={13} className="text-gray-400" />
                <span className="text-xs text-gray-500">{info.label}</span>
              </div>
              <span className="text-xs font-medium text-gray-800">{info.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Report */}
      <button className="w-full flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200 text-xs text-gray-500 hover:border-red-200 hover:text-red-500 hover:bg-red-50 transition-all duration-150 font-medium">
        <Icon name="FlagIcon" size={13} />
        Report this document
      </button>
    </aside>
  );
}
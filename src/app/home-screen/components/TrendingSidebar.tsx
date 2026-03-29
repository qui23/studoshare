'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Icon from '@/components/ui/AppIcon';
import { createClient } from '@/lib/supabase/client';

interface TrendingTag {
  tag: string;
  count: number;
}

interface TopContributor {
  id: string;
  name: string;
  uploads: number;
  initials: string;
  color: string;
}

const AVATAR_COLORS = [
  'bg-indigo-100 text-indigo-700',
  'bg-violet-100 text-violet-700',
  'bg-cyan-100 text-cyan-700',
  'bg-purple-100 text-purple-700',
  'bg-pink-100 text-pink-700',
  'bg-green-100 text-green-700',
  'bg-amber-100 text-amber-700',
];

function getInitials(name: string): string {
  const parts = name.trim().split(' ');
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export default function TrendingSidebar() {
  const [trendingTags, setTrendingTags] = useState<TrendingTag[]>([]);
  const [topContributors, setTopContributors] = useState<TopContributor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const supabase = createClient();

        // Fetch all public document tags and uploader info
        const { data: docsData } = await supabase
          .from('documents')
          .select('tags, uploader_id, user_profiles!documents_uploader_id_fkey(id, full_name)')
          .eq('visibility', 'public');

        if (docsData) {
          // Build trending tags
          const tagMap: Record<string, number> = {};
          // Build contributor upload counts
          const uploaderMap: Record<string, { name: string; count: number }> = {};

          docsData.forEach((doc) => {
            (doc.tags || []).forEach((tag: string) => {
              if (tag) tagMap[tag] = (tagMap[tag] || 0) + 1;
            });
            const profile = doc.user_profiles as any;
            if (profile?.id && profile?.full_name) {
              if (!uploaderMap[profile.id]) {
                uploaderMap[profile.id] = { name: profile.full_name, count: 0 };
              }
              uploaderMap[profile.id].count += 1;
            }
          });

          const sortedTags = Object.entries(tagMap)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([tag, count]) => ({ tag, count }));
          setTrendingTags(sortedTags);

          const sortedContributors: TopContributor[] = Object.entries(uploaderMap)
            .sort((a, b) => b[1].count - a[1].count)
            .slice(0, 5)
            .map(([id, { name, count }], i) => ({
              id,
              name,
              uploads: count,
              initials: getInitials(name),
              color: AVATAR_COLORS[i % AVATAR_COLORS.length],
            }));
          setTopContributors(sortedContributors);
        }
      } catch (err) {
        console.log('TrendingSidebar fetch error:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  return (
    <aside className="hidden xl:block w-56 2xl:w-64 flex-shrink-0 space-y-4 sticky top-24">
      {/* Trending Tags */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-50 flex items-center gap-2">
          <Icon name="HashtagIcon" size={15} className="text-pink-500" />
          <span className="font-display font-600 text-sm text-gray-900">Trending Tags</span>
        </div>
        <div className="p-3 flex flex-wrap gap-1.5">
          {loading && <p className="text-xs text-gray-400 px-1">Loading...</p>}
          {!loading && trendingTags.length === 0 && (
            <p className="text-xs text-gray-400 px-1">No tags yet</p>
          )}
          {!loading && trendingTags.map((t) => (
            <button
              key={`trend-tag-${t.tag}`}
              className="px-2 py-1 bg-gray-50 hover:bg-indigo-50 hover:text-indigo-700 text-gray-600 text-xs rounded-lg border border-gray-100 hover:border-indigo-200 transition-all duration-150 font-medium"
            >
              #{t.tag}
              <span className="ml-1 text-gray-400 tabular-nums">{t.count >= 1000 ? `${(t.count / 1000).toFixed(1)}k` : t.count}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Top Contributors */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-50 flex items-center gap-2">
          <Icon name="TrophyIcon" size={15} className="text-amber-500" />
          <span className="font-display font-600 text-sm text-gray-900">Top Contributors</span>
        </div>
        <div className="p-3 space-y-2">
          {loading && <p className="text-xs text-gray-400">Loading...</p>}
          {!loading && topContributors.length === 0 && (
            <p className="text-xs text-gray-400">No contributors yet</p>
          )}
          {!loading && topContributors.map((c, i) => (
            <div key={`contrib-${c.id}`} className="flex items-center gap-2.5 group">
              <span className="text-xs text-gray-400 tabular-nums w-4 flex-shrink-0 font-mono-data">{i + 1}</span>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-display font-600 flex-shrink-0 ${c.color}`}>
                {c.initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-800 truncate">{c.name}</p>
                <p className="text-xs text-gray-400 tabular-nums">{c.uploads} docs</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Upload CTA */}
      <div className="bg-gradient-to-br from-indigo-600 to-violet-600 rounded-xl p-4 text-center">
        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-2">
          <Icon name="ArrowUpTrayIcon" size={20} className="text-white" />
        </div>
        <p className="font-display font-700 text-white text-sm mb-1">Share Your Notes</p>
        <p className="text-indigo-200 text-xs mb-3 leading-relaxed">Help fellow students and earn Contributor status</p>
        <Link
          href="/upload-screen"
          className="block px-4 py-2 bg-white text-indigo-700 text-xs font-display font-600 rounded-lg hover:bg-indigo-50 active:scale-95 transition-all duration-150"
        >
          Upload Document
        </Link>
      </div>
    </aside>
  );
}
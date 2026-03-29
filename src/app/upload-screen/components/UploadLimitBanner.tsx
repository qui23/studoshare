import React from 'react';
import Icon from '@/components/ui/AppIcon';

export default function UploadLimitBanner() {
  const used = 2;
  const limit = 5;
  const pct = (used / limit) * 100;

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-4 flex flex-col sm:flex-row sm:items-center gap-3">
      <div className="flex items-center gap-3 flex-1">
        <div className="p-2 bg-indigo-50 rounded-lg flex-shrink-0">
          <Icon name="ArrowUpTrayIcon" size={18} className="text-indigo-600" />
        </div>
        <div>
          <p className="font-display font-600 text-sm text-gray-900">Daily Upload Limit</p>
          <p className="text-xs text-gray-500 mt-0.5">
            <span className="text-indigo-700 font-medium tabular-nums">{used} of {limit}</span> uploads used today — resets at midnight UTC
          </p>
        </div>
      </div>
      <div className="flex-1 max-w-[200px]">
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${pct >= 80 ? 'bg-amber-400' : 'bg-indigo-500'}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="text-xs text-gray-400 mt-1 tabular-nums">{limit - used} remaining</p>
      </div>
      <div className="flex items-center gap-1.5 text-xs text-green-600 bg-green-50 px-3 py-1.5 rounded-lg border border-green-100 flex-shrink-0">
        <Icon name="CheckCircleIcon" size={14} />
        Pro Contributor
      </div>
    </div>
  );
}
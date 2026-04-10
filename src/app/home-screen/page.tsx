'use client';
import React, { useState } from 'react';
import AppLayout from '@/components/AppLayout';
import HomeHero from './components/HomeHero';
import DocumentGrid from './components/DocumentGrid';
import FilterSidebar from './components/FilterSidebar';
import TrendingSidebar from './components/TrendingSidebar';
import Icon from '@/components/ui/AppIcon';

export default function HomeScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [fileTypeFilter, setFileTypeFilter] = useState('');
  const [sidebarFileTypes, setSidebarFileTypes] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState('all');
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  return (
    <AppLayout>
      <HomeHero onSearch={setSearchQuery} onSubjectChange={setSubjectFilter} onFileTypeChange={setFileTypeFilter} />

      {/* Mobile Filter Toggle */}
      <div className="lg:hidden mt-4 flex items-center gap-2">
        <button
          onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition-colors"
        >
          <Icon name="FunnelIcon" size={15} className="text-indigo-600" />
          {mobileFilterOpen ? 'Hide Filters' : 'Show Filters'}
        </button>
      </div>

      {/* Mobile Filter Panel */}
      {mobileFilterOpen && (
        <div className="lg:hidden mt-3">
          <FilterSidebar onFileTypeChange={setSidebarFileTypes} onDateRangeChange={setDateRange} mobile />
        </div>
      )}

      <div className="mt-4 lg:mt-6 flex gap-6 items-start">
        <FilterSidebar onFileTypeChange={setSidebarFileTypes} onDateRangeChange={setDateRange} />
        <DocumentGrid
          searchQuery={searchQuery}
          subjectFilter={subjectFilter}
          fileTypeFilter={fileTypeFilter}
          sidebarFileTypes={sidebarFileTypes}
          dateRange={dateRange}
        />
        <TrendingSidebar />
      </div>

      {/* Mobile Trending Section */}
      <div className="xl:hidden mt-6">
        <TrendingSidebar mobile />
      </div>
    </AppLayout>
  );
}
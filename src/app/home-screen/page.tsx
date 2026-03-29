'use client';
import React, { useState } from 'react';
import AppLayout from '@/components/AppLayout';
import HomeHero from './components/HomeHero';
import DocumentGrid from './components/DocumentGrid';
import FilterSidebar from './components/FilterSidebar';
import TrendingSidebar from './components/TrendingSidebar';

export default function HomeScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [fileTypeFilter, setFileTypeFilter] = useState('');
  const [sidebarFileTypes, setSidebarFileTypes] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState('all');

  return (
    <AppLayout>
      <HomeHero onSearch={setSearchQuery} onSubjectChange={setSubjectFilter} onFileTypeChange={setFileTypeFilter} />
      <div className="mt-6 flex gap-6 items-start">
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
    </AppLayout>
  );
}
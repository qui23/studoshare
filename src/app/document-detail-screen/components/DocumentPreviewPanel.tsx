'use client';
import React, { useState } from 'react';
import Icon from '@/components/ui/AppIcon';

const MOCK_PAGES = [
  { page: 1, title: 'Table of Contents & Introduction', preview: 'Chapter 1: Review of Integration Basics\nChapter 2: Integration by Substitution\nChapter 3: Integration by Parts\nChapter 4: Trigonometric Substitution\nChapter 5: Partial Fractions\nChapter 6: Improper Integrals\nChapter 7: Sequences & Series\nChapter 8: Power Series & Taylor Series' },
  { page: 2, title: 'Chapter 1: Review of Integration Basics', preview: '1.1 The Fundamental Theorem of Calculus\n\nIf F is an antiderivative of f on [a, b], then:\n∫ₐᵇ f(x) dx = F(b) - F(a)\n\nKey Integration Formulas:\n• ∫ xⁿ dx = xⁿ⁺¹/(n+1) + C, n ≠ -1\n• ∫ eˣ dx = eˣ + C\n• ∫ sin(x) dx = -cos(x) + C\n• ∫ cos(x) dx = sin(x) + C\n• ∫ 1/x dx = ln|x| + C' },
  { page: 3, title: 'Chapter 2: Integration by Substitution', preview: '2.1 The Substitution Rule\n\nIf u = g(x) is differentiable and f is continuous, then:\n∫ f(g(x))g\'(x) dx = ∫ f(u) du\n\nExample 2.1: Evaluate ∫ 2x·cos(x²) dx\n\nSolution: Let u = x², then du = 2x dx\n∫ 2x·cos(x²) dx = ∫ cos(u) du = sin(u) + C = sin(x²) + C\n\nExample 2.2: Evaluate ∫ eˢⁱⁿˣ·cos(x) dx' },
];

export default function DocumentPreviewPanel() {
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(100);
  const [fullscreen, setFullscreen] = useState(false);
  const totalPages = 87;

  return (
    <div className={`bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden ${fullscreen ? 'fixed inset-4 z-50' : ''}`}>
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 bg-gray-50">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-0.5">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150"
              aria-label="Previous page"
            >
              <Icon name="ChevronLeftIcon" size={14} />
            </button>
            <div className="flex items-center gap-1 px-2">
              <input
                type="number"
                value={currentPage}
                onChange={(e) => setCurrentPage(Math.min(totalPages, Math.max(1, Number(e?.target?.value))))}
                className="w-8 text-center text-xs font-mono-data text-gray-700 outline-none bg-transparent"
                min={1}
                max={totalPages}
              />
              <span className="text-xs text-gray-400">/ {totalPages}</span>
            </div>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150"
              aria-label="Next page"
            >
              <Icon name="ChevronRightIcon" size={14} />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Zoom */}
          <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-0.5">
            <button
              onClick={() => setZoom(Math.max(50, zoom - 10))}
              className="p-1.5 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-all duration-150"
              aria-label="Zoom out"
            >
              <Icon name="MinusIcon" size={14} />
            </button>
            <span className="text-xs font-mono-data text-gray-700 w-12 text-center tabular-nums">{zoom}%</span>
            <button
              onClick={() => setZoom(Math.min(200, zoom + 10))}
              className="p-1.5 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-all duration-150"
              aria-label="Zoom in"
            >
              <Icon name="PlusIcon" size={14} />
            </button>
          </div>

          <button
            onClick={() => setFullscreen(!fullscreen)}
            className="p-1.5 rounded-lg border border-gray-200 bg-white text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-all duration-150"
            aria-label={fullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          >
            <Icon name={fullscreen ? 'ArrowsPointingInIcon' : 'ArrowsPointingOutIcon'} size={14} />
          </button>
        </div>
      </div>
      {/* Preview Content */}
      <div className="bg-gray-100 p-4 min-h-[480px] flex items-start justify-center overflow-auto">
        <div
          className="bg-white shadow-lg rounded-sm border border-gray-200 transition-all duration-200"
          style={{ width: `${zoom}%`, maxWidth: '700px', minWidth: '300px' }}
        >
          {/* Page Header */}
          <div className="border-b border-gray-100 px-8 py-4 bg-indigo-600">
            <p className="text-white font-display font-700 text-base">Calculus II — Integration Techniques & Series</p>
            <p className="text-indigo-200 text-xs mt-0.5">MIT Mathematics Department — 18.02 — Spring 2026</p>
          </div>

          {/* Page Content */}
          <div className="px-8 py-6">
            {MOCK_PAGES?.filter(p => p?.page === (currentPage <= 3 ? currentPage : 3))?.map((pg) => (
              <div key={`pg-${pg?.page}`}>
                <p className="font-display font-700 text-base text-gray-900 mb-4">{pg?.title}</p>
                <pre className="text-sm text-gray-700 font-mono-data leading-relaxed whitespace-pre-wrap">{pg?.preview}</pre>
              </div>
            ))}
            {currentPage > 3 && (
              <div className="text-center py-12">
                <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Icon name="LockClosedIcon" size={20} className="text-indigo-400" />
                </div>
                <p className="font-display font-600 text-gray-700 mb-1">Preview Limited to 3 Pages</p>
                <p className="text-sm text-gray-500 mb-4">Download the full document to access all {totalPages} pages</p>
                <button className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-sm font-display font-600 rounded-lg transition-all duration-150">
                  Download Full Document
                </button>
              </div>
            )}
          </div>

          {/* Page Footer */}
          <div className="border-t border-gray-100 px-8 py-3 flex items-center justify-between">
            <span className="text-xs text-gray-400">Page {currentPage} of {totalPages}</span>
            <span className="text-xs text-gray-400">StudoShare — studoshare.io</span>
          </div>
        </div>
      </div>
      {/* Page Thumbnails */}
      <div className="border-t border-gray-100 px-4 py-3 bg-gray-50 flex items-center gap-2 overflow-x-auto scrollbar-thin">
        {Array.from({ length: Math.min(10, totalPages) }, (_, i) => i + 1)?.map((p) => (
          <button
            key={`thumb-${p}`}
            onClick={() => setCurrentPage(p)}
            className={`flex-shrink-0 w-12 h-16 rounded border-2 flex flex-col items-center justify-center text-xs transition-all duration-150 ${
              currentPage === p
                ? 'border-indigo-500 bg-indigo-50 text-indigo-700 font-medium' :'border-gray-200 bg-white text-gray-500 hover:border-indigo-300 hover:bg-indigo-50/50'
            }`}
          >
            <Icon name="DocumentTextIcon" size={14} className="mb-0.5 opacity-50" />
            <span className="font-mono-data tabular-nums">{p}</span>
          </button>
        ))}
        <div className="flex-shrink-0 w-12 h-16 rounded border border-dashed border-gray-300 flex items-center justify-center text-xs text-gray-400">
          +{totalPages - 10}
        </div>
      </div>
    </div>
  );
}
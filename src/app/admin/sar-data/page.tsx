'use client';

import React, { useState } from 'react';
import { Database, Search, Play } from 'lucide-react';
import DashboardWrapper from '@/components/layout/DashboardWrapper';
import IngestPage from '@/app/admin/ingest/page';
import QueryDataPage from '@/app/admin/query-data/page';

const SarAdminPage = () => {
  const [activeTab, setActiveTab] = useState<'ingest' | 'query'>('ingest');

  return (
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6">
        <div className="mb-12 flex flex-col lg:flex-row lg:items-end justify-between gap-8">
          <div className="space-y-2">
            <h1 className="text-2xl font-black text-slate-900 capitalize italic tracking-tight leading-none">SAR Data Control</h1>
            <p className="text-sm font-medium text-slate-400">Governance for autonomous data ingestion and granular query execution</p>
          </div>

          {/* Tabs */}
          <div className="bg-slate-100 p-1 rounded-xl inner-shadow flex w-fit border border-slate-200/50">
            <button
              onClick={() => setActiveTab('ingest')}
              className={`px-8 py-2.5 rounded-xl text-xs font-black capitalize tracking-[0.2em] transition-all duration-300 flex items-center gap-2.5 ${
                activeTab === 'ingest' ? 'bg-white text-blue-600 shadow-sm border border-slate-100' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <Play className={`w-3.5 h-3.5 ${activeTab === 'ingest' ? 'text-blue-600' : 'text-slate-400'}`} /> Ingestion Pipeline
            </button>
            <button
              onClick={() => setActiveTab('query')}
              className={`px-8 py-2.5 rounded-xl text-xs font-black capitalize tracking-[0.2em] transition-all duration-300 flex items-center gap-2.5 ${
                activeTab === 'query' ? 'bg-white text-blue-600 shadow-sm border border-slate-100' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <Search className={`w-3.5 h-3.5 ${activeTab === 'query' ? 'text-blue-600' : 'text-slate-400'}`} /> RAW Explorer
            </button>
          </div>
        </div>

        <div className="animate-ease-in">
            {activeTab === 'ingest' ? <IngestPage /> : <QueryDataPage />}
        </div>
      </div>
  );
};

export default SarAdminPage;

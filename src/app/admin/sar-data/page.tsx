'use client';

import React, { useState } from 'react';
import { Database, Search, Play } from 'lucide-react';
import DashboardWrapper from '@/components/layout/DashboardWrapper';
import IngestPage from '@/app/admin/ingest/page';
import QueryDataPage from '@/app/admin/query-data/page';

const SarAdminPage = () => {
  const [activeTab, setActiveTab] = useState<'ingest' | 'query'>('ingest');

  return (
      <div className="max-w-7xl mx-auto py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tight flex items-center gap-3">
                <div className="p-2 bg-blue-600 rounded-xl text-white">
                    <Database className="w-6 h-6" />
                </div>
                SAR Data Management
            </h1>
            <p className="text-sm font-bold text-gray-400 mt-2 ml-14">Administer SAR metric files and database queries</p>
          </div>
          
          {/* Tabs */}
          <div className="bg-gray-100 p-1 rounded-2xl flex">
            <button
              onClick={() => setActiveTab('ingest')}
              className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
                activeTab === 'ingest' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Play className="w-3 h-3" /> Ingestion
            </button>
            <button
              onClick={() => setActiveTab('query')}
              className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
                activeTab === 'query' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Search className="w-3 h-3" /> Explorer
            </button>
          </div>
        </div>

        {activeTab === 'ingest' ? <IngestPage /> : <QueryDataPage />}
      </div>
  );
};

export default SarAdminPage;

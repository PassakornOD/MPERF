'use client';
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Trash2, List, FolderOpen } from 'lucide-react';
import Block from '@/components/common/Block';
import { useRouter } from 'next/navigation';

export default function TemplatesPage() {
    const router = useRouter();
    const { data: templates, refetch } = useQuery({
        queryKey: ['report-templates'],
        queryFn: async () => (await axios.get('/api/report-templates')).data
    });

    const deleteTemplate = async (id: number) => {
        if (!confirm("Are you sure?")) return;
        try {
            await axios.delete(`/api/report-templates/${id}`);
            refetch();
        } catch (e) {
            alert("Failed to delete template");
        }
    };

    return (
        <Block title="Manage Report Templates" subtitle="View and manage your saved report configurations">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {templates?.map((t: any) => (
                    <div key={t.id} className="relative bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:border-blue-400 transition-all">
                        <div className="flex justify-between items-start mb-2">
                            <span className="text-sm font-bold text-slate-800">{t.name}</span>
                            <button onClick={() => deleteTemplate(t.id)} className="p-1 text-slate-300 hover:text-red-600 transition-all">
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                        
                        <div className="text-[10px] text-slate-600 mb-3">
                            <span className="font-bold text-slate-800 underline decoration-blue-200 block mb-1">Hostgroups:</span>
                            <div className="flex flex-wrap gap-2">
                            {Object.entries(t.config.selectedHostnames.reduce((acc: any, h: any) => {
                                acc[h.group] = (acc[h.group] || 0) + 1;
                                return acc;
                            }, {})).map(([group, count]: any) => (
                                <span key={group} className="flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-100 font-medium">
                                {group}
                                <span className="bg-blue-200 text-blue-800 text-[8px] font-bold px-1 rounded-full">
                                    {count}
                                </span>
                                </span>
                            ))}
                            </div>
                        </div>

                        <div className="space-y-1">
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Enabled Charts:</p>
                            <div className="flex flex-wrap gap-1">
                            {t.config.activeReports?.filter((r: any) => r.enabled).map((r: any) => (
                                <span key={r.id} className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[9px] font-medium border border-slate-200">
                                {r.label}
                                </span>
                            ))}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            {(!templates || templates.length === 0) && (
                <div className="text-center py-20 text-slate-400">
                    <FolderOpen className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No templates found.</p>
                </div>
            )}
        </Block>
    );
}

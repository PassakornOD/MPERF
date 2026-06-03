'use client';

import React from 'react';
import { ShieldCheck, Users, Layers, Lock, AlertTriangle, ChevronRight, Server, FileText, Settings } from 'lucide-react';

const Section = ({ title, children, icon }: { title: string, children: React.ReactNode, icon?: React.ReactNode }) => (
    <section className="mb-16">
        <h3 className="text-slate-400 capitalize  text-xl mb-8 flex items-center gap-2">
            {icon ? icon : <ChevronRight size={16} className="text-blue-500" />} {title}
        </h3>
        {children}
    </section>
);

export default function AdminGuidePage() {
    return (
        <div className="max-w-5xl mx-auto px-6 py-16">
            <header className="mb-20 text-center">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 text-blue-600 text-xs capitalize  mb-6 border border-blue-100 shadow-sm">
                    <ShieldCheck size={14} /> System Documentation
                </div>
                <h1 className="text-5xl text-slate-900 capitalize italic tracking-tight mb-4">Admin Dashboard Guide</h1>
                <p className="text-slate-500 text-lg max-w-2xl mx-auto leading-relaxed">Centralized management for system access, user roles, and security configurations.</p>
            </header>

            {/* 1. Admin Modules */}
            <Section title="1. Admin Modules" icon={<ShieldCheck size={16} className="text-blue-500" />}>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="modern-card p-8 flex flex-col gap-4">
                        <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 mb-2">
                            <Users size={20} />
                        </div>
                        <h4 className="text-slate-900 text-sm capitalize italic tracking-tight">User Management</h4>
                        <p className="text-[11px] text-slate-500 leading-relaxed flex-grow">Manage user lifecycle. Administrators can create, modify, and delete users.</p>
                        <div className="pt-4 border-t border-slate-100 space-y-3">
                            <div>
                                <span className="text-slate-400 capitalize  text-[9px]">Workflow</span>
                                <ul className="text-[11px] text-slate-600 mt-1 list-disc pl-4 space-y-0.5">
                                    <li>Add user via "+" icon.</li>
                                    <li>Assign role (Admin/Sysadmin/Operation).</li>
                                    <li>Use Edit icon to manage membership.</li>
                                </ul>
                            </div>
                            <div className="p-3 bg-red-50 rounded-xl text-xs font-bold text-red-700">Security: Protected accounts (sysreport/mfadmin) are locked.</div>
                        </div>
                    </div>

                    <div className="modern-card p-8 flex flex-col gap-4">
                        <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center text-green-600 mb-2">
                            <Layers size={20} />
                        </div>
                        <h4 className="text-slate-900 text-sm capitalize italic tracking-tight">User Group Management</h4>
                        <p className="text-[11px] text-slate-500 leading-relaxed flex-grow">Organize users into logical groups for efficient permission application.</p>
                        <div className="pt-4 border-t border-slate-100 space-y-3">
                            <div>
                                <span className="text-slate-400 capitalize  text-[9px]">Workflow</span>
                                <ul className="text-[11px] text-slate-600 mt-1 list-disc pl-4 space-y-0.5">
                                    <li>Create group via "+" icon.</li>
                                    <li>Edit to add members & PG associations.</li>
                                </ul>
                            </div>
                            <div className="p-3 bg-amber-50 rounded-xl text-xs font-bold text-amber-800">Note: Default system groups (admin, sysadmin) are protected.</div>
                        </div>
                    </div>

                    <div className="modern-card p-8 flex flex-col gap-4">
                        <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 mb-2">
                            <ShieldCheck size={20} />
                        </div>
                        <h4 className="text-slate-900 text-sm capitalize italic tracking-tight">Permission Management</h4>
                        <p className="text-[11px] text-slate-500 leading-relaxed flex-grow">Granular mapping of security permissions to specific Hostgroups.</p>
                        <div className="pt-4 border-t border-slate-100 space-y-3">
                            <div>
                                <span className="text-slate-400 capitalize  text-[9px]">Workflow</span>
                                <ul className="text-[11px] text-slate-600 mt-1 list-disc pl-4 space-y-0.5">
                                    <li>Define Permission Group (PG).</li>
                                    <li>Edit to associate Hostgroups.</li>
                                    <li>Link PG to User Group via "Associated" tab.</li>
                                </ul>
                            </div>
                            <div className="p-3 bg-purple-50 rounded-xl text-xs font-bold text-purple-800">Security: Access is restricted by created_by or user ownership.</div>
                        </div>
                    </div>
                </div>
            </Section>

            {/* 2. Admin Workflow */}
            <Section title="2. Access Mapping Workflow" icon={<Server size={16} className="text-blue-500" />}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                        { title: "1. Security Mapping", desc: "Map server hostgroups to a specific Permission Group (PG) to define resource access." },
                        { title: "2. Association", desc: "Link the created Permission Group to a User Group, establishing the association layer." },
                        { title: "3. User Enrollment", desc: "Assign system users to the User Group to finalize access rights for the entire chain." },
                    ].map((card, idx) => (
                        <div key={idx} className="modern-card p-8 flex flex-col items-center text-center">
                            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 text-xs mb-4">0{idx + 1}</div>
                            <h4 className="text-slate-900 text-sm mb-3 capitalize italic tracking-tight">{card.title}</h4>
                            <p className="text-slate-500 text-[11px] leading-relaxed font-medium">{card.desc}</p>
                        </div>
                    ))}
                </div>
            </Section>

            {/* 3. Security & Guidelines */}
            <Section title="3. Security & Best Practices" icon={<Lock size={16} className="text-red-500" />}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-amber-50 border border-amber-200 rounded-[2rem] p-8 shadow-sm">
                        <h4 className="text-amber-900 text-xs capitalize italic tracking-tight mb-4 flex items-center gap-2"><Lock size={16} /> Best Practices</h4>
                        <ul className="space-y-3 text-xs text-amber-800 font-bold capitalize tracking-tight">
                            <li>• <b>Least Privilege:</b> Assign only essential roles (Operation vs Sysadmin).</li>
                            <li>• <b>Auditing:</b> Major actions are automatically recorded in <code>security.log</code>.</li>
                            <li>• <b>Caution:</b> Deletion of users/groups is irreversible.</li>
                        </ul>
                    </div>
                    <div className="bg-slate-900 border border-slate-800 rounded-[2rem] p-8 shadow-2xl">
                        <h4 className="text-white text-xs capitalize italic tracking-tight mb-4 flex items-center gap-2"><AlertTriangle size={16} /> System Integrity</h4>
                        <ul className="space-y-3 text-xs text-slate-400 font-bold capitalize tracking-tight">
                            <li>• Protected accounts (<code>sysreport</code>, <code>mfadmin</code>) cannot be modified.</li>
                            <li>• Role isolation prevents unauthorized privilege escalation.</li>
                        </ul>
                    </div>
                </div>
            </Section>
        </div>
    );
}

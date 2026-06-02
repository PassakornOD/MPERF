'use client';

import React from 'react';
import { ShieldCheck, Users, Layers, Lock, AlertTriangle, ChevronRight, Server, FileText, Settings } from 'lucide-react';

const Section = ({ title, children, icon }: { title: string, children: React.ReactNode, icon?: React.ReactNode }) => (
  <section className="mb-16">
    <h3 className="text-xs font-bold text-gray-400 capitalize tracking-widest mb-8 flex items-center gap-2">
      {icon ? icon : <ChevronRight size={16} className="text-blue-500" />} {title}
    </h3>
    {children}
  </section>
);

export default function AdminGuidePage() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-16">
      <header className="mb-20 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 text-blue-600 text-xs font-black capitalize tracking-widest mb-6 border border-blue-100 shadow-sm">
          <ShieldCheck size={14} /> System Documentation
        </div>
        <h1 className="text-5xl font-extrabold text-gray-900 tracking-tight mb-4">Admin Dashboard Guide</h1>
        <p className="text-gray-500 text-lg max-w-2xl mx-auto leading-relaxed">Centralized management for system access, user roles, and security configurations.</p>
      </header>

      {/* 1. Admin Modules */}
      <Section title="1. Admin Modules" icon={<ShieldCheck size={16} className="text-blue-500"/>}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm p-8 flex flex-col gap-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 mb-2">
                    <Users size={20} />
                </div>
                <h4 className="font-bold text-gray-900 text-sm">User Management</h4>
                <p className="text-[11px] text-gray-500 leading-relaxed flex-grow">Manage user lifecycle. Administrators can create, modify, and delete users.</p>
                <div className="pt-4 border-t border-gray-100 space-y-3">
                    <div>
                        <span className="text-xs font-black text-blue-600 capitalize">Workflow</span>
                        <ul className="text-[11px] text-gray-600 mt-1 list-disc pl-4 space-y-0.5">
                            <li>Add user via "+" icon.</li>
                            <li>Assign role (Admin/Sysadmin/Operation).</li>
                            <li>Use Edit icon to manage membership.</li>
                        </ul>
                    </div>
                    <div className="p-3 bg-red-50 rounded-lg text-xs font-bold text-red-700">Security: Protected accounts (sysreport/mfadmin) are locked.</div>
                </div>
            </div>

            <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm p-8 flex flex-col gap-4">
                <div className="w-12 h-12 rounded-2xl bg-green-50 flex items-center justify-center text-green-600 mb-2">
                    <Layers size={20} />
                </div>
                <h4 className="font-bold text-gray-900 text-sm">User Group Management</h4>
                <p className="text-[11px] text-gray-500 leading-relaxed flex-grow">Organize users into logical groups for efficient permission application.</p>
                <div className="pt-4 border-t border-gray-100 space-y-3">
                    <div>
                        <span className="text-xs font-black text-green-600 capitalize">Workflow</span>
                        <ul className="text-[11px] text-gray-600 mt-1 list-disc pl-4 space-y-0.5">
                            <li>Create group via "+" icon.</li>
                            <li>Edit to add members & PG associations.</li>
                        </ul>
                    </div>
                    <div className="p-3 bg-amber-50 rounded-lg text-xs font-bold text-amber-800">Note: Default system groups (admin, sysadmin) are protected.</div>
                </div>
            </div>

            <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm p-8 flex flex-col gap-4">
                <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-600 mb-2">
                    <ShieldCheck size={20} />
                </div>
                <h4 className="font-bold text-gray-900 text-sm">Permission Management</h4>
                <p className="text-[11px] text-gray-500 leading-relaxed flex-grow">Granular mapping of security permissions to specific Hostgroups.</p>
                <div className="pt-4 border-t border-gray-100 space-y-3">
                    <div>
                        <span className="text-xs font-black text-purple-600 capitalize">Workflow</span>
                        <ul className="text-[11px] text-gray-600 mt-1 list-disc pl-4 space-y-0.5">
                            <li>Define Permission Group (PG).</li>
                            <li>Edit to associate Hostgroups.</li>
                            <li>Link PG to User Group via "Associated" tab.</li>
                        </ul>
                    </div>
                    <div className="p-3 bg-purple-50 rounded-lg text-xs font-bold text-purple-800">Security: Access is restricted by created_by or user ownership.</div>
                </div>
            </div>
        </div>
      </Section>

      {/* 2. Admin Workflow */}
      <Section title="2. Access Mapping Workflow" icon={<Server size={16} className="text-blue-500"/>}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
                { title: "1. Security Mapping", desc: "Map server hostgroups to a specific Permission Group (PG) to define resource access." },
                { title: "2. Association", desc: "Link the created Permission Group to a User Group, establishing the association layer." },
                { title: "3. User Enrollment", desc: "Assign system users to the User Group to finalize access rights for the entire chain." },
            ].map((card, idx) => (
                <div key={idx} className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm flex flex-col items-center text-center">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 font-black text-xs mb-4">0{idx + 1}</div>
                    <h4 className="font-bold text-gray-900 text-sm mb-3">{card.title}</h4>
                    <p className="text-gray-500 text-[11px] leading-relaxed">{card.desc}</p>
                </div>
            ))}
        </div>
      </Section>

      {/* 3. Security & Guidelines */}
      <Section title="3. Security & Best Practices" icon={<Lock size={16} className="text-red-500"/>}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-amber-50 border border-amber-200 rounded-[32px] p-8">
                  <h4 className="font-black text-amber-900 text-xs capitalize tracking-tight mb-4 flex items-center gap-2"><Lock size={16}/> Best Practices</h4>
                  <ul className="space-y-3 text-xs text-amber-800 font-medium">
                      <li>• <b>Least Privilege:</b> Assign only essential roles (Operation vs Sysadmin).</li>
                      <li>• <b>Auditing:</b> Major actions are automatically recorded in <code>security.log</code>.</li>
                      <li>• <b>Caution:</b> Deletion of users/groups is irreversible.</li>
                  </ul>
              </div>
              <div className="bg-gray-900 border border-gray-800 rounded-[32px] p-8">
                  <h4 className="font-black text-white text-xs capitalize tracking-tight mb-4 flex items-center gap-2"><AlertTriangle size={16}/> System Integrity</h4>
                  <ul className="space-y-3 text-xs text-gray-400 font-medium">
                      <li>• Protected accounts (<code>sysreport</code>, <code>mfadmin</code>) cannot be modified.</li>
                      <li>• Role isolation prevents unauthorized privilege escalation.</li>
                  </ul>
              </div>
          </div>
      </Section>
    </div>
  );
}

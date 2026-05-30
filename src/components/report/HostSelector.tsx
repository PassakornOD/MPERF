import React from 'react';
import { Search, Monitor, ChevronDown, ChevronRight } from 'lucide-react';

interface Host {
    id: string;
    name: string;
    group: string;
    mem?: number;
}

interface Group {
    hostgroup: string;
    hostnames: { hostname_id: number; hostname: string; mem: number }[];
}

interface HostSelectorProps {
    groups: Group[];
    selectedHosts: Host[];
    expandedGroups: string[];
    searchTerm: string;
    onSearchTermChange: (term: string) => void;
    onToggleExpand: (groupName: string) => void;
    onToggleGroup: (groupName: string) => void;
    onToggleHostname: (host: Host) => void;
    selectedGroups: string[];
}

const HostSelector: React.FC<HostSelectorProps> = ({
    groups,
    selectedHosts,
    expandedGroups,
    searchTerm,
    onSearchTermChange,
    onToggleExpand,
    onToggleGroup,
    onToggleHostname,
    selectedGroups,
}) => {
    return (
        <div className="relative border border-gray-100 rounded-3xl p-6 pt-10 bg-white shadow-sm">
            <span className="absolute -top-4 left-6 bg-white px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 border border-gray-100 rounded-full shadow-sm flex items-center gap-2">
                <Monitor className="w-3.5 h-3.5" /> Select Hosts
            </span>
            <div className="relative mb-6">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                    className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold placeholder:text-gray-400 shadow-inner"
                    placeholder="Search Hostname..."
                    value={searchTerm}
                    onChange={e => onSearchTermChange(e.target.value)}
                />
            </div>
            <div className="space-y-1 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                {groups.map((g: any) => {
                    const isExpanded = expandedGroups.includes(g.hostgroup);
                    const isGroupSelected = selectedGroups.includes(g.hostgroup);
                    return (
                        <div key={g.hostgroup} className="border border-gray-100 rounded-xl bg-white overflow-hidden mb-1">
                            <div
                                className={`flex items-center justify-between p-2 cursor-pointer transition-colors ${isGroupSelected ? 'bg-blue-300 text-white' : 'hover:bg-gray-50'}`}
                                onClick={() => onToggleGroup(g.hostgroup)}
                            >
                                <div className="flex items-center gap-2">
                                    <button onClick={(e) => { e.stopPropagation(); onToggleExpand(g.hostgroup); }}>
                                        {isExpanded ? <ChevronDown className={`w-3 h-3 ${isGroupSelected ? 'text-white' : 'text-blue-600'}`} /> : <ChevronRight className="w-3 h-3 text-gray-400" />}
                                    </button>
                                    <span className={`text-[10px] font-black uppercase tracking-tight ${isGroupSelected ? 'text-white' : 'text-gray-700'}`}>{g.hostgroup}</span>
                                </div>
                            </div>
                            {isExpanded && (
                                <div className="p-1 space-y-0.5 bg-gray-50/50">
                                    {g.hostnames.map((h: any) => (
                                        <button
                                            key={h.hostname_id}
                                            onClick={(e) => { e.stopPropagation(); onToggleHostname({ id: String(h.hostname_id), name: h.hostname, group: g.hostgroup, mem: h.mem }); }}
                                            className={`w-full flex items-center gap-3 p-2.5 ml-4 border-l border-gray-200 rounded-lg text-[10px] font-medium transition-all ${selectedHosts.find(s => s.id === String(h.hostname_id)) ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                                        >
                                            {h.hostname}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default HostSelector;

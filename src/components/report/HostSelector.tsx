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
    onExpandAll: () => void;
    onCollapseAll: () => void;
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
    onExpandAll,
    onCollapseAll,
    onToggleGroup,
    onToggleHostname,
    selectedGroups,
}) => {
    return (
        <div className="relative border border-gray-100 rounded-[2rem] p-6 pt-12 bg-white shadow-sm transition-all hover:shadow-md h-full flex flex-col">
            <span className="absolute -top-4 left-6 bg-blue-50 text-blue-700 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] border border-blue-100 rounded-full shadow-sm flex items-center gap-2">
                <Monitor className="w-3.5 h-3.5" /> Select Target Hosts
            </span>
            
            <div className="space-y-4 mb-6">
                <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                    <input
                        className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all font-semibold placeholder:text-gray-400 placeholder:font-medium shadow-inner"
                        placeholder="Search infrastructure..."
                        value={searchTerm}
                        onChange={e => onSearchTermChange(e.target.value)}
                    />
                </div>
                <div className="flex gap-2">
                    <button onClick={onExpandAll} className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-[10px] font-bold uppercase tracking-wider hover:bg-gray-200 transition-colors border border-gray-200/50 shadow-sm">Expand All</button>
                    <button onClick={onCollapseAll} className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-[10px] font-bold uppercase tracking-wider hover:bg-gray-200 transition-colors border border-gray-200/50 shadow-sm">Reset</button>
                </div>
            </div>

            <div className="flex-1 space-y-2 overflow-y-auto pr-2 custom-scrollbar min-h-[400px] max-h-[600px]">
                {groups.length === 0 ? (
                    <div className="py-10 text-center text-gray-400 font-medium text-sm italic">No hosts found matching your search.</div>
                ) : groups.map((g: any) => {
                    const isExpanded = expandedGroups.includes(g.hostgroup);
                    const isGroupSelected = selectedGroups.includes(g.hostgroup);
                    const selectedInGroup = selectedHosts.filter(h => h.group === g.hostgroup).length;
                    
                    return (
                        <div key={g.hostgroup} className="border border-gray-100 rounded-2xl bg-white overflow-hidden transition-all duration-200 hover:border-blue-100">
                            <div
                                className={`flex items-center justify-between p-4 cursor-pointer transition-all ${isGroupSelected ? 'bg-blue-600 text-white shadow-lg shadow-blue-100 scale-[1.01]' : 'hover:bg-gray-50'}`}
                                onClick={() => onToggleGroup(g.hostgroup)}
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); onToggleExpand(g.hostgroup); }}
                                        className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors ${isGroupSelected ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-500 hover:bg-blue-50 hover:text-blue-600'}`}
                                    >
                                        {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                    </button>
                                    <div className="min-w-0">
                                        <span className={`text-xs font-bold truncate block ${isGroupSelected ? 'text-white' : 'text-gray-900'}`}>{g.hostgroup}</span>
                                        {selectedInGroup > 0 && !isGroupSelected && (
                                            <span className="text-[9px] font-bold text-blue-500 uppercase tracking-tighter">{selectedInGroup} of {g.hostnames.length} selected</span>
                                        )}
                                    </div>
                                </div>
                                {isGroupSelected && (
                                    <div className="bg-white/20 px-2 py-0.5 rounded-full text-[9px] font-black uppercase">All</div>
                                )}
                            </div>
                            {isExpanded && (
                                <div className="p-2 space-y-1 bg-gray-50/30 border-t border-gray-50">
                                    {g.hostnames.map((h: any) => {
                                        const isSelected = selectedHosts.some(s => s.id === String(h.hostname_id));
                                        return (
                                            <button
                                                key={h.hostname_id}
                                                onClick={(e) => { e.stopPropagation(); onToggleHostname({ id: String(h.hostname_id), name: h.hostname, group: g.hostgroup, mem: h.mem }); }}
                                                className={`w-full flex items-center justify-between gap-3 p-3 pl-10 rounded-xl text-xs font-semibold transition-all ${isSelected ? 'bg-white text-blue-700 border border-blue-100 shadow-sm' : 'text-gray-500 hover:bg-white hover:text-gray-900 hover:shadow-sm'}`}
                                            >
                                                <span className="truncate">{h.hostname}</span>
                                                {isSelected && <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>}
                                            </button>
                                        );
                                    })}
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

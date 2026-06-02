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
        <div className="relative border border-gray-100 rounded-xl p-4 pt-8 bg-white shadow-sm transition-all hover:shadow-md h-full flex flex-col">
            <span className="absolute -top-3 left-4 bg-blue-50 text-blue-700 px-3 py-1 text-[9px] font-bold capitalize tracking-[0.1em] border border-blue-100 rounded-full shadow-sm flex items-center gap-1.5">
                <Monitor className="w-3 h-3" /> Targets
            </span>
            
            <div className="space-y-2 mb-3">
                <div className="relative group">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                    <input
                        className="w-full pl-8 pr-3 py-2 bg-gray-50 border border-gray-100 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all placeholder:text-gray-400 placeholder:font-medium shadow-inner"
                        placeholder="Search..."
                        value={searchTerm}
                        onChange={e => onSearchTermChange(e.target.value)}
                    />
                </div>
                <div className="flex gap-1.5">
                    <button onClick={onExpandAll} className="flex-1 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-[9px] font-bold capitalize tracking-wider hover:bg-gray-200 transition-colors border border-gray-200/50">Expand</button>
                    <button onClick={onCollapseAll} className="flex-1 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-[9px] font-bold capitalize tracking-wider hover:bg-gray-200 transition-colors border border-gray-200/50">Reset</button>
                </div>
            </div>

            <div className="flex-1 space-y-1 overflow-y-auto pr-1 custom-scrollbar min-h-[200px] max-h-[400px]">
                {groups.length === 0 ? (
                    <div className="py-4 text-center text-gray-400 font-medium text-xs italic">No match.</div>
                ) : groups.map((g: any) => {
                    const isExpanded = expandedGroups.includes(g.hostgroup);
                    const isGroupSelected = selectedGroups.includes(g.hostgroup);
                    
                    return (
                        <div key={g.hostgroup} className="border border-gray-100 rounded-lg bg-white overflow-hidden transition-all duration-200 hover:border-blue-100">
                            <div
                                className={`flex items-center justify-between p-2 cursor-pointer transition-all ${isGroupSelected ? 'bg-blue-600 text-white' : 'hover:bg-gray-50'}`}
                                onClick={() => onToggleGroup(g.hostgroup)}
                            >
                                <div className="flex items-center gap-1.5 min-w-0">
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); onToggleExpand(g.hostgroup); }}
                                        className={`w-4 h-4 rounded flex items-center justify-center transition-colors ${isGroupSelected ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-500 hover:bg-blue-50 hover:text-blue-600'}`}
                                    >
                                        {isExpanded ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
                                    </button>
                                    <span className={`text-xs font-bold truncate ${isGroupSelected ? 'text-white' : 'text-gray-900'}`}>{g.hostgroup}</span>
                                </div>
                                {isGroupSelected && <div className="bg-white/20 px-1.5 py-0.5 rounded text-[8px] font-black capitalize">All</div>}
                            </div>
                            {isExpanded && (
                                <div className="p-0.5 space-y-0.5 bg-gray-50/30 border-t border-gray-50">
                                    {g.hostnames.map((h: any) => {
                                        const isSelected = selectedHosts.some(s => s.id === String(h.hostname_id));
                                        return (
                                            <button
                                                key={h.hostname_id}
                                                onClick={(e) => { e.stopPropagation(); onToggleHostname({ id: String(h.hostname_id), name: h.hostname, group: g.hostgroup, mem: h.mem }); }}
                                                className={`w-full flex items-center justify-between gap-1 p-2 pl-6 rounded-md text-[9px] font-semibold transition-all ${isSelected ? 'bg-white text-blue-700 border border-blue-100 shadow-sm' : 'text-gray-500 hover:bg-white hover:text-gray-900'}`}
                                            >
                                                <span className="truncate">{h.hostname}</span>
                                                {isSelected && <div className="w-1 h-1 rounded-full bg-blue-500 animate-pulse"></div>}
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

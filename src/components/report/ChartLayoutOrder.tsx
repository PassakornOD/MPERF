import React from 'react';
import { Layout, PlusCircle, GripVertical, ArrowUp, ArrowDown, X, Activity } from 'lucide-react';

interface Chart {
    id: string;
    label: string;
    enabled: boolean;
}

interface ChartLayoutOrderProps {
    availableCharts: Chart[];
    selectedCharts: Chart[];
    onToggleReport: (id: string) => void;
    onMoveChart: (id: string, direction: 'up' | 'down') => void;
}

const ChartLayoutOrder: React.FC<ChartLayoutOrderProps> = ({
    availableCharts,
    selectedCharts,
    onToggleReport,
    onMoveChart,
}) => {
    return (
        <div className="relative border border-border rounded-xl p-4 sm:p-5 pt-7 bg-card shadow-sm transition-all hover:shadow-md">
            <span className="absolute -top-3 left-4 bg-blue-50 text-blue-700 px-3 py-1 text-[9px] font-bold capitalize  border border-blue-100 rounded-full shadow-sm flex items-center gap-1.5">
                <Layout className="w-3 h-3" /> Sequence
            </span>
            <div className="flex flex-col lg:flex-row gap-4 items-stretch justify-center">
                {availableCharts.length > 0 && (
                    <div className="flex-1 border border-border rounded-xl p-3 bg-background/50 shadow-inner">
                        <p className="text-[9px] font-bold text-muted-foreground capitalize  border-b border-border pb-2 mb-3">Available</p>
                        <div className="space-y-1.5 max-h-[250px] overflow-y-auto pr-1 custom-scrollbar">
                            {availableCharts.map((report) => (
                                <button
                                    key={report.id}
                                    onClick={() => onToggleReport(report.id)}
                                    className="w-full flex items-center gap-2 p-2 bg-card rounded-xl border border-border text-xs font-semibold hover:border-blue-300 hover:text-blue-600 transition-all text-left shadow-sm group"
                                >
                                    <PlusCircle className="w-3.5 h-3.5 text-blue-400 group-hover:text-blue-600 transition-colors" />
                                    <span className="truncate">{report.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}
                <div className="flex-1 border border-blue-100 rounded-xl p-3 bg-blue-50/20 shadow-inner flex flex-col min-h-[200px]">
                    <p className="text-[9px] font-bold text-blue-600 capitalize  border-b border-blue-100 pb-2 mb-3">Sequence</p>
                    {selectedCharts.length > 0 ? (
                        <div className="space-y-1.5 max-h-[250px] overflow-y-auto pr-1 custom-scrollbar">
                            {selectedCharts.map((report, sIdx) => (
                                <div key={report.id} className="flex items-center justify-between p-2 bg-card rounded-xl border border-blue-100 shadow-sm shadow-blue-50/50 group animate-ease-in">
                                    <div className="flex items-center gap-2 text-xs font-semibold truncate text-foreground min-w-0 flex-1">
                                        <GripVertical className="w-3.5 h-3.5 text-slate-300" />
                                        <span className="truncate">{report.label}</span>
                                    </div>
                                    <div className="flex items-center gap-0 shrink-0">
                                        <button 
                                            onClick={() => onMoveChart(report.id, 'up')} 
                                            disabled={sIdx === 0} 
                                            className="p-1 hover:bg-blue-50 rounded-xl text-muted-foreground hover:text-blue-600 disabled:opacity-10 transition-colors"
                                            title="Move Up"
                                        >
                                            <ArrowUp className="w-3 h-3" />
                                        </button>
                                        <button 
                                            onClick={() => onMoveChart(report.id, 'down')} 
                                            disabled={sIdx === selectedCharts.length - 1} 
                                            className="p-1 hover:bg-blue-50 rounded-xl text-muted-foreground hover:text-blue-600 disabled:opacity-10 transition-colors"
                                            title="Move Down"
                                        >
                                            <ArrowDown className="w-3 h-3" />
                                        </button>
                                        <button 
                                            onClick={() => onToggleReport(report.id)} 
                                            className="p-1 hover:bg-red-50 text-red-400 hover:text-red-600 rounded-xl transition-colors"
                                            title="Remove"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground space-y-1 py-4">
                            <Activity className="w-6 h-6 opacity-20" />
                            <p className="text-[9px] font-bold capitalize  text-center">Empty</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ChartLayoutOrder;

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
        <div className="relative border border-gray-100 rounded-2xl p-6 sm:p-8 pt-10 bg-white shadow-sm transition-all hover:shadow-md">
            <span className="absolute -top-4 left-6 bg-blue-50 text-blue-700 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] border border-blue-100 rounded-full shadow-sm flex items-center gap-2">
                <Layout className="w-3.5 h-3.5" /> Chart Selection & Sequencing
            </span>
            <div className="flex flex-col lg:flex-row gap-6 items-stretch justify-center">
                {availableCharts.length > 0 && (
                    <div className="flex-1 border border-gray-100 rounded-2xl p-5 bg-gray-50/50 shadow-inner">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-3 mb-4">Available Metrics</p>
                        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                            {availableCharts.map((report) => (
                                <button
                                    key={report.id}
                                    onClick={() => onToggleReport(report.id)}
                                    className="w-full flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-100 text-xs font-semibold hover:border-blue-300 hover:text-blue-600 transition-all text-left shadow-sm group"
                                >
                                    <PlusCircle className="w-4 h-4 text-blue-400 group-hover:text-blue-600 transition-colors" />
                                    <span className="truncate">{report.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}
                <div className="flex-1 border border-blue-100 rounded-2xl p-5 bg-blue-50/20 shadow-inner flex flex-col min-h-[250px]">
                    <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest border-b border-blue-100 pb-3 mb-4">Report Sequence</p>
                    {selectedCharts.length > 0 ? (
                        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                            {selectedCharts.map((report, sIdx) => (
                                <div key={report.id} className="flex items-center justify-between p-3 bg-white rounded-xl border border-blue-100 shadow-md shadow-blue-50/50 group animate-ease-in">
                                    <div className="flex items-center gap-3 text-xs font-semibold truncate text-gray-800 min-w-0 flex-1">
                                        <GripVertical className="w-4 h-4 text-gray-300" />
                                        <span className="truncate">{report.label}</span>
                                    </div>
                                    <div className="flex items-center gap-0.5 shrink-0">
                                        <button 
                                            onClick={() => onMoveChart(report.id, 'up')} 
                                            disabled={sIdx === 0} 
                                            className="p-1.5 hover:bg-blue-50 rounded-lg text-gray-400 hover:text-blue-600 disabled:opacity-10 transition-colors"
                                            title="Move Up"
                                        >
                                            <ArrowUp className="w-3.5 h-3.5" />
                                        </button>
                                        <button 
                                            onClick={() => onMoveChart(report.id, 'down')} 
                                            disabled={sIdx === selectedCharts.length - 1} 
                                            className="p-1.5 hover:bg-blue-50 rounded-lg text-gray-400 hover:text-blue-600 disabled:opacity-10 transition-colors"
                                            title="Move Down"
                                        >
                                            <ArrowDown className="w-3.5 h-3.5" />
                                        </button>
                                        <button 
                                            onClick={() => onToggleReport(report.id)} 
                                            className="p-1.5 hover:bg-red-50 text-red-400 hover:text-red-600 rounded-lg transition-colors border border-transparent hover:border-red-100"
                                            title="Remove"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-gray-400 space-y-2 py-8">
                            <Activity className="w-8 h-8 opacity-20" />
                            <p className="text-[10px] font-bold uppercase tracking-widest text-center">Add charts to start sequencing</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ChartLayoutOrder;

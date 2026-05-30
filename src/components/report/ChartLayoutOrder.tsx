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
        <div className="relative border border-gray-100 rounded-3xl p-8 pt-10 bg-white shadow-sm">
            <span className="absolute -top-4 left-8 bg-white px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 border border-gray-100 rounded-full shadow-sm flex items-center gap-2">
                <Layout className="w-3.5 h-3.5" /> Chart Order & Layout
            </span>
            <div className="flex flex-row gap-8 items-start justify-center">
                {availableCharts.length > 0 && (
                    <div className="border border-gray-100 rounded-xl p-5 bg-gray-50/50 shadow-inner w-[48%]">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-200 pb-3 mb-4">Available Charts</p>
                        <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                            {availableCharts.map((report) => (
                                <button
                                    key={report.id}
                                    onClick={() => onToggleReport(report.id)}
                                    className="w-full flex items-center gap-3 p-2.5 bg-white rounded-lg border border-gray-100 text-[11px] font-bold hover:border-blue-200 transition-all text-left shadow-sm"
                                >
                                    <PlusCircle className="w-3.5 h-3.5 text-blue-600" />
                                    <span className="truncate">{report.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}
                <div className="border border-blue-100 rounded-xl p-5 bg-blue-50/20 shadow-inner w-[48%] min-h-[150px] flex flex-col">
                    <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest border-b border-blue-100 pb-3 mb-4">Selected Layout</p>
                    {selectedCharts.length > 0 ? (
                        <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                            {selectedCharts.map((report, sIdx) => (
                                <div key={report.id} className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-blue-100 shadow-sm">
                                    <div className="flex items-center gap-2 text-[11px] font-bold truncate text-gray-700">
                                        <GripVertical className="w-3.5 h-3.5 text-gray-300" />
                                        <span className="truncate">{report.label}</span>
                                    </div>
                                    <div className="flex items-center gap-0.5">
                                        <button onClick={() => onMoveChart(report.id, 'up')} disabled={sIdx === 0} className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-blue-600 disabled:opacity-20"><ArrowUp className="w-3 h-3" /></button>
                                        <button onClick={() => onMoveChart(report.id, 'down')} disabled={sIdx === selectedCharts.length - 1} className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-blue-600 disabled:opacity-20"><ArrowDown className="w-3 h-3" /></button>
                                        <button onClick={() => onToggleReport(report.id)} className="p-1 hover:bg-red-50 text-red-500 rounded"><X className="w-3 h-3" /></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-gray-400 text-xs font-bold uppercase tracking-wider h-full">
                            Please select charts to display.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ChartLayoutOrder;

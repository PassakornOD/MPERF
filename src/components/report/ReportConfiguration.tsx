import React from 'react';
import { Type, Clock, Calendar } from 'lucide-react';
import FloatingInput from '@/components/common/FloatingInput';

interface ReportConfigurationProps {
    reportTitle: string;
    onReportTitleChange: (title: string) => void;
    startDate: string;
    onStartDateChange: (date: string) => void;
    endDate: string;
    onEndDateChange: (date: string) => void;
    month: string;
    onMonthChange: (month: string) => void;
    year: string;
    onYearChange: (year: string) => void;
}

const ReportConfiguration: React.FC<ReportConfigurationProps> = ({
    reportTitle,
    onReportTitleChange,
    startDate,
    onStartDateChange,
    endDate,
    onEndDateChange,
    month,
    onMonthChange,
    year,
    onYearChange,
}) => {
    return (
        <div className="relative border border-gray-100 rounded-3xl p-8 pt-10 bg-white shadow-sm">
            <span className="absolute -top-4 left-8 bg-white px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 border border-gray-100 rounded-full shadow-sm flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5" /> Configurations
            </span>

            <div className="mb-8 space-y-4">
                <div className="flex items-center gap-3 text-blue-600 border-b border-gray-50 pb-2">
                    <Type className="w-4 h-4" />
                    <h4 className="text-[10px] font-black uppercase tracking-[0.1em]">Report Metadata</h4>
                </div>
                <FloatingInput
                    label="Report Title"
                    value={reportTitle}
                    onChange={e => onReportTitleChange(e.target.value)}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-5">
                    <div className="flex items-center gap-3 text-blue-600 border-b border-gray-50 pb-2">
                        <Clock className="w-4 h-4" />
                        <h4 className="text-[10px] font-black uppercase tracking-[0.1em]">Daily Reports Range</h4>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[9px] font-black text-gray-400 uppercase block mb-1.5 ml-1">From Date</label>
                            <input type="date" value={startDate} onChange={e => onStartDateChange(e.target.value)} className="w-full bg-white border border-gray-200 rounded-xl p-3 text-xs font-bold focus:ring-2 focus:ring-blue-500/20 outline-none transition-all shadow-sm" />
                        </div>
                        <div>
                            <label className="text-[9px] font-black text-gray-400 uppercase block mb-1.5 ml-1">To Date</label>
                            <input type="date" value={endDate} onChange={e => onEndDateChange(e.target.value)} className="w-full bg-white border border-gray-200 rounded-xl p-3 text-xs font-bold focus:ring-2 focus:ring-blue-500/20 outline-none transition-all shadow-sm" />
                        </div>
                    </div>
                </div>
                <div className="space-y-5">
                    <div className="flex items-center gap-3 text-blue-600 border-b border-gray-50 pb-2">
                        <Calendar className="w-4 h-4" />
                        <h4 className="text-[10px] font-black uppercase tracking-[0.1em]">Monthly Period</h4>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[9px] font-black text-gray-400 uppercase block mb-1.5 ml-1">Target Month</label>
                            <select value={month} onChange={e => onMonthChange(e.target.value)} className="w-full bg-white border border-gray-200 rounded-xl p-3 text-xs font-bold focus:ring-2 focus:ring-blue-500/20 outline-none transition-all shadow-sm">
                                {Array.from({ length: 12 }, (_, i) => <option key={i + 1} value={String(i + 1)}>{new Date(2000, i).toLocaleString('en-US', { month: 'long' })}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-[9px] font-black text-gray-400 uppercase block mb-1.5 ml-1">Target Year</label>
                            <input type="number" value={year} onChange={e => onYearChange(e.target.value)} className="w-full bg-white border border-gray-200 rounded-xl p-3 text-xs font-bold focus:ring-2 focus:ring-blue-500/20 outline-none transition-all shadow-sm" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReportConfiguration;

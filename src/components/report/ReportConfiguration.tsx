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
        <div className="relative border border-gray-100 rounded-xl p-4 sm:p-5 pt-7 bg-white shadow-sm transition-all hover:shadow-md">
            <span className="absolute -top-3 left-4 bg-blue-50 text-blue-700 px-3 py-1 text-[9px] font-bold capitalize tracking-[0.1em] border border-blue-100 rounded-full shadow-sm flex items-center gap-1.5">
                <Calendar className="w-3 h-3" /> Metadata
            </span>

            <div className="mb-4 space-y-2">
                <div className="flex items-center gap-2 text-blue-700 border-b border-gray-50 pb-1">
                    <Type className="w-3.5 h-3.5" />
                    <h4 className="text-[9px] font-bold capitalize tracking-wider">Branding</h4>
                </div>
                <FloatingInput
                    label="Official Report Title"
                    value={reportTitle}
                    onChange={e => onReportTitleChange(e.target.value)}
                    placeholder="Enter the title..."
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-blue-700 border-b border-gray-50 pb-1">
                        <Clock className="w-3.5 h-3.5" />
                        <h4 className="text-[9px] font-bold capitalize tracking-wider">Daily Range</h4>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-0.5">
                            <label className="text-[8px] font-bold text-gray-400 capitalize tracking-tight ml-1">Start Date</label>
                            <input type="date" value={startDate} onChange={e => onStartDateChange(e.target.value)} className="w-full bg-gray-50 border border-gray-100 rounded-lg p-2 text-xs font-semibold focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all shadow-inner" />
                        </div>
                        <div className="space-y-0.5">
                            <label className="text-[8px] font-bold text-gray-400 capitalize tracking-tight ml-1">End Date</label>
                            <input type="date" value={endDate} onChange={e => onEndDateChange(e.target.value)} className="w-full bg-gray-50 border border-gray-100 rounded-lg p-2 text-xs font-semibold focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all shadow-inner" />
                        </div>
                    </div>
                </div>
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-blue-700 border-b border-gray-50 pb-1">
                        <Calendar className="w-3.5 h-3.5" />
                        <h4 className="text-[9px] font-bold capitalize tracking-wider">Monthly Context</h4>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-0.5">
                            <label className="text-[8px] font-bold text-gray-400 capitalize tracking-tight ml-1">Target Month</label>
                            <select value={month} onChange={e => onMonthChange(e.target.value)} className="w-full bg-gray-50 border border-gray-100 rounded-lg p-2 text-xs font-semibold focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all shadow-inner">
                                {Array.from({ length: 12 }, (_, i) => <option key={i + 1} value={String(i + 1)}>{new Date(2000, i).toLocaleString('en-US', { month: 'long' })}</option>)}
                            </select>
                        </div>
                        <div className="space-y-0.5">
                            <label className="text-[8px] font-bold text-gray-400 capitalize tracking-tight ml-1">Target Year</label>
                            <input type="number" value={year} onChange={e => onYearChange(e.target.value)} className="w-full bg-gray-50 border border-gray-100 rounded-lg p-2 text-xs font-semibold focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all shadow-inner" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReportConfiguration;

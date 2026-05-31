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
        <div className="relative border border-gray-100 rounded-[2.5rem] p-8 sm:p-10 pt-12 sm:pt-14 bg-white shadow-sm transition-all hover:shadow-md">
            <span className="absolute -top-4 left-8 bg-blue-50 text-blue-700 px-5 py-2 text-[10px] font-bold uppercase tracking-[0.2em] border border-blue-100 rounded-full shadow-sm flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5" /> Report Metadata & Period
            </span>

            <div className="mb-10 space-y-5">
                <div className="flex items-center gap-3 text-blue-700 border-b border-gray-50 pb-3">
                    <Type className="w-5 h-5" />
                    <h4 className="text-xs font-bold uppercase tracking-wider">Document Branding</h4>
                </div>
                <FloatingInput
                    label="Official Report Title"
                    value={reportTitle}
                    onChange={e => onReportTitleChange(e.target.value)}
                    placeholder="Enter the title that will appear on the PDF cover..."
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="space-y-6">
                    <div className="flex items-center gap-3 text-blue-700 border-b border-gray-50 pb-3">
                        <Clock className="w-5 h-5" />
                        <h4 className="text-xs font-bold uppercase tracking-wider">Daily Range</h4>
                    </div>
                    <div className="grid grid-cols-2 gap-5">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight ml-1">Start Date</label>
                            <input type="date" value={startDate} onChange={e => onStartDateChange(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 text-sm font-semibold focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all shadow-inner" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight ml-1">End Date</label>
                            <input type="date" value={endDate} onChange={e => onEndDateChange(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 text-sm font-semibold focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all shadow-inner" />
                        </div>
                    </div>
                </div>
                <div className="space-y-6">
                    <div className="flex items-center gap-3 text-blue-700 border-b border-gray-50 pb-3">
                        <Calendar className="w-5 h-5" />
                        <h4 className="text-xs font-bold uppercase tracking-wider">Monthly Context</h4>
                    </div>
                    <div className="grid grid-cols-2 gap-5">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight ml-1">Target Month</label>
                            <select value={month} onChange={e => onMonthChange(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 text-sm font-semibold focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all shadow-inner">
                                {Array.from({ length: 12 }, (_, i) => <option key={i + 1} value={String(i + 1)}>{new Date(2000, i).toLocaleString('en-US', { month: 'long' })}</option>)}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight ml-1">Target Year</label>
                            <input type="number" value={year} onChange={e => onYearChange(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 text-sm font-semibold focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all shadow-inner" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReportConfiguration;

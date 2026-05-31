
import React from 'react';

interface BlockProps {
  title: string;
  subtitle?: string;
  tabs?: string[];
  children: React.ReactNode;
}

const Block: React.FC<BlockProps> = ({ title, subtitle, tabs, children }) => {
  return (
    <div className="bg-white border border-gray-100 rounded-3xl shadow-sm overflow-hidden mb-8 transition-all duration-300 hover:shadow-md">
      <div className="bg-white border-b border-gray-50 px-6 py-5 sm:px-8 sm:py-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">
            {title}
          </h2>
          {subtitle && (
            <p className="text-sm font-medium text-gray-400">
              {subtitle}
            </p>
          )}
        </div>
        {tabs && (
          <ul className="flex overflow-x-auto pb-1 sm:pb-0 gap-2 w-full sm:w-auto scrollbar-hide">
            {tabs.map((tab) => (
              <li key={tab} className="whitespace-nowrap px-4 py-2 rounded-xl text-sm font-bold bg-blue-50 text-blue-700 border border-blue-100">
                {tab}
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="p-6 sm:p-8">
        {children}
      </div>
    </div>
  );
};

export default Block;

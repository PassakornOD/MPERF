
import React from 'react';

interface BlockProps {
  title: string;
  subtitle?: string;
  tabs?: string[];
  children: React.ReactNode;
}

const Block: React.FC<BlockProps> = ({ title, subtitle, tabs, children }) => {
  return (
    <div className="bg-white border border-gray-200 rounded-md shadow-sm overflow-hidden mb-6">
      <div className="bg-gray-50 border-b border-gray-200 px-6 py-4 flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-800">
          {title} {subtitle && <span className="text-gray-400 font-normal">:: {subtitle}</span>}
        </h2>
        {tabs && (
          <ul className="flex space-x-4">
            {tabs.map((tab) => (
              <li key={tab} className="text-sm font-medium text-blue-600 border-b-2 border-blue-600 pb-1">
                {tab}
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="p-6">
        {children}
      </div>
    </div>
  );
};

export default Block;

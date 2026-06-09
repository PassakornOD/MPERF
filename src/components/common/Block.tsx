
import React from 'react';

interface BlockProps {
  title: string;
  subtitle?: string;
  tabs?: string[];
  children: React.ReactNode;
}

const Block: React.FC<BlockProps> = ({ title, subtitle, tabs, children }) => {
  return (
    <div className="modern-card overflow-hidden mb-12">
      <div className="bg-background/30 border-b border-slate-50 px-6 py-6 sm:px-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1">
          <h2 className="text-2xl  text-foreground capitalize tracking-tight leading-tight">
            {title}
          </h2>
          {subtitle && (
            <p className="text-xs text-muted-foreground capitalize ">
              {subtitle}
            </p>
          )}
        </div>
        {tabs && (
          <ul className="flex overflow-x-auto pb-1 sm:pb-0 gap-2 w-full sm:w-auto scrollbar-hide">
            {tabs.map((tab) => (
              <li key={tab} className="whitespace-nowrap px-4 py-2 rounded-xl text-xs font-bold bg-card text-blue-600 border border-blue-50 shadow-sm shadow-blue-500/5 transition-all hover:bg-blue-50 cursor-default">
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

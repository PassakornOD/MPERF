import React from 'react';

interface ProgressBarProps {
  isVisible: boolean;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ isVisible }) => {
  if (!isVisible) return null;

  return (
    <div className="absolute top-0 left-0 w-full h-1 z-50 overflow-hidden bg-blue-100">
      <div className="h-full bg-blue-600 animate-indeterminate-bar w-[30%] origin-left-right" />
    </div>
  );
};

export default ProgressBar;

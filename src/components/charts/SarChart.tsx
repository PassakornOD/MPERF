
'use client';

import React, { useEffect, useRef, useState } from 'react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';

// Initialize Highcharts modules
if (typeof window !== 'undefined' && typeof Highcharts === 'object') {
  try {
    const exporting = require('highcharts/modules/exporting');
    if (typeof exporting === 'function') {
      exporting(Highcharts);
    }
  } catch (e) {
    console.error('Failed to load Highcharts exporting module', e);
  }
}

// Global legacy styling from sar4
Highcharts.setOptions({
  credits: { enabled: false },
  chart: {
    shadow: false,
    backgroundColor: undefined, // Transparent like legacy
  },
  tooltip: {
    enabled: true,
  },
  plotOptions: {
    area: {
      stacking: 'percent',
      lineColor: '#000000',
      lineWidth: 0.1,
      shadow: false,
      marker: { enabled: false }
    },
    line: {
      marker: { enabled: false }
    }
  }
});

interface SarChartProps {
  options: Highcharts.Options;
}

const SarChart: React.FC<SarChartProps> = ({ options }) => {
  const [isClient, setIsClient] = useState(false);
  const chartComponentRef = useRef<HighchartsReact.RefObject>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return <div className="w-full h-[435px] bg-gray-50 animate-pulse flex items-center justify-center border border-gray-100 rounded text-gray-400">Loading Chart Components...</div>;
  }

  // Inject the instance into a data attribute or global context for PDF export access
  return (
    <div className="w-full h-[435px]" data-chart-ref={options.chart?.renderTo}>
      <HighchartsReact
        highcharts={Highcharts}
        options={options}
        ref={chartComponentRef}
      />
    </div>
  );
};

export default SarChart;

'use client';

import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import { useTheme } from 'next-themes';

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

interface SarChartProps {
  options: Highcharts.Options;
}

const SarChart = forwardRef(({ options }: SarChartProps, ref) => {
  const [isClient, setIsClient] = useState(false);
  const chartComponentRef = useRef<HighchartsReact.RefObject>(null);
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  useImperativeHandle(ref, () => ({
    getSVG: () => {
      return (chartComponentRef.current?.chart as any)?.getSVG();
    }
  }));

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient) {
      const textColor = isDark ? '#f8fafc' : '#1e293b';
      const gridLineColor = isDark ? '#334155' : '#e2e8f0';

      Highcharts.setOptions({
        accessibility: { enabled: false },
        credits: { enabled: false },
        chart: {
          shadow: false,
          backgroundColor: 'transparent',
          style: {
            fontFamily: "var(--font-inter), ui-sans-serif, system-ui, sans-serif"
          }
        },
        title: {
          style: { color: textColor }
        },
        subtitle: {
          style: { color: isDark ? '#94a3b8' : '#64748b' }
        },
        xAxis: {
          gridLineColor: gridLineColor,
          lineColor: gridLineColor,
          tickColor: gridLineColor,
          labels: { style: { color: textColor } }
        },
        yAxis: {
          gridLineColor: gridLineColor,
          lineColor: gridLineColor,
          tickColor: gridLineColor,
          labels: { style: { color: textColor } },
          title: { style: { color: textColor } }
        },
        legend: {
          itemStyle: { color: textColor },
          itemHoverStyle: { color: isDark ? '#ffffff' : '#000000' }
        },
        tooltip: {
          enabled: true,
          backgroundColor: isDark ? '#1e293b' : '#ffffff',
          style: { color: textColor },
          borderColor: gridLineColor
        },
        plotOptions: {
          area: {
            lineColor: isDark ? '#ffffff' : '#000000',
            lineWidth: 0.1,
            shadow: false,
            marker: { enabled: false }
          },
          line: {
            marker: { enabled: false }
          }
        }
      });
    }
  }, [isDark, isClient]);

  if (!isClient) {
    return <div data-testid="highcharts-mock" className="w-full h-[435px] bg-background animate-pulse flex items-center justify-center border border-border rounded text-muted-foreground">Loading Chart Components...</div>;
  }

  // Inject theme-specific colors into current options to ensure they override defaults immediately
  const themedOptions = {
    ...options,
    chart: {
      ...options.chart,
      backgroundColor: 'transparent',
    }
  };

  return (
    <div className="w-full h-[435px]" data-testid="sar-chart-container">
        <HighchartsReact
            highcharts={Highcharts}
            options={themedOptions}
            ref={chartComponentRef}
        />
    </div>
  );
});

SarChart.displayName = 'SarChart';
export default SarChart;

import Highcharts from 'highcharts';

export const getChartOptions = (metrics: any[], report: any, hostname: string, totalMem: number, startDate: string, endDate: string, targetMonth: string, targetYear: string, totalAvg?: number): any => {
  if (!metrics || metrics.length === 0) return { title: { text: 'No Data Found' } };

  const isMonthly = report.type.includes('monthly');
  const type = report.mode;
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const mMonthLabel = monthNames[parseInt(targetMonth) - 1] || targetMonth;

  const baseOptions = {
    chart: { backgroundColor: '#ffffff', shadow: false },
    title: { style: { fontSize: '14px', fontWeight: 'bold' } },
    subtitle: { style: { fontSize: '12px' } },
    legend: { itemStyle: { fontSize: '8px' } },
    credits: { enabled: false },
    xAxis: { labels: { rotation: -45, align: 'right', style: { fontSize: '8px' } } }
  };

  if (isMonthly) {
    const timeLabels = Array.from(new Set(metrics.map((m: any) => m.time_label))).sort();
    const daySeriesMap: Record<number, any[]> = {};
    metrics.forEach((m: any) => {
      if (!daySeriesMap[m.day]) daySeriesMap[m.day] = new Array(timeLabels.length).fill(null);
      const idx = timeLabels.indexOf(m.time_label);
      if (idx !== -1) {
        const rawVal = Number(m.val !== undefined ? m.val : m.mem);
        daySeriesMap[m.day][idx] = report.type.includes('cpu') ? (100 - rawVal) : rawVal;
      }
    });

    const series = Object.keys(daySeriesMap).sort((a, b) => Number(a) - Number(b)).map(day => ({
      name: `${day}`,
      data: daySeriesMap[Number(day)],
      type: 'line'
    }));

    return {
      ...baseOptions,
      chart: { ...baseOptions.chart, type: 'line' },
      title: { text: `${report.type.includes('cpu') ? 'CPU' : 'Memory'} Monthly Usage` },
      subtitle: { text: `Hostname : ${hostname} Month : ${mMonthLabel}/${targetYear}` },
      xAxis: { ...baseOptions.xAxis, categories: timeLabels, tickInterval: 5 },
      yAxis: {
        title: {
          text: report.type.includes('cpu') ? 'Percent' : `Memory (${totalMem || '?'} GB)`,
          style: { fontSize: '10px' }
        },
        min: 0,
        max: report.type.includes('cpu') ? 100 : (totalMem || undefined),
        maxPadding: report.type.includes('mem') ? 0.2 : undefined,
        endOnTick: report.type.includes('mem') ? false : undefined,
        labels: {
          style: { fontSize: '8px' },
          formatter: function (this: Highcharts.AxisLabelsFormatterContextObject) {
            if (report.type.includes('mem')) {
              const val = this.value as number;
              const percent = (totalMem && totalMem > 0) ? ((val / totalMem) * 100).toFixed(1) : 0;
              return `${val} GB (${percent}%)`;
            }
            return String(this.value);
          }
        }
      },
      legend: {
        itemStyle: { fontSize: '8px' },
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 8,
        padding: 10,
        margin: 15
      },
      plotOptions: { line: { lineWidth: 1, marker: { enabled: false } } },
      series
    };

  }

  const isMultiDay = startDate !== endDate || type === 'Average' || type === 'Peak';
  const categories = metrics.map((m: any) => {
    if (!m.time) return '';
    const d = new Date(m.time);
    if (!isNaN(d.getTime())) {
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      if (type === 'Average' || type === 'Peak') return dateStr;
      const timeStr = String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0') + ':' + String(d.getSeconds()).padStart(2, '0');
      if (isMultiDay) return `${dateStr} ${timeStr}`;
      return timeStr;
    }
    return String(m.time);
  });

  let series: any[] = [];
  let stacking: string | undefined = undefined;

  const COLORS: Record<string, string> = {
    idle: '#4572A7', wio: '#FFFF99', nice: '#89A54E', steal: '#AA4643', usr: '#FFCC00', sys: '#00FF00',
    memUsage: '#AA4643', memPeak: '#92A8CD', memAvg: '#AA4643'
  };

  if (report.type === 'cpu-daily') {
    if (type === 'Peak') {
      series = [
        { name: '%peak', data: metrics.map((m: any) => 100 - (Number(m.idle) || 0)), color: COLORS.steal, type: 'spline', lineWidth: 2 },
        { name: '%avg', data: metrics.map((m: any) => Number(m.usr) || 0), color: COLORS.memPeak, type: 'area', lineWidth: 1 }
      ];
    } else {
      stacking = 'percent';
      // Dynamically build series based on keys present in first metric
      const first = metrics[0] || {};
      const map = [
        { key: 'idle', name: '%idle', color: COLORS.idle },
        { key: 'wio', name: '%wio', color: COLORS.wio },
        { key: 'nice', name: '%nice', color: COLORS.nice },
        { key: 'steal', name: '%steal', color: COLORS.steal },
        { key: 'usr', name: '%usr', color: COLORS.usr },
        { key: 'sys', name: '%sys', color: COLORS.sys }
      ];
      series = map.filter(m => first.hasOwnProperty(m.key)).map(m => ({
        name: m.name,
        data: metrics.map((data: any) => Number(data[m.key] || 0)),
        color: m.color,
        type: 'area'
      }));
    }
  } else {
    // Memory Daily
    if (type === 'Normal') {
      series = [{ name: 'mem usage', data: metrics.map((m: any) => Number(m.mem) || 0), color: COLORS.memUsage, type: 'area' }];
    } else {
      series = [
        { name: 'mem peak', data: metrics.map((m: any) => Number(m.mem) || 0), color: COLORS.memPeak, type: 'spline' },
        { name: 'mem avg', data: metrics.map((m: any) => Number(m.avg_mem) || 0), color: COLORS.memAvg, type: 'area' }
      ];
    }
  }

  const options: any = {
    ...baseOptions,
    title: { text: `Sar ${startDate} To ${endDate}` },
    subtitle: { text: `Hostname : ${hostname} Type : ${type}` },
    xAxis: {
      ...baseOptions.xAxis,
      categories,
      tickInterval: (type === 'Peak' || type === 'Average') ? 1 : undefined,
      labels: {
        ...baseOptions.xAxis.labels,
        step: (type === 'Peak' || type === 'Average') ? 1 : undefined
      }
    },
    yAxis: {
      title: {
        text: report.type.includes('cpu') ? 'Percent' : `Memory (${totalMem || '?'} GB)`,
        style: { fontSize: '10px' }
      },
      min: 0,
      max: report.type.includes('cpu') ? 100 : (totalMem || undefined),
      maxPadding: report.type.includes('mem') ? 0.2 : 0,
      endOnTick: report.type.includes('mem') ? false : true,
      labels: {
        style: { fontSize: '8px' },
        formatter: function (this: Highcharts.AxisLabelsFormatterContextObject) {
          if (report.type.includes('mem')) {
            const val = this.value as number;
            const percent = (totalMem && totalMem > 0) ? ((val / totalMem) * 100).toFixed(1) : 0;
            return `${val} GB (${percent}%)`;
          }
          return String(this.value);
        }
      }
    },
    series,
    legend: {
      itemStyle: { fontSize: '8px' },
      borderWidth: 1,
      borderColor: '#e5e7eb',
      borderRadius: 8,
      padding: 10,
      margin: 15
    },
    plotOptions: {
      area: {
        stacking,
        lineColor: '#000000',
        lineWidth: type === 'Normal' ? 0.5 : 0.1,
        marker: { enabled: false }
      },
      spline: { marker: { enabled: true, radius: 2 } }
    }
  };
  if (report.type.includes('mem') && type === 'Normal' && totalAvg !== undefined) {
    const avgPercent = (totalMem && totalMem > 0) ? ((totalAvg / totalMem) * 100).toFixed(1) : 0;
    options.yAxis.plotLines = [{
      value: totalAvg,
      color: '#CC0000',
      dashStyle: 'Dash',
      width: 0,
      label: {
        text: `AVG Memory Usage = ${totalAvg.toFixed(2)} GB = ${avgPercent}%`,
        align: 'right',
        textAlign: 'right',
        y: -30,
        style: { color: '#CC0000', fontSize: '8px' },

      }
    }];
  }

  return options;
};

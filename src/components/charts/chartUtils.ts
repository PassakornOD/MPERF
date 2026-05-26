export const getChartOptions = (metrics: any[], report: any, hostname: string, totalMem: number, startDate: string, endDate: string, targetMonth: string, targetYear: string, totalAvg?: number): any => {
  if (!metrics || metrics.length === 0) return { title: { text: 'No Data Found' } };
  const isMonthly = report.type.includes('monthly');
  const type = report.mode;
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const mMonthLabel = monthNames[parseInt(targetMonth) - 1] || targetMonth;

  if (isMonthly) {
    const categoriesSet = new Set<string>();
    metrics.forEach((m: any) => { if (m.time_label) categoriesSet.add(String(m.time_label)); });
    const categories: string[] = Array.from(categoriesSet).sort();
    const daySeriesMap: Record<number, Record<string, number>> = {};
    metrics.forEach((m: any) => {
      if (!m.day || !m.time_label) return;
      if (!daySeriesMap[m.day]) daySeriesMap[m.day] = {};
      const rawVal = m.val !== undefined ? m.val : m.mem;
      const numericVal = Number(rawVal);
      const val = report.type.includes('cpu') ? (isNaN(numericVal) ? null : 100 - numericVal) : (isNaN(numericVal) ? null : numericVal);
      daySeriesMap[m.day][String(m.time_label)] = val as number;
    });
    const series = Object.keys(daySeriesMap).sort((a,b) => Number(a)-Number(b)).map(day => ({
        name: String(day),
        data: categories.map((cat: string) => daySeriesMap[Number(day)][cat] ?? null),
        type: 'line' as const,
        lineWidth: 1
    }));
    return {
      chart: { type: 'line', backgroundColor: '#ffffff', shadow: false },
      title: { text: `${report.type.includes('cpu') ? 'CPU' : 'Memory'} Monthly Usage`, style: { fontSize: '14px', fontWeight: 'bold' } },
      subtitle: { text: `Hostname : ${hostname} Month : ${mMonthLabel}/${targetYear}`, style: { fontSize: '12px' } },
      xAxis: { 
        categories, 
        tickInterval: 10, 
        labels: { rotation: -45, align: 'right', style: { fontSize: '8px' } } 
      },
      yAxis: { title: { text: report.type.includes('cpu') ? 'Percent' : `Memory (${totalMem || '?'} GB)` }, min: 0, max: report.type.includes('cpu') ? 100 : (totalMem || undefined), labels: { style: { fontSize: '8px' } } },
      series, 
      plotOptions: { line: { marker: { enabled: false } } }, 
      credits: { enabled: false },
      legend: { itemStyle: { fontSize: '8px' } }
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

  const tickInterval = type === 'Normal' ? Math.max(1, Math.floor(metrics.length / 20)) : 1;
  let series: any[] = [];
  if (report.type === 'cpu-daily') {
    if (type === 'Peak') {
        series = [
            { name: '%peak', data: metrics.map((m: any) => 100 - (Number(m.idle) || 0)), color: "#AA4643", type: 'spline', lineWidth: 2 },
            { name: '%avg', data: metrics.map((m: any) => Number(m.usr) || 0), color: '#92A8CD', type: 'area', lineWidth: 1 }
        ];
    } else {
        // Classic SAR order: usr, sys, wio, idle (stacked to 100%)
        series = [
            { name: '%idle', data: metrics.map((m: any) => Number(m.idle) || 0), color: '#4572A7', type: 'area' },
            { name: '%usr', data: metrics.map((m: any) => Number(m.usr) || 0), color: '#FFCC00', type: 'area' },
            { name: '%sys', data: metrics.map((m: any) => Number(m.sys) || 0), color: '#00FF00', type: 'area' },
            { name: '%wio', data: metrics.map((m: any) => Number(m.wio) || 0), color: '#FFFF99', type: 'area' }
        ];
    }
  } else {
    if (type === 'Normal') {
        series = [{ name: 'mem usage', data: metrics.map((m: any) => Number(m.mem) || 0), color: '#AA4643', type: 'area' }];
    } else {
        series = [
            { name: 'mem peak', data: metrics.map((m: any) => Number(m.mem) || 0), color: "#92A8CD", type: 'spline' },
            { name: 'mem avg', data: metrics.map((m: any) => Number(m.avg_mem) || 0), color: "#AA4643", type: 'area' }
        ];
    }
  }

  return {
    chart: { type: 'area', backgroundColor: '#ffffff', shadow: false },
    title: { text: `Sar ${startDate} To ${endDate}`, style: { fontSize: '14px', fontWeight: 'bold' } },
    subtitle: { text: `Hostname : ${hostname} Type : ${type}`, style: { fontSize: '12px' } },
    xAxis: { categories, tickInterval, labels: { rotation: -45, align: 'right', style: { fontSize: '8px' } } },
    yAxis: { 
        title: { text: report.type.includes('cpu') ? 'Percent' : `Memory (${totalMem || '?'} GB)` }, 
        min: 0, 
        max: report.type.includes('cpu') ? 100 : (totalMem || undefined), 
        labels: { style: { fontSize: '8px' } } 
    },
    series, 
    plotOptions: { 
        area: { 
            stacking: (report.type.includes('cpu') && type !== 'Peak') ? 'percent' : undefined, 
            lineColor: '#000000',
            lineWidth: type === 'Normal' ? 0.5 : 0.1,
            marker: { enabled: false } 
        },
        spline: { marker: { enabled: true, radius: 2 } }
    }, 
    credits: { enabled: false },
    legend: { itemStyle: { fontSize: '8px' } }
  };
};

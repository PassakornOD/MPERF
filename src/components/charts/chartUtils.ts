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
        name: report.type.includes('cpu') ? String(day) : `Day ${day}`,
        data: categories.map((cat: string) => daySeriesMap[Number(day)][cat] ?? null),
        type: 'line' as const
    }));
    return {
      chart: { type: 'line', backgroundColor: '#ffffff' },
      title: { text: `${report.type.includes('cpu') ? 'CPU' : 'Memory'} Monthly Usage`, style: { fontSize: '14px', fontWeight: 'bold' } },
      subtitle: { text: `Hostname : ${hostname} Month : ${mMonthLabel}/${targetYear}`, style: { fontSize: '12px' } },
      xAxis: { categories, tickInterval: Math.max(1, Math.floor(categories.length / 10)), labels: { rotation: -45, align: 'right', style: { fontSize: '8px' } } },
      yAxis: { title: { text: report.type.includes('cpu') ? 'Percent' : `Memory (${totalMem || '?'} GB)` }, min: 0, max: report.type.includes('cpu') ? 100 : (totalMem || undefined), labels: { style: { fontSize: '8px' } } },
      series, 
      plotOptions: { line: { lineWidth: 1, marker: { enabled: false } } }, 
      credits: { enabled: false },
      legend: { itemStyle: { fontSize: '8px' } }
    };
  }

  const categories = metrics.map((m: any) => {
    if (!m.time) return 'N/A';
    if (type === 'Average' || type === 'Peak') return String(m.time).split('T')[0];
    const d = new Date(m.time);
    return isNaN(d.getTime()) ? String(m.time) : String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
  });
  const tickInterval = Math.max(1, Math.floor(metrics.length / 15));
  let series: any[] = [];
  if (report.type === 'cpu-daily') {
    if (type === 'Peak') series = [{ name: '%peak', data: metrics.map((m: any) => 100 - (Number(m.idle) || 0)), color: "#AA4643", type: 'spline' }, { name: '%avg', data: metrics.map((m: any) => Number(m.usr) || 0), color: '#92A8CD' }];
    else series = [{ name: '%idle', data: metrics.map((m: any) => Number(m.idle) || 0) }, { name: '%usr', data: metrics.map((m: any) => Number(m.usr) || 0), color: '#FFCC00' }, { name: '%sys', data: metrics.map((m: any) => Number(m.sys) || 0), color: '#00FF00' }];
  } else {
    if (type === 'Normal') series = [{ name: 'mem usage', data: metrics.map((m: any) => Number(m.mem) || 0), color: '#AA4643' }];
    else series = [{ name: 'mem peak', data: metrics.map((m: any) => Number(m.mem) || 0), color: "#92A8CD", type: 'spline' }, { name: 'mem avg', data: metrics.map((m: any) => Number(m.avg_mem) || 0), color: "#AA4643", type: 'area' }];
  }
  return {
    chart: { type: 'area', backgroundColor: '#ffffff' },
    title: { text: `Sar ${startDate} To ${endDate}`, style: { fontSize: '14px', fontWeight: 'bold' } },
    subtitle: { text: `Hostname : ${hostname} Type : ${type}`, style: { fontSize: '12px' } },
    xAxis: { categories, tickInterval, labels: { rotation: -45, align: 'right', style: { fontSize: '8px' } } },
    yAxis: { title: { text: report.type.includes('cpu') ? 'Percent' : `Memory (${totalMem || '?'} GB)` }, min: 0, max: report.type.includes('cpu') ? 100 : (totalMem || undefined), labels: { style: { fontSize: '8px' } } },
    series, 
    plotOptions: { area: { stacking: (report.type.includes('cpu') && type !== 'Peak') ? 'percent' : undefined, marker: { enabled: false } } }, 
    credits: { enabled: false },
    legend: { itemStyle: { fontSize: '8px' } }
  };
};

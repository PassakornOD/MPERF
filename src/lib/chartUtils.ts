import Highcharts from 'highcharts';

export const getCpuDailyChartOptions = (
    metrics: any[], 
    type: 'Peak' | 'Normal' | 'Average', 
    startDate: string, 
    endDate: string, 
    hostnameLabel: string, 
    hasNice: boolean
): Highcharts.Options => {
    if (!metrics || metrics.length === 0) return { title: { text: 'No Data Found' } };

    let xAxis: Highcharts.XAxisOptions = {
        labels: { rotation: -45, align: 'right', style: { font: 'normal 10px Verdana, sans-serif' } }
    };
    
    let series: any[] = [];

    if (type === 'Peak' || type === 'Average') {
        xAxis.type = 'datetime';
        xAxis.dateTimeLabelFormats = { day: '%Y-%m-%d' };
        xAxis.tickInterval = 24 * 3600 * 1000;
        
        if (type === 'Peak') {
            series = [
                { name: '%peak', data: metrics.map((m: any) => [new Date(m.time).getTime(), 100 - (Number(m.idle) || 0)]), color: "#AA4643", type: 'spline', lineWidth: 2 },
                { name: '%avg', data: metrics.map((m: any) => [new Date(m.time).getTime(), Number(m.usr) || 0]), color: '#92A8CD', type: 'area', lineWidth: 1 }
            ];
        } else {
            series = [
                { name: '%avg', data: metrics.map((m: any) => [new Date(m.time).getTime(), Number(m.usr) || 0]), color: '#92A8CD', type: 'area', lineWidth: 1 }
            ];
        }
    } else {
        xAxis.categories = metrics.map((m: any) => {
            const d = new Date(m.time);
            return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`;
        });
        xAxis.tickInterval = Math.max(1, Math.floor(metrics.length / 20));
        
        if (hasNice) {
            series = [
                { name: '%idle', data: metrics.map((m: any) => Number(m.idle) || 0), type: 'area', color: '#4572A7' },
                { name: '%wio', data: metrics.map((m: any) => Number(m.wio) || 0), type: 'area', color: '#FFFF99' },
                { name: '%nice', data: metrics.map((m: any) => Number(m.nice) || 0), type: 'area', color: '#89A54E' },
                { name: '%steal', data: metrics.map((m: any) => Number(m.steal) || 0), type: 'area', color: '#AA4643' },
                { name: '%usr', data: metrics.map((m: any) => Number(m.usr) || 0), type: 'area', color: '#FFCC00' },
                { name: '%sys', data: metrics.map((m: any) => Number(m.sys) || 0), type: 'area', color: '#00FF00' }
            ];
        } else {
            series = [
                { name: '%idle', data: metrics.map((m: any) => Number(m.idle) || 0), type: 'area', color: '#4572A7' },
                { name: '%usr', data: metrics.map((m: any) => Number(m.usr) || 0), type: 'area', color: '#FFCC00' },
                { name: '%sys', data: metrics.map((m: any) => Number(m.sys) || 0), type: 'area', color: '#00FF00' },
                { name: '%wio', data: metrics.map((m: any) => Number(m.wio) || 0), type: 'area', color: '#FFFF99' }
            ];
        }
    }

    return {
      chart: { type: type === 'Peak' ? 'spline' : 'area', shadow: false, backgroundColor: undefined },
      title: { text: `Sar ${startDate} To ${endDate}` },
      subtitle: { text: `Hostname : ${hostnameLabel} Type : ${type}` },
      legend: {
        itemStyle: { fontSize: '10px' },
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 8,
        padding: 10,
        margin: 15
      },
      tooltip: {
        shared: true,
        backgroundColor: '#ffffff',
        borderColor: '#e5e7eb',
        borderRadius: 8
      },
      xAxis,
      yAxis: { title: { text: 'Percent' }, min: 0, max: 100 },
      plotOptions: { 
        area: { 
          lineColor: '#000000', 
          lineWidth: type === 'Normal' ? 0.5 : 0.1, 
          marker: { enabled: false },
          stacking: (type === 'Normal' || type === 'Average') ? 'percent' : undefined
        },
        spline: {
          marker: { enabled: true }
        }
      },
      series
    };
};

export const getMemDailyChartOptions = (
    metrics: any[],
    type: 'Peak' | 'Normal',
    startDate: string,
    endDate: string,
    hostnameLabel: string,
    totalMem: number,
    totalAvg: number
): Highcharts.Options => {
    if (!metrics || metrics.length === 0) return { title: { text: 'No Data Found' } };

    let xAxis: Highcharts.XAxisOptions = {
        labels: { rotation: -45, align: 'right', style: { font: 'normal 10px Verdana, sans-serif' } }
    };
    let series: any[] = [];

    if (type === 'Peak') {
        xAxis.type = 'datetime';
        xAxis.dateTimeLabelFormats = { day: '%Y-%m-%d' };
        series = [
            { name: 'mem peak', data: metrics.map((m: any) => [new Date(m.time).getTime(), m.mem || 0]), color: "#92A8CD", type: 'spline' },
            { name: 'mem avg', data: metrics.map((m: any) => [new Date(m.time).getTime(), m.avg_mem || 0]), color: "#AA4643", type: 'area' }
        ];
    } else {
        xAxis.categories = metrics.map((m: any) => {
            const d = new Date(m.time);
            return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`;
        });
        xAxis.tickInterval = Math.max(1, Math.floor(metrics.length / 20));
        series = [{
            name: 'mem usage',
            data: metrics.map((m: any) => Number(m.mem) || 0),
            color: "#AA4643",
            type: 'area'
        }];
    }

    return {
      chart: { shadow: false, backgroundColor: undefined },
      title: { text: `Sar ${startDate} To ${endDate}` },
      subtitle: { text: `Hostname : ${hostnameLabel} Type : ${type}` },
      legend: {
        itemStyle: { fontSize: '10px' },
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 8,
        padding: 10,
        margin: 15
      },
      tooltip: {
        shared: true,
        backgroundColor: '#ffffff',
        borderColor: '#e5e7eb',
        borderRadius: 8,
        formatter: function () {
            const val = (this as any).y as number;
            const percent = ((val / totalMem) * 100).toFixed(1);
            return `<b>${this.x}</b><br/>${this.series.name}: ${val} GB (${percent}%)`;
        }
      },
      xAxis,
      yAxis: {
        title: { text: `Memory (${totalMem} GB)` },
        min: 0,
        max: totalMem,
        labels: {
          formatter: function () {
            const val = (this as any).value as number;
            const percent = ((val / totalMem) * 100).toFixed(1);
            return `${val} GB (${percent}%)`;
          }
        }
      },
      plotOptions: {
        area: {
          lineColor: '#000000',
          lineWidth: 0.5,
          marker: { enabled: false }
        },
        spline: { marker: { enabled: true } }
      },
      series
    };
};

export const getMemMonthlyChartOptions = (
    metrics: any[],
    month: string,
    year: string,
    hostnameLabel: string,
    totalMem: number
): Highcharts.Options => {
    if (!metrics || metrics.length === 0) return { title: { text: 'No Data Found' } };

    const categoriesSet = new Set<string>();
    metrics.forEach((m: any) => {
        if (m.time_label) categoriesSet.add(String(m.time_label));
    });
    const categories: string[] = Array.from(categoriesSet).sort();

    const daySeriesMap: Record<number, Record<string, number>> = {};
    metrics.forEach((m: any) => {
      if (!daySeriesMap[m.day]) daySeriesMap[m.day] = {};
      daySeriesMap[m.day][String(m.time_label)] = m.mem || 0;
    });

    const series = Object.keys(daySeriesMap).sort((a,b) => Number(a)-Number(b)).map(day => {
        const dayNum = Number(day);
        return {
            name: String(day),
            data: categories.map((cat: string) => daySeriesMap[dayNum][cat] ?? null),
            type: 'line' as const
        };
    });

    return {
      chart: { shadow: false, backgroundColor: undefined },
      title: { text: 'Memory Monthly Usage' },
      subtitle: { text: `Hostname : ${hostnameLabel} Month : ${month}/${year}` },
      legend: {
        itemStyle: { fontSize: '10px' },
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 8,
        padding: 10,
        margin: 15
      },
      tooltip: {
        shared: true,
        backgroundColor: '#ffffff',
        borderColor: '#e5e7eb',
        borderRadius: 8,
        formatter: function () {
            const val = (this as any).y as number;
            const percent = ((val / totalMem) * 100).toFixed(1);
            return `<b>Day ${this.series.name}</b><br/>${this.x}: ${val} GB (${percent}%)`;
        }
      },
      xAxis: { 
        categories,
        labels: { 
            rotation: -45, 
            align: 'right',
            style: { font: 'normal 10px Verdana, sans-serif' }
        }
      },
      yAxis: { 
        title: { text: `Memory (${totalMem} GB)` }, 
        min: 0, 
        max: totalMem,
        labels: {
            formatter: function () {
                const val = (this as any).value as number;
                const percent = ((val / totalMem) * 100).toFixed(1);
                return `${val} GB (${percent}%)`;
            }
        }
      },
      plotOptions: {
          line: {
              lineWidth: 1,
              marker: { enabled: false }
          }
      },
      series
    };
};

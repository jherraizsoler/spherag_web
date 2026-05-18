function palette(name) {
  const colors = ['#0f766e', '#d97706', '#334155', '#8b5cf6', '#0891b2', '#dc2626', '#65a30d', '#4f46e5', '#b45309', '#0ea5e9'];
  const idx = Math.abs(Array.from(name).reduce((a, c) => a + c.charCodeAt(0), 0)) % colors.length;
  return colors[idx];
}

const d = window.FIGURAS_DATA;
if (!d || typeof Plotly === 'undefined') {
  throw new Error('FIGURAS_DATA or Plotly not available');
}

const common = {
  paper_bgcolor: 'rgba(0,0,0,0)',
  plot_bgcolor: 'rgba(0,0,0,0)',
  margin: { l: 46, r: 20, t: 16, b: 56 },
  font: { family: 'Space Grotesk, sans-serif', color: '#1b1d1c' }
};

Plotly.newPlot('fig1', [{
  type: 'bar', x: d.wrb_class_distribution.labels, y: d.wrb_class_distribution.counts,
  marker: { color: d.wrb_class_distribution.labels.map(palette) }
}], { ...common, xaxis: { tickangle: -30 }, yaxis: { title: 'Muestras' } }, { responsive: true, displaylogo: false });

Plotly.newPlot('fig2', [{
  type: 'bar', x: d.wrb_class_distribution.labels, y: d.wrb_class_distribution.counts,
  marker: { color: d.wrb_class_distribution.labels.map(palette) }
}], { ...common, xaxis: { tickangle: -30 }, yaxis: { title: 'Muestras', type: 'log' } }, { responsive: true, displaylogo: false });

Plotly.newPlot('fig3', [{
  type: 'bar', x: d.wrb_missing_top20.labels, y: d.wrb_missing_top20.pct,
  marker: { color: '#b45309' }
}], { ...common, xaxis: { tickangle: -45 }, yaxis: { title: 'Missing %' } }, { responsive: true, displaylogo: false });

Plotly.newPlot('fig4', [
  { type: 'scatter', mode: 'lines+markers', name: 'vwc', x: d.missing_by_depth.vwc.depth, y: d.missing_by_depth.vwc.pct },
  { type: 'scatter', mode: 'lines+markers', name: 'temp', x: d.missing_by_depth.temp.depth, y: d.missing_by_depth.temp.pct },
  { type: 'scatter', mode: 'lines+markers', name: 'vic', x: d.missing_by_depth.vic.depth, y: d.missing_by_depth.vic.pct }
], { ...common, xaxis: { title: 'Depth (cm)' }, yaxis: { title: 'Missing %' } }, { responsive: true, displaylogo: false });

const cls = Object.keys(d.profiles.vwc);
Plotly.newPlot('fig5', cls.map((c) => ({ type: 'scatter', mode: 'lines+markers', name: c, x: d.profiles.depth, y: d.profiles.vwc[c], line: { color: palette(c) } })), { ...common, xaxis: { title: 'Depth (cm)' }, yaxis: { title: 'VWC' } }, { responsive: true, displaylogo: false });
Plotly.newPlot('fig6', cls.map((c) => ({ type: 'scatter', mode: 'lines+markers', name: c, x: d.profiles.depth, y: d.profiles.temp[c], line: { color: palette(c) } })), { ...common, xaxis: { title: 'Depth (cm)' }, yaxis: { title: 'TEMP' } }, { responsive: true, displaylogo: false });

Plotly.newPlot('fig7', [{ type: 'heatmap', x: d.correlation.columns, y: d.correlation.columns, z: d.correlation.values, colorscale: 'RdBu', zmid: 0 }], { ...common, margin: { l: 90, r: 20, t: 16, b: 100 } }, { responsive: true, displaylogo: false });

const pcaTraces = [];
for (const c of d.pca.top_classes) {
  const x = [];
  const y = [];
  d.pca.label.forEach((lbl, i) => {
    if (lbl === c) {
      x.push(d.pca.x[i]);
      y.push(d.pca.y[i]);
    }
  });
  pcaTraces.push({ type: 'scattergl', mode: 'markers', name: c, x, y, marker: { size: 4, opacity: 0.5, color: palette(c) } });
}
Plotly.newPlot('fig8', pcaTraces, { ...common, xaxis: { title: 'PC1' }, yaxis: { title: 'PC2' } }, { responsive: true, displaylogo: false });

Plotly.newPlot('fig9', [
  { type: 'histogram', name: 'clay', x: d.usda_hist.clay, opacity: 0.65 },
  { type: 'histogram', name: 'sand', x: d.usda_hist.sand, opacity: 0.65 },
  { type: 'histogram', name: 'silt', x: d.usda_hist.silt, opacity: 0.65 }
], { ...common, barmode: 'overlay', xaxis: { title: 'pct' }, yaxis: { title: 'count' } }, { responsive: true, displaylogo: false });

Plotly.newPlot('fig10', [{
  type: 'scattergl', mode: 'markers',
  x: d.usda_scatter.clay,
  y: d.usda_scatter.sand,
  marker: { size: 5, opacity: 0.6, color: d.usda_scatter.silt, colorscale: 'Viridis', colorbar: { title: 'silt' } }
}], { ...common, xaxis: { title: 'clay_30_60_pct' }, yaxis: { title: 'sand_30_60_pct' } }, { responsive: true, displaylogo: false });

const cov = d.label_coverage_breakdown;
const fig11Labels = (cov && Array.isArray(cov.labels) && Array.isArray(cov.values))
  ? cov.labels
  : ['labeled', 'unlabeled'];
const fig11Values = (cov && Array.isArray(cov.labels) && Array.isArray(cov.values))
  ? cov.values
  : [d.label_coverage.known, d.label_coverage.unknown];

Plotly.newPlot('fig11', [{
  type: 'pie', labels: fig11Labels, values: fig11Values
}], { ...common, margin: { l: 10, r: 10, t: 10, b: 10 } }, { responsive: true, displaylogo: false });

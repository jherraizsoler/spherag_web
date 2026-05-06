const depthSelect = document.getElementById('depthSelect');
const classSelect = document.getElementById('classSelect');
const signalSelect = document.getElementById('signalSelect');
const colorModeSelect = document.getElementById('colorModeSelect');
const usdaClassCounter = document.getElementById('usdaClassCounter');
const top3Summary = document.getElementById('top3Summary');
const exportCounterBtn = document.getElementById('exportCounterBtn');
const kruskalPanel = document.getElementById('kruskalPanel');
const provenanceBox = document.getElementById('provenanceBox');
const defenseModeBtn = document.getElementById('defenseModeBtn');
const defenseCard = document.getElementById('defenseCard');
const defenseContent = document.getElementById('defenseContent');

let latestUsdaCounterRows = [];
let latestUsdaCounterTotal = 0;

function rgbaForClass(name) {
  const palette = [
    '#0f766e', '#d97706', '#334155', '#8b5cf6', '#0891b2',
    '#dc2626', '#65a30d', '#4f46e5', '#b45309', '#0ea5e9'
  ];
  const idx = Math.abs(Array.from(name).reduce((acc, ch) => acc + ch.charCodeAt(0), 0)) % palette.length;
  return palette[idx];
}

function hexToRgba(hex, alpha) {
  const raw = hex.replace('#', '');
  const safe = raw.length === 3
    ? raw.split('').map((ch) => ch + ch).join('')
    : raw;
  const r = parseInt(safe.substring(0, 2), 16);
  const g = parseInt(safe.substring(2, 4), 16);
  const b = parseInt(safe.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function ternaryLineForConstant(axis, value) {
  const pts = [];
  for (let i = 0; i <= 100 - value; i += 2) {
    const a = axis === 'clay' ? value : i;
    const b = axis === 'sand' ? value : (axis === 'clay' ? i : 100 - value - i);
    const c = 100 - a - b;
    if (c >= 0) pts.push({ a, b, c });
  }

  return {
    type: 'scatterternary',
    mode: 'lines',
    a: pts.map((p) => p.a),
    b: pts.map((p) => p.b),
    c: pts.map((p) => p.c),
    line: { color: 'rgba(80,80,80,0.24)', width: 1 },
    hoverinfo: 'skip',
    showlegend: false
  };
}

function initDashboard() {
  if (!window.PRESENTATION_DATA || typeof Plotly === 'undefined') return;

  const data = window.PRESENTATION_DATA;
  const wrb = data.wrb;
  const usda = data.usda;
  const profiles = data.profiles;
  const uncertainty = data.uncertainty;
  const kruskalStats = data.kruskal;
  const provenance = usda.provenance || {};

  provenanceBox.innerHTML = `
    <b>Trazabilidad USDA:</b> puntos tomados de <b>${provenance.source_csv || 'sentek_unified_labeled_ready.csv'}</b>.
    Clasificación USDA por punto con <b>${provenance.classifier || "soiltexture.getTexture(classification='USDA')"}</b>.
    Muestreo para visualización: límite ${Number(provenance.sample_n_limit || 8000).toLocaleString()} por profundidad,
    random_state=${provenance.sampling_random_state ?? 42}.
    Disponibles/mostrados 30-60cm: ${(provenance.depth_30_60_available ?? 0).toLocaleString()}/${(provenance.depth_30_60_used ?? 0).toLocaleString()}.
    Disponibles/mostrados 60-100cm: ${(provenance.depth_60_100_available ?? 0).toLocaleString()}/${(provenance.depth_60_100_used ?? 0).toLocaleString()}.
  `;

  [...wrb.top_classes, 'Unknown'].forEach((name) => {
    const opt = document.createElement('option');
    opt.value = name;
    opt.textContent = name;
    classSelect.appendChild(opt);
  });

  const commonLayout = {
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor: 'rgba(0,0,0,0)',
    margin: { l: 40, r: 20, t: 16, b: 50 },
    font: { family: 'Space Grotesk, sans-serif', color: '#1b1d1c' }
  };

  Plotly.newPlot('wrbChart', [{
    type: 'bar',
    x: wrb.labels,
    y: wrb.counts,
    marker: {
      color: wrb.labels.map((l) => rgbaForClass(l)),
      line: { color: '#1b1d1c', width: 0.3 }
    },
    hovertemplate: '%{x}<br>%{y} muestras<extra></extra>'
  }], {
    ...commonLayout,
    yaxis: { title: 'Muestras' },
    xaxis: { tickangle: -30 }
  }, { responsive: true, displaylogo: false });

  function buildUsdaTraces() {
    const depthKey = depthSelect.value;
    const selectedClass = classSelect.value;
    const colorMode = colorModeSelect.value;
    const points = usda[depthKey].filter((p) => selectedClass === 'All' || p.soil === selectedClass);

    const classKey = colorMode === 'usda' ? 'usda_class' : 'soil';
    const classes = [...new Set(points.map((p) => p[classKey]))];
    const traces = [];

    classes.forEach((cls) => {
      const subset = points.filter((p) => p[classKey] === cls);
      traces.push({
        type: 'scatterternary',
        mode: 'markers',
        name: cls,
        a: subset.map((p) => p.clay),
        b: subset.map((p) => p.sand),
        c: subset.map((p) => p.silt),
        customdata: subset.map((p) => [p.soil, p.usda_class]),
        marker: { size: 6, opacity: 0.58, color: rgbaForClass(cls) },
        hovertemplate: 'Color group: ' + cls + '<br>WRB: %{customdata[0]}<br>USDA: %{customdata[1]}<br>Clay: %{a:.1f}%<br>Sand: %{b:.1f}%<br>Silt: %{c:.1f}%<extra></extra>'
      });
    });

    usda.guide_lines.clay.forEach((value) => traces.push(ternaryLineForConstant('clay', value)));
    usda.guide_lines.sand.forEach((value) => traces.push(ternaryLineForConstant('sand', value)));
    usda.guide_lines.silt.forEach((value) => traces.push(ternaryLineForConstant('silt', value)));

    traces.push({
      type: 'scatterternary',
      mode: 'text',
      a: usda.section_labels.map((s) => s.clay),
      b: usda.section_labels.map((s) => s.sand),
      c: usda.section_labels.map((s) => s.silt),
      text: usda.section_labels.map((s) => s.name),
      textfont: { size: 10, color: '#1f2937' },
      hoverinfo: 'skip',
      showlegend: false
    });

    return traces;
  }

  function renderUsdaCounter() {
    const depthKey = depthSelect.value;
    const selectedClass = classSelect.value;
    const points = usda[depthKey].filter((p) => selectedClass === 'All' || p.soil === selectedClass);

    const totals = new Map();
    points.forEach((p) => {
      const key = p.usda_class || 'Unclassified';
      totals.set(key, (totals.get(key) || 0) + 1);
    });

    const rows = [...totals.entries()].sort((a, b) => b[1] - a[1]);
    latestUsdaCounterRows = rows;
    latestUsdaCounterTotal = points.length;

    const top3 = rows.slice(0, 3).reduce((acc, item) => acc + item[1], 0);
    const top3Pct = points.length ? ((top3 * 100) / points.length).toFixed(1) : '0.0';
    top3Summary.textContent = `Top 3 acumulado: ${top3.toLocaleString()} puntos (${top3Pct}%)`;

    usdaClassCounter.innerHTML = '';
    rows.forEach(([name, count]) => {
      const pct = points.length ? ((count * 100) / points.length).toFixed(1) : '0.0';
      const item = document.createElement('div');
      item.className = 'counter-pill';
      item.innerHTML = `<b>${name}</b><small>${count.toLocaleString()} puntos (${pct}%)</small>`;
      usdaClassCounter.appendChild(item);
    });

    if (!rows.length) {
      top3Summary.textContent = 'Top 3 acumulado: 0 puntos (0.0%)';
      usdaClassCounter.innerHTML = '<div class="counter-pill"><b>Sin datos</b><small>No hay puntos para este filtro.</small></div>';
    }
  }

  function renderUsda() {
    const traces = buildUsdaTraces();
    Plotly.react('usdaChart', traces, {
      ...commonLayout,
      margin: { l: 0, r: 0, t: 6, b: 0 },
      ternary: {
        sum: 100,
        aaxis: { title: 'Clay %', min: 0, linewidth: 1, ticks: 'outside' },
        baxis: { title: 'Sand %', min: 0, linewidth: 1, ticks: 'outside' },
        caxis: { title: 'Silt %', min: 0, linewidth: 1, ticks: 'outside' },
        bgcolor: 'rgba(255,255,255,0.12)'
      },
      showlegend: true,
      legend: { orientation: 'h' }
    }, { responsive: true, displaylogo: false });
  }

  function renderProfile() {
    const selectedSignal = signalSelect.value;
    const selectedClass = classSelect.value;
    const depth = profiles.depths_cm;
    const source = profiles.by_class;

    const classes = selectedClass === 'All' ? Object.keys(source) : (source[selectedClass] ? [selectedClass] : []);

    const traces = classes.map((cls) => ({
      type: 'scatter',
      mode: 'lines+markers',
      name: cls,
      x: depth,
      y: source[cls][selectedSignal],
      marker: { size: 7 },
      line: { width: 3, color: rgbaForClass(cls) },
      hovertemplate: `${cls}<br>Depth: %{x} cm<br>${selectedSignal.toUpperCase()}: %{y:.2f}<extra></extra>`
    }));

    Plotly.react('profileChart', traces, {
      ...commonLayout,
      xaxis: { title: 'Depth (cm)' },
      yaxis: { title: selectedSignal.toUpperCase() },
      legend: { orientation: 'h' }
    }, { responsive: true, displaylogo: false });
  }

  function renderUncertainty() {
    const signal = signalSelect.value;
    const selectedClass = classSelect.value;
    const depth = uncertainty.depths_cm;
    const byClass = uncertainty.by_signal[signal] || {};

    const classes = selectedClass === 'All'
      ? Object.keys(byClass)
      : (byClass[selectedClass] ? [selectedClass] : []);

    const traces = [];
    classes.forEach((cls) => {
      const stats = byClass[cls];
      const color = rgbaForClass(cls);
      traces.push({
        type: 'scatter',
        mode: 'lines',
        x: depth,
        y: stats.q3,
        line: { width: 0, color },
        showlegend: false,
        hoverinfo: 'skip'
      });
      traces.push({
        type: 'scatter',
        mode: 'lines',
        x: depth,
        y: stats.q1,
        line: { width: 0, color },
        fill: 'tonexty',
        fillcolor: hexToRgba(color, 0.15),
        name: `${cls} IQR`,
        hovertemplate: `${cls}<br>Depth: %{x} cm<br>Q1: %{y:.2f}<extra></extra>`
      });
      traces.push({
        type: 'scatter',
        mode: 'lines+markers',
        x: depth,
        y: stats.median,
        line: { width: 3, color },
        marker: { size: 6, color },
        name: `${cls} mediana`,
        hovertemplate: `${cls}<br>Depth: %{x} cm<br>Mediana: %{y:.2f}<extra></extra>`
      });
    });

    Plotly.react('uncertaintyChart', traces, {
      ...commonLayout,
      xaxis: { title: 'Depth (cm)' },
      yaxis: { title: `${signal.toUpperCase()} (mediana + IQR)` },
      legend: { orientation: 'h' }
    }, { responsive: true, displaylogo: false });
  }

  function renderKruskalPanel() {
    const signal = signalSelect.value;
    const rows = kruskalStats[signal] || [];

    const x = rows.map((r) => r.depth_cm);
    const y = rows.map((r) => {
      if (r.p_value === null || r.p_value === undefined) return null;
      const safeP = Math.max(Number(r.p_value), 1e-300);
      return -Math.log10(safeP);
    });

    Plotly.react('kruskalChart', [
      {
        type: 'scatter',
        mode: 'lines+markers',
        x,
        y,
        line: { width: 3, color: '#0f766e' },
        marker: {
          size: 8,
          color: rows.map((r) => (r.significant_0_05 ? '#0f766e' : '#9ca3af')),
        },
        hovertemplate: 'Depth: %{x} cm<br>-log10(p): %{y:.3f}<extra></extra>',
        name: '-log10(p)'
      },
      {
        type: 'scatter',
        mode: 'lines',
        x,
        y: x.map(() => -Math.log10(0.05)),
        line: { width: 1.5, dash: 'dash', color: '#b45309' },
        hoverinfo: 'skip',
        name: 'umbral p=0.05'
      }
    ], {
      ...commonLayout,
      xaxis: { title: 'Depth (cm)' },
      yaxis: { title: '-log10(p)' },
      legend: { orientation: 'h' }
    }, { responsive: true, displaylogo: false });

    const bodyRows = rows.map((r) => {
      let pText = 'NA';
      if (r.p_value !== null && r.p_value !== undefined) {
        const pNum = Number(r.p_value);
        pText = pNum === 0 ? '<1e-308 (límite numérico)' : pNum.toExponential(3);
      }
      const hText = r.h_stat === null || r.h_stat === undefined ? 'NA' : Number(r.h_stat).toFixed(3);
      const sigClass = r.significant_0_05 ? 'stats-pass' : 'stats-fail';
      const sigText = r.significant_0_05 ? 'Sí' : 'No';
      return `<tr>
        <td>${r.depth_cm}</td>
        <td>${hText}</td>
        <td>${pText}</td>
        <td>${r.n_classes}</td>
        <td>${r.n_total}</td>
        <td class="${sigClass}">${sigText}</td>
      </tr>`;
    }).join('');

    kruskalPanel.innerHTML = `
      <table class="stats-table">
        <thead>
          <tr>
            <th>Depth (cm)</th>
            <th>H</th>
            <th>p-value</th>
            <th>Clases</th>
            <th>N total</th>
            <th>p&lt;0.05</th>
          </tr>
        </thead>
        <tbody>${bodyRows}</tbody>
      </table>
      <p class="counter-note">Nota: cuando p-value aparece como &lt;1e-308 es por límite de precisión numérica de coma flotante, no porque el valor sea inventado.</p>
    `;
  }

  function updateAll() {
    renderUsda();
    renderProfile();
    renderUncertainty();
    renderKruskalPanel();
    renderUsdaCounter();
  }

  function exportCounterCsv() {
    const depthLabel = depthSelect.value === 'depth_30_60' ? '30-60cm' : '60-100cm';
    const wrbFilter = classSelect.value;
    const total = latestUsdaCounterTotal;

    const lines = [
      'depth_filter,wrb_filter,usda_class,count,pct',
      ...latestUsdaCounterRows.map(([name, count]) => {
        const pct = total ? ((count * 100) / total).toFixed(3) : '0.000';
        const safeName = String(name).replaceAll(',', ' ');
        return `${depthLabel},${wrbFilter},${safeName},${count},${pct}`;
      })
    ];

    const csv = lines.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `usda_counter_${depthLabel}_${wrbFilter}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function buildDefenseSummary() {
    const signal = signalSelect.value;
    const rows = kruskalStats[signal] || [];

    const total = wrb.counts.reduce((a, b) => a + b, 0);
    const top = wrb.labels.map((label, i) => ({ label, n: wrb.counts[i] })).sort((a, b) => b.n - a.n);
    const top3 = top.slice(0, 3);

    const significantDepths = rows.filter((r) => r.significant_0_05).map((r) => r.depth_cm).sort((a, b) => a - b);
    const firstDepth = significantDepths.length ? significantDepths[0] : 'NA';
    const lastDepth = significantDepths.length ? significantDepths[significantDepths.length - 1] : 'NA';

    const top3Text = top3
      .map((item) => {
        const pct = total ? ((item.n * 100) / total).toFixed(1) : '0.0';
        return `${item.label}: ${item.n.toLocaleString()} (${pct}%)`;
      })
      .join(' | ');

    defenseContent.innerHTML = `
      <p class="defense-line"><b>Tamaño muestral total (WRB):</b> ${total.toLocaleString()} registros etiquetados.</p>
      <p class="defense-line"><b>Clases con mayor peso:</b> ${top3Text}</p>
      <p class="defense-line"><b>Significancia por profundidad (${signal.toUpperCase()}):</b> ${significantDepths.length} capas con p&lt;0.05, desde ${firstDepth}cm hasta ${lastDepth}cm.</p>
      <p class="defense-line defense-muted"><b>Mensaje técnico:</b> La muestra dominante de Cambisols permite estimaciones robustas de patrón vertical; las demás clases mantienen valor comparativo para validar transferencia y consistencia entre tipos de suelo.</p>
    `;
  }

  function toggleDefenseMode() {
    const opening = defenseCard.hidden;
    if (opening) {
      buildDefenseSummary();
      defenseCard.hidden = false;
      defenseModeBtn.textContent = 'Ocultar modo defensa';
      return;
    }

    defenseCard.hidden = true;
    defenseModeBtn.textContent = 'Modo defensa';
  }

  depthSelect.addEventListener('change', updateAll);
  classSelect.addEventListener('change', updateAll);
  signalSelect.addEventListener('change', updateAll);
  colorModeSelect.addEventListener('change', updateAll);
  exportCounterBtn.addEventListener('click', exportCounterCsv);
  defenseModeBtn.addEventListener('click', toggleDefenseMode);

  updateAll();
}

initDashboard();

const slides = Array.from(document.querySelectorAll('.slide'));
const railButtons = Array.from(document.querySelectorAll('.rail-btn'));
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const counter = document.getElementById('slideCounter');
const progressBar = document.getElementById('progressBar');
const depthSelect = document.getElementById('depthSelect');
const classSelect = document.getElementById('classSelect');
const signalSelect = document.getElementById('signalSelect');
const colorModeSelect = document.getElementById('colorModeSelect');
const usdaClassCounter = document.getElementById('usdaClassCounter');
const top3Summary = document.getElementById('top3Summary');
const exportCounterBtn = document.getElementById('exportCounterBtn');

let current = 0;
let chartsReady = false;
let latestUsdaCounterRows = [];
let latestUsdaCounterTotal = 0;

function rgbaForClass(name) {
  const palette = [
    '#0f766e', '#d97706', '#334155', '#8b5cf6', '#0891b2',
    '#dc2626', '#65a30d', '#4f46e5', '#b45309', '#0ea5e9'
  ];
  const idx = Math.abs(
    Array.from(name).reduce((acc, ch) => acc + ch.charCodeAt(0), 0)
  ) % palette.length;
  return palette[idx];
}

function updateUI(index) {
  current = Math.max(0, Math.min(index, slides.length - 1));

  slides.forEach((slide, i) => {
    slide.classList.toggle('is-active', i === current);
  });

  railButtons.forEach((btn, i) => {
    btn.classList.toggle('is-active', i === current);
  });

  counter.textContent = `${current + 1} / ${slides.length}`;
  progressBar.style.width = `${((current + 1) / slides.length) * 100}%`;

  prevBtn.disabled = current === 0;
  nextBtn.disabled = current === slides.length - 1;

  if (!chartsReady && current === 5) {
    initLiveCharts();
  }
}

function initLiveCharts() {
  if (!window.PRESENTATION_DATA || typeof Plotly === 'undefined') return;

  const data = window.PRESENTATION_DATA;
  const wrb = data.wrb;
  const usda = data.usda;
  const profiles = data.profiles;

  const classOptions = [...wrb.top_classes, 'Unknown'];
  classOptions.forEach((name) => {
    const opt = document.createElement('option');
    opt.value = name;
    opt.textContent = name;
    classSelect.appendChild(opt);
  });

  const wrbTrace = {
    type: 'bar',
    x: wrb.labels,
    y: wrb.counts,
    marker: {
      color: wrb.labels.map((l) => rgbaForClass(l)),
      line: { color: '#1b1d1c', width: 0.3 }
    },
    hovertemplate: '%{x}<br>%{y} muestras<extra></extra>'
  };

  const commonLayout = {
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor: 'rgba(0,0,0,0)',
    margin: { l: 40, r: 20, t: 16, b: 50 },
    font: { family: 'Space Grotesk, sans-serif', color: '#1b1d1c' }
  };

  Plotly.newPlot('wrbChart', [wrbTrace], {
    ...commonLayout,
    yaxis: { title: 'Muestras' },
    xaxis: { tickangle: -30 }
  }, { responsive: true, displaylogo: false });

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
      line: { color: 'rgba(80,80,80,0.25)', width: 1 },
      hoverinfo: 'skip',
      showlegend: false
    };
  }

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
        marker: {
          size: 6,
          opacity: 0.58,
          color: rgbaForClass(cls)
        },
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
    const totalCount = points.length || 1;
    latestUsdaCounterRows = rows;
    latestUsdaCounterTotal = points.length;

    const top3 = rows.slice(0, 3).reduce((acc, item) => acc + item[1], 0);
    const top3Pct = points.length ? ((top3 * 100) / points.length).toFixed(1) : '0.0';
    top3Summary.textContent = `Top 3 acumulado: ${top3.toLocaleString()} puntos (${top3Pct}%)`;

    usdaClassCounter.innerHTML = '';
    rows.forEach(([name, count]) => {
      const pct = ((count * 100) / totalCount).toFixed(1);
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

  function renderUsda(animated = true) {
    const traces = buildUsdaTraces();
    const layout = {
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
    };

    if (!document.getElementById('usdaChart').data) {
      Plotly.newPlot('usdaChart', traces, layout, { responsive: true, displaylogo: false });
      return;
    }

    if (animated) {
      Plotly.react('usdaChart', traces, layout, { responsive: true, displaylogo: false });
      Plotly.animate('usdaChart', {
        data: traces
      }, {
        transition: { duration: 350, easing: 'cubic-in-out' },
        frame: { duration: 350 }
      });
    } else {
      Plotly.react('usdaChart', traces, layout, { responsive: true, displaylogo: false });
    }
  }

  function renderProfile(animated = true) {
    const selectedSignal = signalSelect.value;
    const selectedClass = classSelect.value;
    const depth = profiles.depths_cm;
    const source = profiles.by_class;

    const classes = selectedClass === 'All'
      ? Object.keys(source)
      : (source[selectedClass] ? [selectedClass] : []);

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

    const layout = {
      ...commonLayout,
      xaxis: { title: 'Depth (cm)' },
      yaxis: { title: selectedSignal.toUpperCase() },
      legend: { orientation: 'h' }
    };

    if (!document.getElementById('profileChart').data) {
      Plotly.newPlot('profileChart', traces, layout, { responsive: true, displaylogo: false });
      return;
    }

    if (animated) {
      Plotly.react('profileChart', traces, layout, { responsive: true, displaylogo: false });
      Plotly.animate('profileChart', { data: traces }, {
        transition: { duration: 320, easing: 'quad-in-out' },
        frame: { duration: 320 }
      });
    } else {
      Plotly.react('profileChart', traces, layout, { responsive: true, displaylogo: false });
    }
  }

  renderUsda(false);
  renderProfile(false);
  renderUsdaCounter();

  const updateLiveCharts = () => {
    renderUsda(true);
    renderProfile(true);
    renderUsdaCounter();
  };

  depthSelect.addEventListener('change', updateLiveCharts);
  classSelect.addEventListener('change', updateLiveCharts);
  signalSelect.addEventListener('change', updateLiveCharts);
  colorModeSelect.addEventListener('change', updateLiveCharts);
  exportCounterBtn.addEventListener('click', exportCounterCsv);

  chartsReady = true;
}

prevBtn.addEventListener('click', () => updateUI(current - 1));
nextBtn.addEventListener('click', () => updateUI(current + 1));

railButtons.forEach((btn, idx) => {
  btn.addEventListener('click', () => {
    const target = Number(btn.dataset.slide);
    updateUI(Number.isFinite(target) ? target : idx);
  });
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'ArrowRight' || event.key === 'PageDown') {
    event.preventDefault();
    updateUI(current + 1);
  }
  if (event.key === 'ArrowLeft' || event.key === 'PageUp') {
    event.preventDefault();
    updateUI(current - 1);
  }
  if (event.key === 'Home') {
    event.preventDefault();
    updateUI(0);
  }
  if (event.key === 'End') {
    event.preventDefault();
    updateUI(slides.length - 1);
  }
});

let touchStartX = 0;
let touchEndX = 0;

window.addEventListener('touchstart', (e) => {
  touchStartX = e.changedTouches[0].screenX;
});

window.addEventListener('touchend', (e) => {
  touchEndX = e.changedTouches[0].screenX;
  const delta = touchEndX - touchStartX;

  if (Math.abs(delta) < 45) return;
  if (delta < 0) updateUI(current + 1);
  if (delta > 0) updateUI(current - 1);
});

updateUI(0);

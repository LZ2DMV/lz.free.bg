/**
 * terrain-profile.js
 * ==================
 * In-browser terrain profile (LOS) using locally served SRTM3 HGT tiles.
 *
 * Globals consumed at call-time (defined by lz.js):
 *   window.reps, window.draggablePin, window.map
 *
 * Entry point:
 *   generateTerrainProfile(callsign)   — assigned to window for onclick compat
 */

'use strict';

// ---------------------------------------------------------------------------
// SRTM3 HGT reader
// ---------------------------------------------------------------------------

const _hgtCache = new Map(); // tileName → ArrayBuffer | null
const _losDebounceTimers = new Map(); // callsign -> timeout id
const _losRequestSeq = new Map(); // callsign -> latest request sequence

function _nextLosRequestSeq(callsign) {
  const next = (_losRequestSeq.get(callsign) || 0) + 1;
  _losRequestSeq.set(callsign, next);
  return next;
}

function _isLosRequestCurrent(callsign, requestSeq) {
  return _losRequestSeq.get(callsign) === requestSeq;
}

function _hgtTileName(lat, lon) {
  const ns = lat >= 0 ? 'N' : 'S';
  const ew = lon >= 0 ? 'E' : 'W';
  const la = String(Math.abs(Math.floor(lat))).padStart(2, '0');
  const lo = String(Math.abs(Math.floor(lon))).padStart(3, '0');
  return `${ns}${la}${ew}${lo}`;
}

async function _fetchHgt(tileName) {
  if (_hgtCache.has(tileName)) return _hgtCache.get(tileName);
  try {
    const resp = await fetch(`srtm/${tileName}.hgt`);
    const buf = resp.ok ? await resp.arrayBuffer() : null;
    _hgtCache.set(tileName, buf);
    return buf;
  } catch (_) {
    _hgtCache.set(tileName, null);
    return null;
  }
}

function _readElevation(buf, lat, lon) {
  // SRTM3: 1201×1201 big-endian Int16; row 0 = north edge of tile
  // Clamp to [0, 1200] — floating-point arithmetic at tile boundaries can produce 1201,
  // pushing the offset past the end of the DataView (RangeError).
  const row = Math.min(1200, Math.max(0, 1200 - Math.round((lat - Math.floor(lat)) * 1200)));
  const col = Math.min(1200, Math.max(0, Math.round((lon - Math.floor(lon)) * 1200)));
  const v = new DataView(buf).getInt16((row * 1201 + col) * 2, false);
  return v < -9000 ? 0 : v; // treat voids as 0 (sea level)
}

// ---------------------------------------------------------------------------
// Profile sampler — linear interpolation along path, nPts+1 samples
// ---------------------------------------------------------------------------

async function _sampleElevationProfile(lat1, lon1, lat2, lon2, nPts) {
  const points = Array.from({ length: nPts + 1 }, (_, i) => {
    const t = i / nPts;
    return { lat: lat1 + (lat2 - lat1) * t, lon: lon1 + (lon2 - lon1) * t, t };
  });

  // Fetch all needed tiles in parallel
  const needed = new Set(points.map(p => _hgtTileName(p.lat, p.lon)));
  const bufs = Object.fromEntries(
    await Promise.all([...needed].map(async n => [n, await _fetchHgt(n)]))
  );

  return points.map(p => {
    const buf = bufs[_hgtTileName(p.lat, p.lon)];
    return { t: p.t, elev: buf ? _readElevation(buf, p.lat, p.lon) : 0 };
  });
}

// ---------------------------------------------------------------------------
// LOS + Earth curvature (4/3 Earth rule, standard for VHF/UHF propagation)
// ---------------------------------------------------------------------------

function _buildLosProfile(profile, txMSL, rxMSL, distKm) {
  const R_EFF_KM = 8495; // 4/3 × 6371 km
  return profile.map(({ t, elev }) => {
    const d = t * distKm;
    // Earth curvature sag at this point (metres, positive = sags below straight line)
    const curve = (d * (distKm - d)) / (2 * R_EFF_KM) * 1000;
    const los = txMSL + (rxMSL - txMSL) * t - curve;
    return { d_km: d, terrain_m: elev, los_m: los, blocked: elev > los };
  });
}

function _getLosStatus(losData) {
  const blockedSamples = losData.filter(p => p.blocked).length;
  const blockedPct = Math.round((blockedSamples / losData.length) * 100);
  const blocked = blockedPct > 0;
  let statusColor = '#27ae60';
  if (blockedPct > 50) {
    statusColor = '#c0392b';
  } else if (blockedPct >= 30) {
    statusColor = '#e67e22';
  }
  return {
    blocked,
    blockedPct,
    statusText: blocked ? `⚠ ${blockedPct}% блокиран` : '✓ Ясна видимост',
    statusColor,
  };
}

// ---------------------------------------------------------------------------
// SVG renderer
// ---------------------------------------------------------------------------

function _renderTerrainSVG(losData, rep, distKm) {
  const W = 500, H = 180;
  const PAD = { top: 12, right: 12, bottom: 28, left: 44 };
  const cW = W - PAD.left - PAD.right;
  const cH = H - PAD.top - PAD.bottom;

  // Y scale: add 10% padding above max, floor at 0 or min-50
  const allElev = losData.map(p => p.terrain_m);
  const allLos  = losData.map(p => p.los_m);
  const yMax = Math.max(...allElev, ...allLos);
  const yMin = Math.max(0, Math.min(...allElev, ...allLos) - 50);
  const yRange = yMax - yMin || 1;
  const yTop = yMax + yRange * 0.10;
  const yBot = yMin;
  const ySpan = yTop - yBot;

  function xPx(d) { return PAD.left + (d / distKm) * cW; }
  function yPx(m) { return PAD.top + (1 - (m - yBot) / ySpan) * cH; }

  function polyPoints(pts, close) {
    let s = pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
    return close ? s : s;
  }

  // Terrain polygon points (close at bottom)
  const terrainPts = [
    [xPx(0), H - PAD.bottom],
    ...losData.map(p => [xPx(p.d_km), yPx(p.terrain_m)]),
    [xPx(distKm), H - PAD.bottom],
  ];

  // LOS polyline points
  const losPts = losData.map(p => [xPx(p.d_km), yPx(p.los_m)]);

  // Blocked segments (terrain > LOS) — filled orange polygons between the two lines
  const blockedSegments = [];
  let seg = null;
  for (let i = 0; i < losData.length; i++) {
    const p = losData[i];
    if (p.blocked) {
      if (!seg) seg = { start: i };
      seg.end = i;
    } else {
      if (seg) { blockedSegments.push(seg); seg = null; }
    }
  }
  if (seg) blockedSegments.push(seg);

  function blockedPolygon(s) {
    const top = losData.slice(s.start, s.end + 1).map(p => [xPx(p.d_km), yPx(p.los_m)]);
    const bot = losData.slice(s.start, s.end + 1).map(p => [xPx(p.d_km), yPx(p.terrain_m)]).reverse();
    return polyPoints([...top, ...bot]);
  }

  // Y axis ticks — 4 rounded ticks
  const tickStep = Math.ceil(ySpan / 4 / 50) * 50 || 50;
  const tickStart = Math.ceil(yBot / tickStep) * tickStep;
  const yTicks = [];
  for (let v = tickStart; v <= yTop; v += tickStep) yTicks.push(v);

  // X axis ticks — every 20 km or sensible interval
  const xTickStep = distKm <= 40 ? 10 : distKm <= 80 ? 20 : distKm <= 200 ? 50 : 100;
  const xTicks = [];
  for (let v = 0; v <= distKm; v += xTickStep) xTicks.push(v);
  if (xTicks[xTicks.length - 1] < distKm) xTicks.push(+distKm.toFixed(1));

  // Antenna height bars at TX and RX
  const txX = xPx(0);
  const rxX = xPx(distKm);
  const txBase = yPx(losData[0].terrain_m);
  const txTop2 = yPx(losData[0].los_m);
  const rxBase = yPx(losData[losData.length - 1].terrain_m);
  const rxTop2 = yPx(losData[losData.length - 1].los_m);

  // LOS status label
  const { statusText, statusColor } = _getLosStatus(losData);

  const svgId = 'tp-hatch-' + rep.callsign; // unique pattern id per callsign
  const svg = `
<svg class="terrain-svg-chart" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <pattern id="${svgId}" width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
      <line x1="0" y1="0" x2="0" y2="4" stroke="#e67e22" stroke-width="1.5" opacity="0.7"/>
    </pattern>
  </defs>

  <!-- background -->
  <rect x="${PAD.left}" y="${PAD.top}" width="${cW}" height="${cH}" fill="#f0f4f8" rx="2"/>

  <!-- Y grid lines -->
  ${yTicks.map(v => `
  <line x1="${PAD.left}" y1="${yPx(v).toFixed(1)}" x2="${PAD.left + cW}" y2="${yPx(v).toFixed(1)}"
        stroke="#ccc" stroke-width="0.5" stroke-dasharray="3,3"/>`).join('')}

  <!-- terrain polygon -->
  <polygon points="${polyPoints(terrainPts)}"
           fill="#5a9e3a" fill-opacity="0.75" stroke="none"/>

  <!-- blocked sections (hatch + orange fill) -->
  ${blockedSegments.map(s => `
  <polygon points="${blockedPolygon(s)}" fill="url(#${svgId})" stroke="none"/>
  <polygon points="${blockedPolygon(s)}" fill="#e67e22" fill-opacity="0.25" stroke="none"/>`).join('')}

  <!-- LOS line -->
  <polyline points="${polyPoints(losPts)}"
            fill="none" stroke="#c0392b" stroke-width="1.5" stroke-dasharray="5,3"/>

  <!-- antenna bars -->
  <line x1="${txX}" y1="${txBase}" x2="${txX}" y2="${txTop2}" stroke="#c0392b" stroke-width="2"/>
  <circle cx="${txX}" cy="${txTop2}" r="2.5" fill="#c0392b"/>
  <line x1="${rxX}" y1="${rxBase}" x2="${rxX}" y2="${rxTop2}" stroke="#2980b9" stroke-width="2"/>
  <circle cx="${rxX}" cy="${rxTop2}" r="2.5" fill="#2980b9"/>

  <!-- chart border -->
  <rect x="${PAD.left}" y="${PAD.top}" width="${cW}" height="${cH}"
        fill="none" stroke="#bbb" stroke-width="0.8"/>

  <!-- Y axis ticks + labels -->
  ${yTicks.map(v => `
  <line x1="${PAD.left - 3}" y1="${yPx(v).toFixed(1)}" x2="${PAD.left}" y2="${yPx(v).toFixed(1)}"
        stroke="#888" stroke-width="0.8"/>
  <text x="${PAD.left - 5}" y="${(yPx(v) + 3).toFixed(1)}"
        text-anchor="end" font-size="9" fill="#555">${v}</text>`).join('')}

  <!-- X axis ticks + labels -->
  ${xTicks.map(v => `
  <line x1="${xPx(v).toFixed(1)}" y1="${H - PAD.bottom}" x2="${xPx(v).toFixed(1)}" y2="${H - PAD.bottom + 3}"
        stroke="#888" stroke-width="0.8"/>
  <text x="${xPx(v).toFixed(1)}" y="${H - PAD.bottom + 10}"
        text-anchor="middle" font-size="9" fill="#555">${v}</text>`).join('')}

  <!-- axis labels -->
  <text x="${PAD.left - 30}" y="${(PAD.top + cH / 2).toFixed(1)}"
        text-anchor="middle" font-size="9" fill="#777"
        transform="rotate(-90 ${PAD.left - 30} ${(PAD.top + cH / 2).toFixed(1)})">м н.в.</text>
  <text x="${(PAD.left + cW / 2).toFixed(1)}" y="${H - 2}"
        text-anchor="middle" font-size="9" fill="#777">км</text>

  <!-- endpoint labels -->
  <text x="${txX + 3}" y="${PAD.top + 9}" font-size="9" fill="#c0392b">${rep.callsign}</text>
  <text x="${rxX - 3}" y="${PAD.top + 9}" text-anchor="end" font-size="9" fill="#2980b9">📍</text>

  <!-- LOS status -->
  <text x="${(PAD.left + cW / 2).toFixed(1)}" y="${PAD.top + 9}"
        text-anchor="middle" font-size="9" font-weight="bold" fill="${statusColor}">${statusText}</text>
</svg>`.trim();

  // Wrap in a link that opens the full SVG in a new tab (blob URL = no length limit)
  const blob = new Blob([svg], { type: 'image/svg+xml' });
  const url  = URL.createObjectURL(blob);
  return `<a href="${url}" target="_blank" title="Отвори профила в нов таб">${svg}</a>`;
}

// ---------------------------------------------------------------------------
// HeyWhatsThat fallback (used when LZ_TERRAIN_PROFILE = 'heywhatsthat')
// ---------------------------------------------------------------------------

function _generateHeyWhatsThatHTML(rep, pin) {
  const params = new URLSearchParams({
    src: 'lz.free.bg',
    axes: 1, metric: 1, curvature: 1, greatcircle: 1,
    refraction: '', exaggeration: '', groundrelative: '',
    los: 1,
    freq: parseInt(rep.rx, 10) || '',
    width: 1600, height: 500,
    pt0: `${rep.latitude},${rep.longitude},FF0000,${rep.altitude || ''},FF3366`,
    pt1: `${pin.lat},${pin.lng},FF0000,,FF3366`,
  });
  const url = 'https://heywhatsthat.com/bin/profile-0904.cgi?' + params.toString();
  return `<a href="${url}" target="_blank">
    <img src="${url}" alt="Профил на терена" loading="lazy" decoding="async"
         referrerpolicy="no-referrer"
         style="width:100%;height:auto;max-width:500px;border:1px solid #dee2e6;border-radius:0.375rem;"
         onerror="this.parentElement.innerHTML='<em>Неуспешно зареждане на профила.</em>'">
  </a>
  <div class="terrain-profile-credit">Изображение от <a href="https://www.heywhatsthat.com/" target="_blank">HeyWhatsThat.com</a></div>`;
}

function _getLosLegendHTML() {
  return `<div class="terrain-profile-legend">
    <div><b>LOS подсказка:</b> червената пунктирна линия е линията на видимост.</div>
    <div>Ако релефът е над линията, има препятствие по трасето.</div>
    <div>Премести пинчето или пробвай друг репитер за сравнение.</div>
  </div>`;
}

function _getLosHeaderHTML(callsign, blockedPct, statusColor, isTooClose) {
  const pctMarkup = `<b style="color:${statusColor};">${blockedPct}%</b>`;
  const info = blockedPct > 0
    ? `Блокирана видимост: ${pctMarkup}`
    : `Блокирана видимост: ${pctMarkup} (ясна видимост)`;
  const warning = isTooClose
    ? '<span class="terrain-profile-close-warning">Разстоянието е много малко; резултатът може да е неточен.</span>'
    : '';
  return `<div class="terrain-profile-header">
    <span class="terrain-profile-header-text">${info}${warning ? ' ' + warning : ''}</span>
    <button class="terrain-profile-info-btn" type="button" title="Покажи/скрий легенда" aria-label="Покажи или скрий LOS легендата" onclick="return toggleTerrainProfileLegend('${callsign}');">i</button>
  </div>`;
}

function _getLegendWithIdHTML(callsign) {
  return `<div id="terrain-profile-legend-${callsign}" style="display:none;">${_getLosLegendHTML()}</div>`;
}

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

async function _generateTerrainProfileNow(callsign, requestSeq) {
  const rep = window.reps && window.reps.find(r => r.callsign === callsign);
  if (!rep) return;
  const pin = window.draggablePin && window.draggablePin.getLatLng();
  if (!pin) return;
  const container = document.getElementById('terrain-profile-' + callsign);
  if (!container) return;
  const distKm = window.map.distance(
    [rep.latitude, rep.longitude], [pin.lat, pin.lng]
  ) / 1000;
  const isTooClose = distKm < 5;

  // Hide the click-to-generate link
  const linkContainer = container.parentElement;
  if (linkContainer) {
    const link = linkContainer.querySelector('.terrain-profile-link');
    const comment = linkContainer.querySelector('.terrain-profile-comment');
    if (link) link.style.display = 'none';
    if (comment) comment.style.display = 'none';
  }

  // HeyWhatsThat mode — skip SRTM fetch entirely
  if (window.LZ_TERRAIN_PROFILE === 'heywhatsthat') {
    if (!_isLosRequestCurrent(callsign, requestSeq)) return;
    const unknownStatusColor = '#27ae60';
    container.innerHTML =
      _getLosHeaderHTML(rep.callsign, 0, unknownStatusColor, isTooClose) +
      _generateHeyWhatsThatHTML(rep, pin) +
      _getLegendWithIdHTML(rep.callsign);
    return;
  }

  container.innerHTML = '<em style="font-size:0.85em;color:#666">Зарежда профил на терена…</em>';

  try {
    const nPts = 250;
    const profile = await _sampleElevationProfile(
      rep.latitude, rep.longitude, pin.lat, pin.lng, nPts
    );
    if (!_isLosRequestCurrent(callsign, requestSeq)) return;

    if (distKm < 0.1) {
      container.innerHTML = '<em style="font-size:0.85em;color:#666">Репитерът е твърде близо до габърчето.</em>';
      return;
    }

    // TX altitude: repeater MSL + antenna height estimate
    const txTerrainElev = profile[0].elev;
    const txMSL = rep.altitude
      ? rep.altitude + 5          // repeater has known altitude — add 5m mast
      : txTerrainElev + 10;       // unknown altitude — assume 10m AGL

    // RX altitude: pin terrain + 2m (hand-held)
    const rxMSL = profile[nPts].elev + 2;

    const losData = _buildLosProfile(profile, txMSL, rxMSL, distKm);
    const losStatus = _getLosStatus(losData);
    if (!_isLosRequestCurrent(callsign, requestSeq)) return;
    container.innerHTML =
      _getLosHeaderHTML(rep.callsign, losStatus.blockedPct, losStatus.statusColor, isTooClose) +
      _renderTerrainSVG(losData, rep, distKm) +
      _getLegendWithIdHTML(rep.callsign);
  } catch (e) {
    if (!_isLosRequestCurrent(callsign, requestSeq)) return;
    console.error('generateTerrainProfile error:', e);
    container.innerHTML = '<em style="font-size:0.85em;color:#c00">Грешка при зареждане на профила.</em>';
  }
}

function generateTerrainProfile(callsign) {
  const prevTimer = _losDebounceTimers.get(callsign);
  if (prevTimer) clearTimeout(prevTimer);
  const timerId = setTimeout(() => {
    _losDebounceTimers.delete(callsign);
    const requestSeq = _nextLosRequestSeq(callsign);
    _generateTerrainProfileNow(callsign, requestSeq);
  }, 180);
  _losDebounceTimers.set(callsign, timerId);
}

window.toggleTerrainProfileLegend = function (callsign) {
  const legend = document.getElementById('terrain-profile-legend-' + callsign);
  if (!legend) return false;
  legend.style.display = legend.style.display === 'none' ? 'block' : 'none';
  return false;
};

window.generateTerrainProfile = generateTerrainProfile;

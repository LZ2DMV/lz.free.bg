var repsAll = 0;
var repsFM = 0;
var repsDStar = 0;
var repsDMR = 0;
var repsYSF = 0;
var repsNXDN = 0;
var repsParrot = 0;
var reps = [];
var fuseSearch;
let dbLastUpdate = '';
let dbChangelog = null;

// Feature flags
window.LZ_DEBUG_FILTERS = false;
// Terrain profile engine: 'svg' (local SRTM-based, default) or 'heywhatsthat' (external service)
window.LZ_TERRAIN_PROFILE = 'svg';

let siteChangelogText = '';
let siteChangelogError = null;
let siteChangelogPromise = null;

const api = new BGRepeaters({
  baseURL: window.localApi ? 'http://localhost:8787/v1' : 'https://api.varna.radio/v1'
});

function escapeTextBlock(value) {
  if (typeof value !== 'string') return '';
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function fetchSiteChangelog() {
  if (siteChangelogPromise) return siteChangelogPromise;
  if (typeof fetch !== 'function') {
    siteChangelogError = new Error('fetch unavailable in this browser');
    return Promise.resolve('');
  }
  const changelogUrl = 'changelog.txt';
  siteChangelogPromise = fetch(changelogUrl, { cache: 'no-store' })
    .then((resp) => {
      if (!resp.ok) throw new Error('Failed to load changelog (' + resp.status + ')');
      return resp.text();
    })
    .then((text) => {
      siteChangelogText = text;
      return text;
    })
    .catch((err) => {
      siteChangelogError = err;
      console.warn('Неуспешно зареждане на changelog.txt', err);
      return '';
    });
  return siteChangelogPromise;
}

function getSiteChangelogMarkup() {
  if (siteChangelogText && siteChangelogText.trim().length) {
    return `<textarea style='width: 99%; height: 12rem;'>${escapeTextBlock(siteChangelogText)}</textarea>`;
  }
  if (siteChangelogError) {
    return "<i>Историята на сайта не може да бъде заредена в момента.</i>";
  }
  return "<i>Зареждане на историята на сайта...</i>";
}

fetchSiteChangelog();

function getFormatedFreqMHz(f) {
  const parsed = parseFloat(f);
  return parsed.toFixed(4).endsWith('0') ? parsed.toFixed(3) : parsed.toFixed(4);
}

function isModeEnabled(val) {
  if (val === undefined || val === null) return false;
  if (typeof val === 'boolean') return val;
  if (typeof val === 'object') {
    if (Object.prototype.hasOwnProperty.call(val, 'enabled')) return !!val.enabled;
    return Object.values(val).some((v) => {
      if (typeof v === 'boolean') return v;
      if (typeof v === 'number') return v !== 0;
      if (typeof v === 'string') return v.trim() !== '';
      return !!v;
    });
  }
  return !!val;
}

const MODE_KEY_DEFS = {
  fm: ['analog'],
  am: ['analog'],
  usb: ['analog'],
  lsb: ['analog'],
  dmr: ['dmr'],
  dstar: ['dstar'],
  fusion: ['fusion'],
  ysf: ['fusion'],
  parrot: ['parrot'],
  nxdn: ['nxdn'],
  beacon: ['analog'],
};

function collectModeKeys(modes) {
  const keys = new Set();
  if (modes && typeof modes === 'object') {
    Object.keys(modes).forEach((k) => {
      if (!isModeEnabled(modes[k])) return;
      const normalized = String(k).toLowerCase();
      const mapped = MODE_KEY_DEFS[normalized] || [normalized];
      mapped.forEach((value) => keys.add(value));
    });
  }
  return Array.from(keys).sort();
}

function parseInfoList(value) {
  if (Array.isArray(value)) return value.filter((line) => typeof line === 'string' && line.trim().length);
  if (typeof value === 'string' && value.trim() !== '') return [value.trim()];
  return [];
}


function buildLocationLabel(place, exactLocation) {
  const base = place || '';
  if (base && exactLocation) return `${base} - ${exactLocation}`;
  return base || exactLocation || '';
}

function decorateRepeater(r) {
  const rxMHz = (r && r.freq && typeof r.freq.tx === 'number') ? (r.freq.tx / 1e6) : undefined;
  const txMHz = (r && r.freq && typeof r.freq.rx === 'number') ? (r.freq.rx / 1e6) : undefined;
  const tone = r && r.freq ? (typeof r.freq.tone === 'number' ? r.freq.tone : r.freq.ctcss) : undefined;
  const infoList = parseInfoList(r.info);
  const infoHTML = infoList.join('<br>');
  const infoString = infoList.join("\r\n").replace(/<[^>]+>/gm, '');
  const modesArray = collectModeKeys(r.modes || {});
  const band = typeof rxMHz === 'number' && !isNaN(rxMHz) ? (rxMHz > 146 ? 'UHF' : 'VHF') : 'VHF';
  const coverage = null; // Coverage loaded exclusively from local manifest (coverage/manifest.json)
  const channel = r && r.freq && r.freq.channel !== undefined && r.freq.channel !== null
    ? String(r.freq.channel).trim()
    : '';
  const qth = typeof r.qth === 'string' && r.qth.trim().length ? r.qth.trim() : 'N/A';
  const locationLabel = buildLocationLabel(r.place, r.location);

  Object.assign(r, {
    infoList,
    infoHTML,
    infoString,
    rxMHz,
    txMHz,
    rx: typeof rxMHz === 'number' ? getFormatedFreqMHz(rxMHz) : '0.000',
    tx: typeof txMHz === 'number' ? getFormatedFreqMHz(txMHz) : '0.000',
    tone: typeof tone === 'number' && tone > 0 ? tone : undefined,
    band,
    coverage,
    channel,
    qth,
    modesArray,
    modesString: modesArray.length ? modesArray.join(', ') : '—',
    locationLabel,
  });

  return r;
}

async function loadFromAPI() {
  // API no longer requires filters; fetch full list
  const list = await api.getRepeaters();
  return (list || []).filter(r => !r.disabled).map(decorateRepeater);
}

/**
 * Load locally-generated coverage manifest (coverage/manifest.json).
 * The manifest maps callsign → [relativeImageUrl, south, west, north, east].
 * Entries are applied to repeaters that don't already have API-provided coverage.
 * Generated by generate-coverage/04_generate_coverage.py.
 */
async function loadCoverageManifest() {
  try {
    const resp = await fetch('coverage/manifest.json', { cache: 'no-cache' });
    if (!resp.ok) return {};
    return await resp.json();
  } catch (_) {
    return {};
  }
}

(async function initLoad() {
  try {
    const [repsFromAPI, coverageManifest] = await Promise.all([
      loadFromAPI(),
      loadCoverageManifest(),
    ]);
    reps = repsFromAPI;

    // Apply locally-generated coverage from manifest.
    // Manifest format: { callsign: { bounds: [url, s, w, n, e], updated: ISO } }
    // Legacy format (bare array) is also accepted for backwards compatibility.
    if (Object.keys(coverageManifest).length) {
      reps.forEach(r => {
        const entry = coverageManifest[r.callsign];
        if (entry && !entry.failed) {
          r.coverage = Array.isArray(entry) ? entry : entry.bounds;
        }
      });
    }
    // Populate changelog using library’s endpoint shape: { lastChanged, changes: [{date, who, info}] }
    try {
      const cl = await api.getChangelog();
      if (cl && typeof cl === 'object') {
        const grouped = {};
        const arr = Array.isArray(cl.changes) ? cl.changes : [];
        arr.forEach(item => {
          const dateKey = item && item.date ? String(item.date).slice(0, 10) : '';
          if (!dateKey) return;
          const who = item.who ? String(item.who) : '';
          const info = item.info ? String(item.info) : '';
          const line = [info, who].filter(Boolean).join(' — ');
          if (!grouped[dateKey]) grouped[dateKey] = [];
          grouped[dateKey].push(line || JSON.stringify(item));
        });
        // Order keys desc
        const ordered = {};
        Object.keys(grouped)
          .sort((a, b) => (a > b ? -1 : a < b ? 1 : 0))
          .forEach(k => { ordered[k] = grouped[k]; });
        dbChangelog = ordered;
        dbLastUpdate = (cl.lastChanged ? String(cl.lastChanged).slice(0, 10) : (Object.keys(ordered)[0] || ''));
      }
    } catch (e) {
      console.warn('Failed to obtain changelog from API:', e);
    }

    if (reps.length) {
      reps.forEach((r) => {
        r.shortCallsign = r.callsign.substr(3);
        addRepeater(r);
      });
      addBottomBox();
      updateFuseSearch();
      refreshMarkers();
      if (callsign) searchLayers(callsign);
      if (coords) {
        coords = coords.split(",");
        var position = {
          coords: {
            latitude: parseFloat(coords[0]),
            longitude: parseFloat(coords[1]),
          },
        };
        handlePosition(position, false);
      }
    }
    doAlert();
  } catch (e) {
    console.error('Грешка при зареждане на ретранслатори:', e);
    alert('Неуспешно зареждане на ретранслаторите. Моля, опитайте по-късно.');
  }
})();

function addRepeater(r) {
  const net = r.internet || {};
  var terrainProfileLink =
    '<div class="terrain-profile-link-container" style="width: 100%; text-align: center;">' +
    `<a href="#" class="terrain-profile-link" title="Генерирай линия на видимост (LOS) между пинчето и този репитер" onclick="generateTerrainProfile('${r.callsign}');return false;">↺ Линия на видимост (LOS)</a>` +
    "<div class='terrain-profile-comment'>Задай пинчето на твоята позиция, после отвори профила.</div>" +
    `<div id='terrain-profile-${r.callsign}' style='width: 100%; text-align: center;'></div>` +
    '</div>';

  var title =
    '<div class="reptitle">' +
    '<div style="float: left; position: absolute; display: flex; align-items: center; gap: 0.5em;">' +
    '<a href="#" class="remove-for-sidebar" title="Отвори в странична лента" onclick="setSidebar();"><i class="fa-solid fa-window-restore"></i></a>' +
    '<a href="https://repeaters.varna.radio/#/request?callsign=' +
      encodeURIComponent(r.callsign) +
      '" target="_blank" title="Редактирай информацията за този репитър" style="margin-left:2px;">' +
      '<i class="fa-solid fa-pencil-alt" style="color: #444444; opacity: 0.92;"></i>' +
    '</a>' +
    '<a href="#" id="lz-fav-btn-' + r.callsign + '" title="Добави/махни от любими" style="text-decoration:none;font-size:1.5em;" onclick="_lzToggleFavorite(\'' + r.callsign + '\');return false;">' +
      (_lzIsFavorite(r.callsign) ? '★' : '☆') +
    '</a>' +
    "</div>" +
    '<h2><a href = "?callsign=' +
    r.callsign +
    '" title = "вземи директен линк за този репитър" target = "_blank" > ' +
    r.callsign +
    "</a></h2 > " +
    '<div class="title-links">' +
    "<b>" +
    r.locationLabel +
    "</b>" +
    "</div>" +
    terrainProfileLink +
    "<hr>" +
    "RX: <b>" +
    r.rx +
    "</b> MHz<br>" +
    "TX: <b>" +
    r.tx +
    "</b> MHz<br>" +
    (r.tone ? "Тон: <b>" + r.tone + "</b><br>" : "") +
    (r.channel ? "Канал: <b>" + r.channel + "</b><br>" : "") +
    "Режим на работа: <b>" +
    r.modesString +
    "</b><br>" +
    "Отговорник: <b>" +
    r.keeper +
    "</b><br>" +
    (Number(r.power) > 0 ? "Мощност: <b>" + Number(r.power) + "</b> W<br>" : "") +
    (r.altitude ? "Надморска височина: <b>" + r.altitude + "</b> м<br>" : "") +
    "QTH: <b>" +
    r.qth +
    "</b><br>" +
    (net.echolink ? "Echolink #: <b>" + net.echolink + "</b><br>" : "") +
    (net.allstarlink ? "AllStarLink Node: <b>" + net.allstarlink + "</b><br>" : "") +
    (net.zello ? "Zello: <b>" + net.zello + "</b><br>" : "") +
    "<hr>" +
    r.infoHTML +
    "</div>";

  var marker = L.marker(new L.LatLng(r.latitude, r.longitude), {
    title: r.callsign + " - " + (r.place || ''),
    icon: L.divIcon({
      html: '<i class="fa-solid fa-arrow-up pointer"></i>' +
        "<center>" +
        '<span class="name-' +
        r.band +
        '">' +
        r.callsign +
        "</span><br>" +
        '</center><hr class="hr-' +
        r.band +
        '">' +
        r.modesArray
          .map(
            (m) =>
              '<span class="modes-text color-rep-' +
              m +
              '">' +
              m.toUpperCase() +
              "</span>"
          )
          .join("<br>"),
      className: "modes",
    }),
  });
  marker.bindPopup(title, {
    // autoClose: false,
    // autoPan: false,
  });
  marker.boundary = r.coverage ? r.coverage : null;
  marker.name = r.callsign;
  marker.repTypes = r.modesArray;
  markers.addLayer(marker);
  repsAll += 1;
  if (r.modesArray.includes("analog")) repsFM += 1;
  if (r.modesArray.includes("dstar")) repsDStar += 1;
  if (r.modesArray.includes("dmr")) repsDMR += 1;
  if (r.modesArray.includes("fusion")) repsYSF += 1;
  if (r.modesArray.includes("nxdn")) repsNXDN += 1;
  if (r.modesArray.includes("parrot")) repsParrot += 1;
  r._marker = marker;
}

// generateTerrainProfile is defined in src/terrain-profile.js

const repTypes = [
  { key: "analog", label: "Analog/FM", color: "color-rep-analog" },
  { key: "dstar", label: "D-Star", color: "color-rep-dstar" },
  { key: "dmr", label: "DMR", color: "color-rep-dmr" },
  { key: "fusion", label: "Fusion", color: "color-rep-fusion" },
  { key: "nxdn", label: "NXDN", color: "color-rep-nxdn" },
  { key: "parrot", label: "Parrot", color: "color-rep-parrot" },
];

let repTypeEnabled = {
  analog: true,
  dstar: true,
  dmr: true,
  fusion: true,
  nxdn: true,
  parrot: true,
};


function loadRepTypeEnabled() {
  try {
    const saved = localStorage.getItem("lz_repTypeEnabled");
    if (saved) {
      const parsed = JSON.parse(saved);
      Object.keys(repTypeEnabled).forEach(k => {
        if (typeof parsed[k] === "boolean") {
          repTypeEnabled[k] = parsed[k];
        }
      });
    }
  } catch (e) {
    alert('Браузърът няма достъп до localStorage, проверете настройките!');
  }
}

function saveRepTypeEnabled() {
  try {
    localStorage.setItem("lz_repTypeEnabled", JSON.stringify(repTypeEnabled));
  } catch (e) {
    alert('Браузърът няма достъп до localStorage, проверете настройките!');
  }
}

loadRepTypeEnabled();

function isDebugTarget(rep) {
  if (!rep || !rep.callsign) return false;
  return rep.callsign === 'LZ0PUB' || window.LZ_DEBUG_FILTERS === 'all';
}

function debugFilterState(rep, reason) {
  if (!window.LZ_DEBUG_FILTERS || !isDebugTarget(rep) || !rep._marker) return;
  const enabled = isMarkerTypeEnabled(rep);
  const inMarkers = markers.hasLayer(rep._marker);
  const inOut = out.hasLayer(rep._marker);
  const active = Object.keys(repTypeEnabled).filter((k) => !!repTypeEnabled[k]);
  console.debug('[LZ_FILTER_DEBUG]', {
    reason,
    callsign: rep.callsign,
    modesArray: rep.modesArray,
    enabled,
    inMarkers,
    inOut,
    activeTypes: active,
    repTypeEnabled: { ...repTypeEnabled },
  });
}

function isMarkerTypeEnabled(rep) {
  return !!(rep && rep.modesArray && rep.modesArray.some((t) => repTypeEnabled[t]));
}

function refreshMarkers() {
  markers.clearLayers();
  out.clearLayers();
  reps.forEach(r => {
    debugFilterState(r, 'refresh:before');
    if (r._marker && isMarkerTypeEnabled(r))
      markers.addLayer(r._marker);
    debugFilterState(r, 'refresh:after');
  });
  const el = document.getElementById("active-marker-count");
  if (el) el.textContent = markers.getLayers().length;
}

function addBottomBox() {
  var box = L.control({ position: "bottomright" });
  box.onAdd = function (map) {
    var div = L.DomUtil.create("div", "bottom-box foldable-panel folded");
    div.innerHTML =
      `<div class="panel-header" onclick="toggleFoldablePanel(this.parentNode)">
        <span id="panel-caption">Ретранслатори (<span id="active-marker-count">${markers.getLayers().length}</span>)</span>
        <span class="arrow">&#9660;</span>
      </div>
      <div class="panel-content">
        <table style="width:100%">
          <tr id="rep-caption-row"><th colspan="4" class="color-rep-all">Ретранслатори</th></tr>
          <tr>
            <td></td>
            <td class="color-rep-all">Всички</td>
            <td align="center"><b class="color-rep-all">${repsAll}</b></td>
            <td align="right">
              <button type="button" title="Изтегли CSV формат съвместим с CHIRP" onClick="downloadCSV('all');" class="csv-button all">
                <i class="fa-solid fa-download"></i>
              </button>
            </td>
          </tr>
          <tr>
            <td>
              <input id="rep-type-analog" type="checkbox" ${repTypeEnabled.analog ? "checked" : ""} data-type="analog" onchange="onRepTypeFilterChange(event)">
            </td>
            <td class="color-rep-analog"><label for="rep-type-analog" style="cursor:pointer;">Analog/FM/AM/SSB</label></td>
            <td align="center"><b class="color-rep-analog">${repsFM}</b></td>
            <td align="right">
              <button type="button" title="Изтегли CSV формат съвместим с CHIRP" onClick="downloadCSV('analog');" class="csv-button analog">
                <i class="fa-solid fa-download"></i>
              </button>
            </td>
          </tr>
          <tr>
            <td>
              <input id="rep-type-dstar" type="checkbox" ${repTypeEnabled.dstar ? "checked" : ""} data-type="dstar" onchange="onRepTypeFilterChange(event)">
            </td>
            <td class="color-rep-dstar"><label for="rep-type-dstar" style="cursor:pointer;">D-Star</label></td>
            <td align="center"><b class="color-rep-dstar">${repsDStar}</b></td>
            <td align="right">
              <button type="button" title="Изтегли CSV формат съвместим с CHIRP" onClick="downloadCSV('dstar');" class="csv-button dstar">
                <i class="fa-solid fa-download"></i>
              </button>
            </td>
          </tr>
          <tr>
            <td>
              <input id="rep-type-dmr" type="checkbox" ${repTypeEnabled.dmr ? "checked" : ""} data-type="dmr" onchange="onRepTypeFilterChange(event)">
            </td>
            <td class="color-rep-dmr"><label for="rep-type-dmr" style="cursor:pointer;">DMR</label></td>
            <td align="center"><b class="color-rep-dmr">${repsDMR}</b></td>
            <td align="right">
              <button type="button" title="Изтегли CSV формат съвместим с CHIRP" onClick="downloadCSV('dmr');" class="csv-button dmr">
                <i class="fa-solid fa-download"></i>
              </button>
            </td>
          </tr>
          <tr>
            <td>
              <input id="rep-type-fusion" type="checkbox" ${repTypeEnabled.fusion ? "checked" : ""} data-type="fusion" onchange="onRepTypeFilterChange(event)">
            </td>
            <td class="color-rep-fusion"><label for="rep-type-fusion" style="cursor:pointer;">Fusion</label></td>
            <td align="center"><b class="color-rep-fusion">${repsYSF}</b></td>
            <td align="right">
              <button type="button" title="Изтегли CSV формат съвместим с CHIRP" onClick="downloadCSV('fusion');" class="csv-button fusion">
                <i class="fa-solid fa-download"></i>
              </button>
            </td>
          </tr>
          <tr>
            <td>
              <input id="rep-type-nxdn" type="checkbox" ${repTypeEnabled.nxdn ? "checked" : ""} data-type="nxdn" onchange="onRepTypeFilterChange(event)">
            </td>
            <td class="color-rep-nxdn"><label for="rep-type-nxdn" style="cursor:pointer;">NXDN</label></td>
            <td align="center"><b class="color-rep-nxdn">${repsNXDN}</b></td>
            <td align="right">
              <button type="button" title="Изтегли CSV формат съвместим с CHIRP" onClick="downloadCSV('nxdn');" class="csv-button nxdn">
                <i class="fa-solid fa-download"></i>
              </button>
            </td>
          </tr>
          <tr>
            <td>
              <input id="rep-type-parrot" type="checkbox" ${repTypeEnabled.parrot ? "checked" : ""} data-type="parrot" onchange="onRepTypeFilterChange(event)">
            </td>
            <td class="color-rep-parrot"><label for="rep-type-parrot" style="cursor:pointer;">Parrot</label></td>
            <td align="center"><b class="color-rep-parrot">${repsParrot}</b></td>
            <td align="right">
              <button type="button" title="Изтегли CSV формат съвместим с CHIRP" onClick="downloadCSV('parrot');" class="csv-button parrot">
                <i class="fa-solid fa-download"></i>
              </button>
            </td>
          </tr>
        </table>
      </div>`;
    return div;
  };
  box.addTo(map);
}

window.toggleFoldablePanel = function (panelDiv) {
  panelDiv.classList.toggle("folded");
};

window.onRepTypeFilterChange = function (e) {
  const type = e.target.getAttribute("data-type");
  repTypeEnabled[type] = e.target.checked;
  if (window.LZ_DEBUG_FILTERS) {
    console.debug('[LZ_FILTER_DEBUG]', {
      reason: 'checkbox:change',
      type,
      checked: e.target.checked,
      repTypeEnabled: { ...repTypeEnabled },
    });
  }
  saveRepTypeEnabled();
  refreshMarkers();
};

function updateFuseSearch() {
  fuseSearch = new Fuse(reps, {
    keys: ["shortCallsign", "callsign", "place", "location", "rx", "tx", "channel"],
    shouldSort: true,
    threshold: 0.0,
    location: 0,
    distance: 0,
  });
}


// ── Favorites + Recent ────────────────────────────────────────────────────────
function _lzGetFavorites() {
  try { return JSON.parse(localStorage.getItem('lz_favorites') || '[]'); } catch(_) { return []; }
}
function _lzSaveFavorites(arr) {
  try { localStorage.setItem('lz_favorites', JSON.stringify(arr)); } catch(_) {}
}
function _lzIsFavorite(callsign) {
  return _lzGetFavorites().indexOf(callsign) !== -1;
}
function _lzToggleFavorite(callsign) {
  var favs = _lzGetFavorites();
  var idx = favs.indexOf(callsign);
  if (idx === -1) { favs.push(callsign); } else { favs.splice(idx, 1); }
  _lzSaveFavorites(favs);
  // Update star icon in open popup
  var btn = document.getElementById('lz-fav-btn-' + callsign);
  if (btn) btn.innerHTML = _lzIsFavorite(callsign) ? '★' : '☆';
}

function _lzRefreshFavoritesModal() {
  if (!window._lzFavModal || typeof window._lzFavModal.content !== 'function') return;
  window._lzFavModal.content(buildFavoritesModalContent());
}

function _lzRemoveFavorite(callsign) {
  if (!_lzIsFavorite(callsign)) return false;
  if (!confirm('Да премахна ли ' + callsign + ' от любими?')) return false;

  var favs = _lzGetFavorites().filter(function(cs) { return cs !== callsign; });
  _lzSaveFavorites(favs);

  var btn = document.getElementById('lz-fav-btn-' + callsign);
  if (btn) btn.innerHTML = '☆';

  _lzRefreshFavoritesModal();
  return false;
}

function _lzGetRecent() {
  try { return JSON.parse(localStorage.getItem('lz_recent') || '[]'); } catch(_) { return []; }
}
function _lzAddRecent(callsign) {
  var recent = _lzGetRecent().filter(function(c) { return c !== callsign; });
  recent.unshift(callsign);
  if (recent.length > 5) recent = recent.slice(0, 5);
  try { localStorage.setItem('lz_recent', JSON.stringify(recent)); } catch(_) {}
}

function buildFavoritesModalContent() {
  var favs = _lzGetFavorites();
  var recent = _lzGetRecent();
  var content = '';

  content += '<h3 style="margin:0 0 0.5rem 0;">★ Любими</h3>';
  if (favs.length === 0) {
    content += '<p style="color:#888;font-size:0.9em;">Все още нямате любими. Натиснете ☆ в инфо прозореца на репитер.</p>';
  } else {
    content += '<ul style="margin:0 0 0.8rem 1rem;padding:0;">';
    favs.forEach(function(cs) {
      content += '<li style="display:flex;align-items:center;justify-content:space-between;gap:0.5rem;">' +
        '<a href="#" onclick="searchLayers(\'' + cs + '\');window._lzFavModal&&window._lzFavModal.hide();return false;" style="font-weight:bold;">' + cs + '</a>' +
        '<button type="button" onclick="return _lzRemoveFavorite(\'' + cs + '\');" title="Премахни от любими" style="border:1px solid #ccc;background:#fff;color:#b42318;border-radius:4px;padding:0.12rem 0.45rem;cursor:pointer;font-size:0.82rem;">Премахни</button>' +
      '</li>';
    });
    content += '</ul>';
  }

  content += '<hr style="margin:0.6rem 0;">';
  content += '<h3 style="margin:0 0 0.5rem 0;">🕐 Скорошно разгледани</h3>';
  if (recent.length === 0) {
    content += '<p style="color:#888;font-size:0.9em;">Все още не сте отваряли инфо прозорец на репитер.</p>';
  } else {
    content += '<ul style="margin:0;padding:0 0 0 1rem;">';
    recent.forEach(function(cs) {
      content += '<li><a href="#" onclick="searchLayers(\'' + cs + '\');window._lzFavModal&&window._lzFavModal.hide();return false;">' + cs + '</a></li>';
    });
    content += '</ul>';
  }

  return content;
}

function showFavoritesModal() {
  // Check if window is already open
  if (window._lzFavModal) {
    try {
      // Update the content with fresh data
      if (typeof window._lzFavModal.content === 'function') {
        window._lzFavModal.content(buildFavoritesModalContent());
      }
      window._lzFavModal.show();
    } catch(e) {}
    return;
  }
  window._lzFavModal = L.control.window(map, {
    title: 'Любими и скорошни',
    content: buildFavoritesModalContent(),
    maxWidth: 360,
  }).show();
}

// ── Azimuth + Distance ────────────────────────────────────────────────────────
function _lzBearing(lat1, lon1, lat2, lon2) {
  var toRad = Math.PI / 180;
  var dLon = (lon2 - lon1) * toRad;
  var y = Math.sin(dLon) * Math.cos(lat2 * toRad);
  var x = Math.cos(lat1 * toRad) * Math.sin(lat2 * toRad) -
          Math.sin(lat1 * toRad) * Math.cos(lat2 * toRad) * Math.cos(dLon);
  var brng = Math.atan2(y, x) * 180 / Math.PI;
  return (brng + 360) % 360;
}

function _lzBearingLabel(deg) {
  var dirs = ['С', 'СИ', 'И', 'ЮИ', 'Ю', 'ЮЗ', 'З', 'СЗ'];
  return dirs[Math.round(deg / 45) % 8];
}

function _lzDistKm(lat1, lon1, lat2, lon2) {
  var R = 6371;
  var toRad = Math.PI / 180;
  var dLat = (lat2 - lat1) * toRad;
  var dLon = (lon2 - lon1) * toRad;
  var a = Math.sin(dLat/2)*Math.sin(dLat/2) +
          Math.cos(lat1*toRad)*Math.cos(lat2*toRad)*Math.sin(dLon/2)*Math.sin(dLon/2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

async function doAlert(force = false) {
  // Check if alert window is already open - reuse it regardless of force
  if (window._lzAlertWindow) {
    try { window._lzAlertWindow.show(); } catch(e) {}
    return;
  }
  if (!siteChangelogPromise && typeof fetch === 'function') {
    fetchSiteChangelog();
  }
  if (siteChangelogPromise) {
    try {
      await siteChangelogPromise;
    } catch (err) {
      // handled via siteChangelogError
    }
  }
  var siteVersion = new Date(document.lastModified).toISOString().slice(0, 10);

  // Use combined key so the alert appears when either site or DB changes
  var versionKey = siteVersion + '|' + (dbLastUpdate || '');
  var stored = localStorage.getItem("lastAlertVersion") || "";

  if (stored !== versionKey || force) {
    if (!localStorage.getItem('lz_onboarding_v1') && !force) {
      showOnboarding();
      return;
    }
    var content = "";
    content += "Последно обновяване на сайта: " + siteVersion + "<br>";
    if (dbLastUpdate) {
      content += "Последно обновяване на базата: " + dbLastUpdate + "<br>";
    }
    content +=
      "Източник на данни: <a href='https://api.varna.radio' target='_blank'>API</a> (<a href='https://api.varna.radio/bgreps.js' target='_blank'>JS библиотека</a>).<br><br>";
    content += "Картата се поддържа и разработва от Димитър, LZ2DMV. Проектът е в <a href='https://github.com/LZ2DMV/lz.free.bg' target='_blank'>GitHub</a>.<br>";
    content +=
      "За актуализиране на информацията, отворете желания репитър на картата и изберете иконката с моливчето от горния ляв ъгъл. За добавяне на нов репитър, следвайте стъпките <a href='https://repeaters.varna.radio/#/request' target='_blank'>тук</a>.<br>"
    content +="За контакт с администраторите: m (маймунка) mitko (точка) xyz (за LZ2DMV) " +
      "или <a href='https://0xaf.org/about/' target='_blank'>LZ2SLL</a>.<br>";
    content +=
      "Забележка: Приемната (RX) и предавателната (TX) честота на всички ретранслатори са посочени от перспективата на вашето радио, а не от тази на ретранслатора!<br><br>";

    if (dbChangelog && typeof dbChangelog === 'object') {
      content += "Последни промени в базата с репитри:<br>";
      content += "<textarea style='width: 99%; height: 10rem;'>";
      for (const [date, arr] of Object.entries(dbChangelog)) {
        content += date + ":\r\n";
        (arr || []).forEach((l) => {
          content += "    - " + l + "\r\n";
        });
        content += "\r\n";
      }
      content += "</textarea>";
    } else {
      content += "<i>Списъкът с промени в базата не е наличен в момента.</i>";
    }

    content += "<br>История на промените (сайт):<br>" + getSiteChangelogMarkup();

    window._lzAlertWindow = L.control
      .window(map, {
        title: "Добре дошли!",
        content: content,
      })
      .show();

    localStorage.setItem("lastAlertVersion", versionKey);
  }
}

function showQuickHelp() {
  // Check if help window is already open
  if (window._lzHelpWindow) {
    try { window._lzHelpWindow.show(); } catch(e) {}
    return;
  }
  var content = '';
  content += '<h3 style="margin:0 0 0.5rem 0;">Бърза проверка</h3>';
  content += '<ol style="margin:0 0 0.8rem 1.1rem; padding:0;">';
  content += '<li>Постави габърчето на твоята позиция (влачене, координати или бутон за текуща локация).</li>';
  content += '<li>Избери репитер от картата или чрез търсачката - линията на видимост (LOS) се зарежда автоматично.</li>';
  content += '</ol>';

  content += '<h3 style="margin:0.4rem 0 0.4rem 0;">Инструменти</h3>';
  content += '<ul style="margin:0 0 0.8rem 1.1rem; padding:0;">';
  content += '<li><b>Габърче:</b> определя твоята точка за LOS и списъка с най-близки репитери.</li>';
  content += '<li><b>LOS:</b> показва профил на терена спрямо релефа и процента блокирана видимост между пинчето и репитера.</li>';
  content += '<li><b>Търсене:</b> работи по позивна, място, канал, RX/TX.</li>';
  content += '<li><b>Филтри:</b> в долния десен панел показваш/скриваш репитри по режими (FM, DMR, D-Star и др.).</li>';
  content += '</ul>';

  content += '<h3 style="margin:0.4rem 0 0.4rem 0;">Как се чете LOS</h3>';
  content += '<ul style="margin:0 0 0 1.1rem; padding:0;">';
  content += '<li>Процентът над графиката показва колко от трасето е блокирано.</li>';
  content += '<li>Цветове на процента: зелено (&lt;30%), оранжево (30–50%), червено (&gt;50%).</li>';
  content += '<li>Бутонът <b>i</b> до процента показва/скрива легендата.</li>';
  content += '</ul>';

  content += '<p style="margin-top:1rem; text-align:center;">';
  content += '<a href="#" onclick="_obOpenFromHelp(); return false;" style="font-size:0.9em;">🎓 Покажи урока отново</a>';
  content += '</p>';

  var _helpWindow = L.control.window(map, {
    title: 'Помощ',
    content: content,
    maxWidth: 520,
  }).show();
  window._lzHelpWindow = _helpWindow;
}

function _obOpenFromHelp() {
  if (window._lzHelpWindow) {
    try { window._lzHelpWindow.hide(); } catch(e) {}
    window._lzHelpWindow = null;
  }
  // Ensure any existing onboarding window is properly closed
  if (_obWindow) {
    try { _obWindow.hide(); } catch(e) {}
    _obWindow = null;
  }
  showOnboarding();
}

function buildOnboardingHTML() {
  var total = 4;
  var s = '<div class="ob-container">';

  // Slide 1
  s += '<div class="ob-slide" id="ob-slide-1">';
  s += '<div class="ob-icon">🗺️</div>';
  s += '<h3 class="ob-title">Добре дошли!</h3>';
  s += '<p>Тази карта показва всички активни аналогови и цифрови УКВ репитери на територията на България.</p>';
  s += '<p>Можете да изчислите <b>линията на видимост (LOS)</b> между вашата позиция и всеки репитер, базирано на особеностите на релефа.</p>';
  s += '<p>Следващите стъпки ще ви запознаят с основните функции.</p>';
  s += '</div>';

  // Slide 2
  s += '<div class="ob-slide" id="ob-slide-2" style="display:none">';
  s += '<div class="ob-icon"><img src="img/pin.png" style="width:32px;height:32px;vertical-align:middle;"></div>';
  s += '<h3 class="ob-title">Вашата позиция</h3>';
  s += '<p>Червеното <b>габърче</b> на картата маркира вашата позиция (QTH).</p>';
  s += '<ul class="ob-list">';
  s += '<li>Влачете го до желаното място</li>';
  s += '<li>Кликнете върху него и въведете координати ръчно</li>';
  s += '<li>Или натиснете бутона <i class="fa-solid fa-location-crosshairs"></i> в инфо прозореца за автоматична геолокация</li>';
  s += '</ul>';
  s += '<p class="ob-note">Позицията се запомня между сесиите.</p>';
  s += '</div>';

  // Slide 3
  s += '<div class="ob-slide" id="ob-slide-3" style="display:none">';
  s += '<div class="ob-icon">📡</div>';
  s += '<h3 class="ob-title">Избор на репитер</h3>';
  s += '<p>Кликнете върху маркер на репитер на картата - автоматично се зареждат:</p>';
  s += '<ul class="ob-list">';
  s += '<li>Детайли (честоти, режим, CTCSS…)</li>';
  s += '<li>LOS (линия на видимост) спрямо вашето габърче</li>';
  s += '<li>Прогнозно покритие на репитера върху картата</li>';
  s += '<li>📏 Разстояние и 🧭 азимут до репитера (изчислени автоматично)</li>';
  s += '</ul>';
  s += '<p>Натиснете ☆ до името на репитера, за да го добавите към <b>любими</b>.</p>';
  s += '<p class="ob-note"><i class="fa-solid fa-pencil-alt"></i> Моливчето (горе вляво в инфо прозореца) отваря форма за корекция на данните.</p>';
  s += '</div>';

  // Slide 4
  s += '<div class="ob-slide" id="ob-slide-4" style="display:none">';
  s += '<div class="ob-icon">🔍</div>';
  s += '<h3 class="ob-title">Търсачка, карти, любими и CHIRP</h3>';
  s += '<p><b>Търсачка</b> <img src="img/search_icon.png" style="width:16px;height:16px;vertical-align:middle;"> (горе вдясно): търси по позивна, честота, канал или място - напр. „LZ0PUB", „145.775", „R7", „RU48", „Варна".</p>';
  s += '<ul class="ob-list">';
  s += '<li>Бутонът <i class="fa-solid fa-star"></i> отваря любимите и скорошно разгледаните репитери</li>';
  s += '<li>Селекторът с пластове (горе вдясно) превключва между видовете карта: улична, топографска, сателитна и др.</li>';
  s += '<li>Панелът долу вдясно показва/скрива типове репитери: аналог, DMR, D-STAR, Fusion, NXDN…</li>';
  s += '<li>„Изтегли CSV формат съвместим с CHIRP" генерира файл за програмиране на радиостанция</li>';
  s += '</ul>';
  s += '</div>';

  // Navigation
  s += '<div class="ob-nav">';
  s += '<button class="ob-btn" id="ob-prev" style="visibility:hidden">&#8592; Предишен</button>';
  s += '<span class="ob-step-indicator" id="ob-indicator">1 / ' + total + '</span>';
  s += '<div class="ob-nav-right">';
  s += '<button class="ob-btn ob-btn-skip" id="ob-skip">Пропусни</button>';
  s += '<button class="ob-btn ob-btn-primary" id="ob-next">Следващ &#8594;</button>';
  s += '</div>';
  s += '</div>';

  s += '</div>';
  return s;
}

var _obWindow = null;
var _obCurrentSlide = 1;
var _obTotal = 4;

function _obGoToSlide(n) {
  var prev = document.getElementById('ob-slide-' + _obCurrentSlide);
  var next = document.getElementById('ob-slide-' + n);
  if (prev) prev.style.display = 'none';
  if (next) next.style.display = 'block';
  _obCurrentSlide = n;

  var indicator = document.getElementById('ob-indicator');
  if (indicator) indicator.textContent = n + ' / ' + _obTotal;

  var prevBtn = document.getElementById('ob-prev');
  var nextBtn = document.getElementById('ob-next');
  var skipBtn = document.getElementById('ob-skip');

  if (prevBtn) prevBtn.style.visibility = n === 1 ? 'hidden' : 'visible';
  if (nextBtn) nextBtn.innerHTML = n === _obTotal ? 'Готово ✓' : 'Следващ &#8594;';
  if (skipBtn) skipBtn.style.display = n === _obTotal ? 'none' : 'inline-block';
}

function _obClose() {
  localStorage.setItem('lz_onboarding_v1', '1');
  if (_obWindow) {
    try { _obWindow.hide(); } catch(e) {}
    _obWindow = null;
  }
  // Show info/changelog modal if the user hasn't seen it yet
  doAlert(false);
}

function showOnboarding() {
  // Clean up any old onboarding elements that might still be in the DOM
  var oldContainer = document.querySelector('.ob-container');
  if (oldContainer && oldContainer.parentNode) {
    oldContainer.parentNode.removeChild(oldContainer);
  }
  
  _obCurrentSlide = 1;
  _obWindow = L.control.window(map, {
    title: 'Добре дошли! 👋',
    content: buildOnboardingHTML(),
    maxWidth: 520,
  }).show();

  // Wait a tick for the window to render, then attach listeners
  setTimeout(function() {
    var nextBtn = document.getElementById('ob-next');
    var prevBtn = document.getElementById('ob-prev');
    var skipBtn = document.getElementById('ob-skip');

    if (nextBtn) {
      nextBtn.onclick = function(e) {
        e.preventDefault();
        if (_obCurrentSlide < _obTotal) {
          _obGoToSlide(_obCurrentSlide + 1);
        } else {
          _obClose();
        }
        return false;
      };
    }
    if (prevBtn) {
      prevBtn.onclick = function(e) {
        e.preventDefault();
        if (_obCurrentSlide > 1) {
          _obGoToSlide(_obCurrentSlide - 1);
        }
        return false;
      };
    }
    if (skipBtn) {
      skipBtn.onclick = function(e) {
        e.preventDefault();
        _obClose();
        return false;
      };
    }
  }, 10);
}

async function downloadCSV(mode) {
  try {
    await api.downloadChirpCsv({ mode });
  } catch (err) {
    console.error('Неуспешно генериране на CSV файл:', err);
    alert('Неуспешно генериране на CSV файл. Моля, опитайте отново.');
  }
}

let sidebarActive = false;
let activeForNearbyNodes = false;

var map = L.map("map", {
  // closePopupOnClick: false
}).setView([42.7249925, 25.4833039], 8);

var _baseAttribution = '&copy; <a href="https://osm.org/copyright">OpenStreetMap</a> contributors ' +
  '| Инфо от <a href="http://repeaters.bg" target="_blank">repeaters.bg</a>, <a href="https://repeaters.lz1ny.net/" target="_blank">repeaters.lz1ny.net</a> и др. ' +
  '| <a href="https://paypal.me/dimitarmilkov" target="_blank">Дарение</a> ' +
  '| <a href="#" onclick="doAlert(true);">Контакт</a>';

var _tileLayers = {
  'OpenStreetMap': L.tileLayer('https://{s}.tile.osm.org/{z}/{x}/{y}.png', {
    attribution: _baseAttribution, maxZoom: 19
  }),
  'OpenTopoMap': L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
    attribution: _baseAttribution + ' | &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (CC-BY-SA)', maxZoom: 17
  }),
  'Esri Сателит': L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    attribution: _baseAttribution + ' | Tiles &copy; Esri', maxZoom: 19
  }),
  'CartoDB Светла': L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    attribution: _baseAttribution + ' | &copy; <a href="https://carto.com/attributions">CARTO</a>', subdomains: 'abcd', maxZoom: 20
  }),
  'CartoDB Тъмна': L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: _baseAttribution + ' | &copy; <a href="https://carto.com/attributions">CARTO</a>', subdomains: 'abcd', maxZoom: 20
  }),
  'CartoDB Voyager': L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
    attribution: _baseAttribution + ' | &copy; <a href="https://carto.com/attributions">CARTO</a>', subdomains: 'abcd', maxZoom: 20
  }),
};

var _savedTileKey = localStorage.getItem('lz_tile_layer') || 'OpenStreetMap';
if (!_tileLayers[_savedTileKey]) _savedTileKey = 'OpenStreetMap';
_tileLayers[_savedTileKey].addTo(map);

var _layerControl = L.control.layers(_tileLayers, null, { position: 'topright', collapsed: true });

map.on('baselayerchange', function(e) {
  try { localStorage.setItem('lz_tile_layer', e.name); } catch(_) {}
});

// LZ2DMV: We don't want the user to move the map too far away from where the markers are,
// so we lock the map to its boundaries after it has been fully loaded, but with a bit of
// buffer on the edges to ensure all the markers and their balloons fit nicely.

let bounds = map.getBounds();
let isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
let paddingFactorLat = 0.8; // Padding factor for top and bottom (latitude)
let paddingFactorLng = isMobile ? 1.2 : 0.5; // Padding factor for left and right (longitude)

let southWest = bounds.getSouthWest();
let northEast = bounds.getNorthEast();

let latDiff = northEast.lat - southWest.lat;
let lngDiff = northEast.lng - southWest.lng;

let newSouthWest = L.latLng(southWest.lat - latDiff * paddingFactorLat, southWest.lng - lngDiff * paddingFactorLng);
let newNorthEast = L.latLng(northEast.lat + latDiff * paddingFactorLat, northEast.lng + lngDiff * paddingFactorLng);

let expandedBounds = L.latLngBounds(newSouthWest, newNorthEast);
map.setMaxBounds(expandedBounds);

// LZ2DMV: Zooming too far away also doesn't make sense.

map.setMinZoom(map.getBoundsZoom(expandedBounds));

var geoButton = L.easyButton({
  states: [{
    stateName: "default",
    icon: "fa-map-marker",
    onClick: getLocation,
    title: "Покажи репитрите около мен",
  },
  {
    stateName: "wait",
    icon: "fa fa-spinner fa-spin",
    title: "Покажи репитрите около мен",
  },
  ],
}).addTo(map);

L.easyButton(
  "fa-th",
  function () {
    window.open('https://repeaters.varna.radio/', '_blank');
  },
  "Таблица с репитри, добавяне на нов репитър"
).addTo(map);

L.easyButton(
  "fa-star",
  function () {
    showFavoritesModal();
  },
  "Любими и скорошно разгледани репитери"
).addTo(map);

L.easyButton(
  "fa-info",
  function () {
    doAlert(true);
  },
  "Информация"
).addTo(map);

L.easyButton(
  "fa-graduation-cap",
  function () {
    showQuickHelp();
  },
  "Помощ: как да използвам инструментите"
).addTo(map);

var sidebar = L.control.sidebar("sidebar", {
  position: "left",
});

map.addControl(sidebar);

map.createPane("general");

var markers = L.markerClusterGroup({
  spiderfyDistanceMultiplier: 4,
  iconCreateFunction: function (cluster) {
    var childCount = cluster.getChildCount();

    var c = " marker-cluster-";
    if (childCount < 5) {
      c += "small";
    } else if (childCount < 10) {
      c += "medium";
    } else {
      c += "large";
    }

    return new L.DivIcon({
      html: "<div><span><b>" + childCount + "</b></span></div>",
      className: "marker-cluster" + c,
      iconSize: new L.Point(40, 40),
    });
  },
});

const out = L.markerClusterGroup();
map.addLayer(out);

var HomeIcon = L.icon({
  iconUrl: "img/home.png",
  iconSize: [24, 24],
});

var PinIcon = L.icon({
  iconUrl: "img/pin.png",
  iconSize: [32, 32],
});

var draggablePin = L.marker(
  new L.LatLng(
    localStorage.getItem("lastPinLat") || 42.779,
    localStorage.getItem("lastPinLon") || 28.356), {
  draggable: true,
  icon: PinIcon,
  zIndexOffset: 500,
}
).addTo(map);

function ensureAtLeastOneRepTypeSelected() {
  // LZ2DMV: If the pin is dragged, but we have no markers on the map due to the filtering
  // of repeater types, we need to enable all repeater types, so that the markers are displayed.
  const allTypes = Object.keys(repTypeEnabled);
  const noneSelected = allTypes.every(type => !repTypeEnabled[type]);
  if (noneSelected) {
    allTypes.forEach(type => {
      repTypeEnabled[type] = true;
      const cb = document.querySelector(`input[type="checkbox"][data-type="${type}"]`);
      if (cb && !cb.checked) cb.checked = true;
    });
    saveRepTypeEnabled();
    refreshMarkers();
  }
}

function movePinAndHandlePosition(lat, lon) {
  ensureAtLeastOneRepTypeSelected();
  draggablePin.setLatLng([lat, lon]);
  var position = {
    coords: {
      latitude: lat,
      longitude: lon,
    },
  };
  handlePosition(position, true);
}

function getPinPopupContent(latlng) {
  return "" +
    "<div style='min-width:230px;'>" +
      "<p style='margin:0 0 6px 0;'><b>1)</b> Постави габърчето на твоята позиция.</p>" +
      "<p style='margin:0 0 10px 0; font-size:0.92em;'>" +
        "<b>2)</b> Отвори репитер - линията на видимост (LOS) се зарежда автоматично." +
      "</p>" +
      "<div style='display:flex; gap:6px; align-items:center; flex-wrap:nowrap;'>" +
        "<button id='pin-geolocate-btn' type='button' title='Вземи текущата ми локация'><i class='fa-solid fa-location-crosshairs'></i></button>" +
        "<input id='pin-lat-input' type='number' step='any' value='" + String(latlng.lat) + "' title='Latitude' placeholder='lat' style='width:88px;'>" +
        "<input id='pin-lon-input' type='number' step='any' value='" + String(latlng.lng) + "' title='Longitude' placeholder='lon' style='width:88px;'>" +
        "<button id='pin-apply-btn' type='button' title='Потвърди координатите' style='color:#15803d;'><i class='fa-solid fa-check'></i></button>" +
      "</div>" +
      "<div id='pin-popup-error' style='margin-top:6px; color:#b00020; font-size:0.9em;'></div>" +
    "</div>";
}

function attachPinPopupHandlers() {
  const latInput = document.getElementById('pin-lat-input');
  const lonInput = document.getElementById('pin-lon-input');
  const applyBtn = document.getElementById('pin-apply-btn');
  const geolocateBtn = document.getElementById('pin-geolocate-btn');
  const errorEl = document.getElementById('pin-popup-error');
  if (!latInput || !lonInput || !applyBtn || !geolocateBtn || !errorEl) return;

  const refreshPopupAfterMove = function () {
    draggablePin.setPopupContent(getPinPopupContent(draggablePin.getLatLng()));
    setTimeout(attachPinPopupHandlers, 0);
  };

  const parseCoordinateValue = function (raw) {
    const normalized = String(raw || '').trim().replace(',', '.');
    return Number(normalized);
  };

  const apply = function () {
    const lat = parseCoordinateValue(latInput.value);
    const lon = parseCoordinateValue(lonInput.value);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      errorEl.textContent = 'Моля, въведи валидни числа за lat/lon (пример: 42.6977 или 42,6977).';
      return;
    }
    if (lat < -90 || lat > 90) {
      errorEl.textContent = 'Latitude трябва да е между -90 и 90.';
      return;
    }
    if (lon < -180 || lon > 180) {
      errorEl.textContent = 'Longitude трябва да е между -180 и 180.';
      return;
    }
    errorEl.textContent = '';
    movePinAndHandlePosition(lat, lon);
    refreshPopupAfterMove();
  };

  applyBtn.onclick = apply;
  geolocateBtn.onclick = function () {
    if (!navigator.geolocation) {
      errorEl.textContent = 'Браузърът не поддържа геолокация.';
      return;
    }
    errorEl.textContent = 'Опит за вземане на текуща локация...';
    navigator.geolocation.getCurrentPosition(
      function (position) {
        const lat = Number(position.coords.latitude);
        const lon = Number(position.coords.longitude);
        latInput.value = String(lat);
        lonInput.value = String(lon);
        errorEl.textContent = '';
        movePinAndHandlePosition(lat, lon);
        refreshPopupAfterMove();
      },
      function () {
        errorEl.textContent = 'Неуспешно вземане на локацията. Провери разрешенията на браузъра.';
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  };
  latInput.onkeydown = function (e) {
    if (e.key === 'Enter') apply();
  };
  lonInput.onkeydown = function (e) {
    if (e.key === 'Enter') apply();
  };
}

draggablePin.bindPopup(function () {
  return getPinPopupContent(draggablePin.getLatLng());
});

draggablePin.on('popupopen', function () {
  attachPinPopupHandlers();
});

draggablePin.on("dragend", function () {
  const ll = draggablePin.getLatLng();
  movePinAndHandlePosition(ll.lat, ll.lng);
});

map.addLayer(markers);

let mapClickStartedWithOpenPopup = false;
map.on("mousedown", function () {
  mapClickStartedWithOpenPopup = !!document.querySelector(".leaflet-popup");
});

function doOverlay(image, LatStart, LngStart, LatEnd, LngEnd) {
  var bounds = new L.LatLngBounds(
    new L.LatLng(LatStart, LngStart),
    new L.LatLng(LatEnd, LngEnd)
  );

  var overlay = new L.ImageOverlay(image, bounds, {
    pane: "general",
  });
  return overlay;
}


function removeOverlay(force = false) {
  if ((force || (sidebarActive !== true && activeForNearbyNodes !== true)) && window.overlay) {
    map.removeLayer(window.overlay);
    window.overlay = null;
  }
}

markers.on("popupopen", function (e) {
  // Always replace previous coverage when a new repeater is selected.
  removeOverlay(true);
  if (sidebar.isVisible() && activeForNearbyNodes === false) {
    sidebar.hide();
  }
  activeMarker = e.popup._source;
  const repOpen = reps.find((r) => r._marker === activeMarker);
  debugFilterState(repOpen, 'popupopen:before-move-to-out');
  const popupContent = e.popup.getContent();
  const parser = new DOMParser();
  const doc = parser.parseFromString(popupContent, "text/html");
  const terrainContainer = doc.querySelector('.terrain-profile-link-container');
  if (terrainContainer) {
    const link = terrainContainer.querySelector('.terrain-profile-link');
    const comment = terrainContainer.querySelector('.terrain-profile-comment');
    if (link) link.style.display = '';
    if (comment) comment.style.display = '';
  }
  var b = e.layer.boundary;

  if (b) {
    var image = b[0];
    var LatStart = b[1];
    var LngStart = b[2];
    var LatEnd = b[3];
    var LngEnd = b[4];
    var overlay = doOverlay(image, LatStart, LngStart, LatEnd, LngEnd);
    const m = e.popup._source;

    markers.removeLayer(m);
    out.addLayer(m);
    debugFilterState(repOpen, 'popupopen:after-move-to-out');
    m.openPopup();
    map.addLayer(overlay);
    window.overlay = overlay;
  } else {
    const m = e.popup._source;
    markers.removeLayer(m);
    out.addLayer(m);
    debugFilterState(repOpen, 'popupopen:after-move-to-out-no-coverage');
    m.openPopup();
  }

  // Auto-generate terrain profile (deferred so popup DOM is fully rendered)
  if (repOpen && typeof generateTerrainProfile === 'function') {
    setTimeout(() => generateTerrainProfile(repOpen.callsign), 0);
  }

  // Track recent + inject distance/azimuth
  if (repOpen) {
    _lzAddRecent(repOpen.callsign);
    setTimeout(function() {
      var titleLinks = document.querySelector('#lz-dist-' + repOpen.callsign);
      if (titleLinks) return; // already injected
      var pin = draggablePin.getLatLng();
      var distKm = _lzDistKm(pin.lat, pin.lng, repOpen.latitude, repOpen.longitude);
      var bearing = _lzBearing(pin.lat, pin.lng, repOpen.latitude, repOpen.longitude);
      var label = _lzBearingLabel(bearing);
      var html = '<span id="lz-dist-' + repOpen.callsign + '" style="font-size:0.82em;color:#555;">' +
        '📏 ' + distKm.toFixed(1) + ' km &nbsp;|&nbsp; 🧭 ' + Math.round(bearing) + '° ' + label +
        '</span>';
      var titleLinksEl = document.querySelector('.leaflet-popup-content .title-links');
      if (titleLinksEl) titleLinksEl.insertAdjacentHTML('afterend', html);
    }, 0);
  }
});

out.on("popupclose", function (e) {
  var m = e.popup._source;
  out.removeLayer(m);
  const rep = reps.find((r) => r._marker === m);
  debugFilterState(rep, 'popupclose:before-return');
  if (isMarkerTypeEnabled(rep)) {
    markers.addLayer(m);
  }
  debugFilterState(rep, 'popupclose:after-return');
  m.closePopup();
});

// AF: when popup is opened, the cluster is unspiderfied, so we re-spiderfy it again
markers.on("unspiderfied", function (a) {
  a.markers.forEach(function (m) {
    if (m.isPopupOpen()) a.cluster.spiderfy();
  });
});

function searchLayers(name) {
  var found = false;
  let rep = reps.find(r => r.callsign.toUpperCase() === name.toUpperCase());
  let marker = rep && rep._marker;

  let isVisible = marker && markers.hasLayer(marker);

  if (rep && marker && !isVisible) {
    let changed = false;
    rep.modesArray.forEach(type => {
      if (!repTypeEnabled[type]) {
        repTypeEnabled[type] = true;
        let cb = document.querySelector(`input[type="checkbox"][data-type="${type}"]`);
        if (cb && !cb.checked) {
          cb.checked = true;
        }
        changed = true;
      }
    });
    if (changed) {
      debugFilterState(rep, 'searchLayers:enabled-types-before-refresh');
      refreshMarkers();
    }
  }

  markers.eachLayer(function (layer) {
    if (layer.name.toUpperCase() == name.toUpperCase()) {
      markers.zoomToShowLayer(layer, function () {
        layer.openPopup();
      });
      found = true;
    }
  });

  if (!found) {
    alert("Няма такъв ретранслатор на картата!");
  }
}

let home;

function clearHomeIfExists() {
  if (home) {
    map.removeLayer(home);
    home = undefined;
  }
}

function setSidebar() {
  if (activeForNearbyNodes === true) {
    map.closePopup();
  }
  sidebarActive = true;
  var popup = activeMarker.getPopup();
  var c = popup.getContent();
  var parser = new DOMParser();
  var el = parser.parseFromString(c, "text/html");
  el.querySelectorAll(".remove-for-sidebar").forEach((e) =>
    e.parentNode.removeChild(e)
  );
  var reptitle = el.querySelector(".reptitle");
  if (reptitle) {
    var terrainContainer = reptitle.querySelector('.terrain-profile-link-container');
    if (terrainContainer) {
      terrainContainer.style.textAlign = 'left';
      terrainContainer.style.marginTop = '0.5em';
      var comment = terrainContainer.querySelector('.terrain-profile-comment');
      if (comment) {
        comment.style.textAlign = 'left';
        comment.style.marginTop = '2px';
      }
    }
    var pencil = reptitle.querySelector('a[href^="https://repeaters.varna.radio/#/request?callsign="]');
    if (pencil) {
      pencil.parentNode.removeChild(pencil);
    }
    var fav = reptitle.querySelector('a[id^="lz-fav-btn-"]');
    if (fav) {
      fav.parentNode.removeChild(fav);
    }
  }
  var result = reptitle ? reptitle.innerHTML : '';
  sidebar.setContent("<p>" + result + "</p>");
  sidebar.show();
}

sidebar.on("show", function () {
  map.closePopup();
  const sidebarContent = sidebar.options.content;
  if (sidebarContent) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(sidebarContent, "text/html");
    const terrainContainer = doc.querySelector('.terrain-profile-link-container');
    if (terrainContainer) {
      const link = terrainContainer.querySelector('.terrain-profile-link');
      const comment = terrainContainer.querySelector('.terrain-profile-comment');
      if (link) link.style.display = '';
      if (comment) comment.style.display = '';
    }
  }
});

sidebar.on("hide", function () {
  sidebarActive = false;
  activeForNearbyNodes = false;
  clearHomeIfExists();
  removeOverlay();
});

map.on("click", function () {
  if (!mapClickStartedWithOpenPopup) {
    removeOverlay(true);
  }
  mapClickStartedWithOpenPopup = false;
  if (sidebar.isVisible()) {
    sidebar.hide();
  }
});

function getLocation() {
  geoButton.state("wait");
  geoButton.disable();
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(handlePosition, handleError);
  } else {
    alert(
      "Вашият браузър не поддържа услуги за локация!\nПроверете настройките му или го обновете."
    );
  }
}

let rotatingInfoInterval;

function handlePosition(position, fromPin) {
  geoButton.state("default");
  geoButton.enable();
  var currentPosition = L.latLng(
    position.coords.latitude,
    position.coords.longitude
  );
  var closestPoints = L.GeometryUtil.nClosestLayers(
    map,
    markers.getLayers(),
    currentPosition,
    5
  );
  var nodesList = "<h3>Най-близките ретранслатори до вас:</h3>";
  var c = 1;

  window.handleLayerClick = function (layerName) {
    if (window.overlay) {
      map.removeLayer(window.overlay);
    }
    window.overlay = null;
    map.closePopup();
    searchLayers(layerName);
  };

  for (var i = 0; i < closestPoints.length; i++) {
    let locDesc = closestPoints[i].layer.options.title;
    locDesc = locDesc.substring(locDesc.indexOf(" - ") + 2);
    const distance =
      closestPoints[i].layer
        .getLatLng()
        .distanceTo(currentPosition)
        .toFixed(0) / 1000;

    let rep = reps.find(r => r.callsign === closestPoints[i].layer.name);

    let modeLabel = rep.modesArray.map(m => {
      let t = repTypes.find(rt => rt.key === m);
      return t ? t.label : m.toUpperCase();
    }).join("+");

    let modesSup = `
        <span class="rep-modes-sup rotating-info"
            data-mode="${modeLabel}"
            data-tx="${rep.tx}"
            data-rx="${rep.rx}"
            data-state="0"
            ${rep.tone ? `data-tone="${rep.tone}"` : ""}
        >${modeLabel}</span>
    `;

    nodesList +=
      c +
      `. <a href='#' onclick='handleLayerClick("${closestPoints[i].layer.name}")'><b>` +
      closestPoints[i].layer.name +
      `</b></a>, ` +
      locDesc +
      "<i><b> (" +
      distance.toFixed(2) +
      " км)</i></b>" +
      (modesSup ? " " + modesSup : "") +
      "<br/>";
    c++;
  }

  if (rotatingInfoInterval) {
    clearInterval(rotatingInfoInterval);
  }
  rotatingInfoInterval = setInterval(() => {
    document.querySelectorAll('.rotating-info').forEach(el => {
      const hasTone = el.hasAttribute('data-tone') && el.dataset.tone && el.dataset.tone !== '';
      const maxState = 4;
      let state = parseInt(el.getAttribute('data-state') || '0');
      let nextState = (state + 1) % maxState;
      el.setAttribute('data-state', nextState);

      switch (nextState) {
        case 0:
          el.textContent = el.dataset.mode;
          break;
        case 1:
          el.innerHTML = `<span class="dot dot-green"></span>${el.dataset.rx} MHz`;
          break;
        case 2:
          el.innerHTML = `<span class="dot dot-red"></span>${el.dataset.tx} MHz`;
          break;
        case 3:
          el.innerHTML = `<span class="fa-solid fa-lock dot padlock-dot"></span> ` +
            (hasTone ? `${el.dataset.tone} Hz` : 'няма тон');
          break;
      }
    });
  }, 2000);

  nodesList +=
    "<br /><hr><i>Вашите координати: " +
    position.coords.latitude.toFixed(5) +
    ", " +
    position.coords.longitude.toFixed(5) +
    "</i>";

  if (!fromPin) {
    nodesList +=
      "<br/><div style='display:flex; justify-content:space-between; align-items:center; margin-top:8px; margin-bottom:4px;'>" +
      "<a href='#' id='move-pin-btn' style='text-decoration:none;'><img src='img/pin.png' width='24' height='24' style='vertical-align:middle;'> Сложи габърчето тук</a>" +
      "<a href='#' id='copy-link-btn' style='text-decoration:none; margin-left:12px;'><i class='fa-solid fa-link'></i> Вземи линк</a>" +
      "</div>";
  } else {
    nodesList +=
      "<br/><div style='display:flex; justify-content:flex-end; align-items:center; margin-top:8px; margin-bottom:4px;'>" +
      "<a href='#' id='copy-link-btn' style='text-decoration:none;'><i class='fa-solid fa-link'></i> Вземи линк</a>" +
      "</div>";
  }

  //if (typeof home == 'undefined') {
  clearHomeIfExists();

  if (!fromPin) {
    //navigator.vibrate([100, 100, 150]);
    home = L.marker(currentPosition, {
      icon: HomeIcon,
    }).addTo(map);
    home.bindTooltip("Твоето местоположение");
    map.setView(currentPosition, 25);
  } else {
    map.setView(currentPosition, map.getZoom());
    nodesList = nodesList.replace(
      "<hr>",
      '<hr><img src="img/pin.png" width="25" height="25">'
    );
    try {
      localStorage.setItem("lastPinLat", position.coords.latitude);
      localStorage.setItem("lastPinLon", position.coords.longitude);
    } catch (e) {
      alert('Браузърът няма достъп до localStorage, проверете настройките!');
    }
  }
  /*} else {
  map.setView(home.getLatLng(), 25);
  }*/

  sidebar.setContent(nodesList);
  activeForNearbyNodes = true;
  sidebar.show();

  setTimeout(() => {
    function attachCopyHandler() {
      const btn = document.getElementById('copy-link-btn');
      if (btn) {
        btn.onclick = function (e) {
          e.preventDefault();
          const url = location.origin + location.pathname + '?coords=' +
            position.coords.latitude.toFixed(5) + ',' +
            position.coords.longitude.toFixed(5);
          navigator.clipboard.writeText(url).then(() => {
            btn.outerHTML = "<span class='copied-label' id='copied-label'>Копирано!</span>";
            setTimeout(() => {
              const label = document.getElementById('copied-label');
              if (label) {
                label.classList.add('fade-out');
                setTimeout(() => {
                  label.outerHTML = "<a href='#' id='copy-link-btn' style='text-decoration:none; float: right;'><i class='fa-solid fa-link'></i> Вземи линк</a>";
                  attachCopyHandler();
                }, 300);
              }
            }, 600);
          });
        };
      }
    }
    attachCopyHandler();
  }, 100);

  function attachPinHandler() {
    const btn = document.getElementById('move-pin-btn');
    if (btn) {
      btn.onclick = function(e) {
        e.preventDefault();
        draggablePin.setLatLng([position.coords.latitude, position.coords.longitude]);
        localStorage.setItem("lastPinLat", position.coords.latitude);
        localStorage.setItem("lastPinLon", position.coords.longitude);
      };
    }
  }
  attachPinHandler();
}

function handleError(error) {
  if (error.code == error.PERMISSION_DENIED) {
    alert(
      "Моля, позволете на браузъра си да ни предостави текущата ви локация."
    );
  } else {
    alert("Възникна проблем с извличането на локацията.");
  }
  geoButton.state("default");
  geoButton.enable();
}

var url_string = window.location.href;
var url = new URL(url_string);
var callsign = url.searchParams.get("callsign");
var coords = url.searchParams.get("coords");

/*
 * SearchBox
 */
var formatedResults = null;
var searchbox = L.control
  .searchbox({
    position: "topright",
    expand: "left",
    width: "15em",
    autocompleteFeatures: ["setValueOnClick"],
  })
  .addTo(map);
_layerControl.addTo(map);

setTimeout(() => {
  const searchInput = document.querySelector('.leaflet-searchbox');
  if (searchInput) {
    searchInput.setAttribute('placeholder', 'Позивна, място, канал, RX/TX...');
    searchInput.setAttribute('title', 'Пример: LZ0PUB, Варна, 145.775');
  }
}, 0);

searchbox.onInput("keyup", function (e) {
  if (e.keyCode == 13) {
    search();
  } else {
    var value = searchbox.getValue();
    if (value != "") {
      var results = fuseSearch.search(value);
      if (results.length) {
        formatedResults = results.map(
          (res) =>
            `📡 | ${res.item.callsign} | ${res.item.place || ''} | RX:${res.item.rx} | TX:${res.item.tx} | ${res.item.modesArray.map(m => m.toUpperCase()).join('+')}`
        );
        searchbox.setItems(formatedResults);
      } else {
        formatedResults = [];
        searchbox.setItems(['Няма резултати']);
      }
    } else {
      searchbox.clearItems();
      formatedResults = null;
    }
  }
});

searchbox.onButton("click", search);
searchbox.onAutocomplete("click", search);

function search() {
  var value = searchbox.getValue();
  if (value != "") {
    if (value === 'Няма резултати') {
      return;
    }
    if (value.includes("📡 |")) {
      searchLayers(value.split("|")[1].trim());
    } else {
      if (formatedResults && formatedResults.length) {
        searchLayers(formatedResults[0].split("|")[1].trim());
      }
    }
  }
  setTimeout(function () {
    searchbox.hide();
    searchbox.clear();
  }, 600);
}

markers.on('clustermouseover', function (e) {
  const cluster = e.layer;
  const childMarkers = cluster.getAllChildMarkers();
  const callsigns = childMarkers.map(m => m.name).join(', ');
  const clusterIcon = cluster._icon;
  if (clusterIcon) {
    clusterIcon.setAttribute('title', callsigns);
  }
});

markers.on('clustermouseout', function (e) {
  const cluster = e.layer;
  const clusterIcon = cluster._icon;
  if (clusterIcon) {
    clusterIcon.removeAttribute('title');
  }
});
//&&

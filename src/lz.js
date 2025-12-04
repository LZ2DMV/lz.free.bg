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
// Disable HeyWhatsThat contour tiles overlay by default to avoid API blocking
// Toggle to true manually in console or code if needed in the future.
window.LZ_ENABLE_CONTOURS_OVERLAY = false;

// Helpers migrated from old reps.js
function getChannelFromMHz(rxMHz) {
  const f = parseFloat(rxMHz).toFixed(4) * 10000;
  let chan = "N/A";
  if (f >= 1452000 && f < 1454000 && (f - 1452000) % 250 == 0) { // VHF R8-R15
    chan = 'R' + parseInt(((f - 1452000) / 250) + 8);
  } else if (f >= 1456000 && f < 1460000 && (f - 1456000) % 250 == 0) { // VHF R0-R7
    chan = 'R' + parseInt((f - 1456000) / 250);
  } else if (f >= 4300000 && f < 4400000 && (f - 4300000) % 125 == 0) { // UHF
    chan = 'RU' + ((f - 4300000) / 125).toFixed(0).padStart(3, '0');
  }
  if (f >= 1450000 && f < 1460000 && (f - 1450000) % 125 == 0)
    chan = (chan === 'N/A' ? '' : chan + ', ') + 'RV' + ((f - 1450000) / 125).toFixed(0).padStart(2, '0');
  return chan;
}

function getFormatedFreqMHz(f) {
  let fstr = parseFloat(f).toFixed(4).toString();
  let r = fstr.charAt(fstr.length - 1) === '0' ? parseFloat(f).toFixed(3) : parseFloat(f).toFixed(4);
  return r;
}

function mapAPIModesToInternal(modes) {
  const map = { fm: 'analog', fm_analog: 'analog', analog: 'analog', usb: 'analog', lsb: 'analog', dmr: 'dmr', dstar: 'dstar', ysf: 'fusion', fusion: 'fusion', parrot: 'parrot', nxdn: 'nxdn' };
  const out = {};
  const isEnabled = (val) => {
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
  };
  if (modes && typeof modes === 'object') {
    Object.keys(modes).forEach(k => {
      if (isEnabled(modes[k])) out[map[k] || k] = true;
    });
  }
  return out;
}

function mapAPIRepeater(r) {
  const rxMHz = r && r.freq && r.freq.tx ? (r.freq.tx / 1e6) : undefined;
  const txMHz = r && r.freq && r.freq.rx ? (r.freq.rx / 1e6) : undefined;
  const tone = r && r.freq ? (r.freq.tone || r.freq.ctcss || undefined) : undefined;
  const modeObj = mapAPIModesToInternal(r.modes || {});
  const modesArray = Object.keys(modeObj).sort();
  const band = typeof rxMHz === 'number' && !isNaN(rxMHz) ? (rxMHz > 146 ? 'UHF' : 'VHF') : 'VHF';
  const infoVal = r.info;
  const infoArr = Array.isArray(infoVal) ? infoVal : (typeof infoVal === 'string' && infoVal !== '' ? [infoVal] : []);
  const infoHTML = infoArr.join('<br>');
  const infoString = infoArr.join("\r\n").replace(/<[^>]+>/gm, '');
  const coverage = r.coverage || r.coverage_map || null;
  const echolink = r.internet && r.internet.echolink ? r.internet.echolink : (r.echolink || 0);
  const zello = r.internet && r.internet.zello ? r.internet.zello : (r.zello || null);
  const allstarlink = r.internet && r.internet.allstarlink ? r.internet.allstarlink : (r.allstarlink || 0);
  return {
    callsign: r.callsign,
    location: (r.place || '') + (r.place_extra ? (' - ' + r.place_extra) : ''),
    loc: r.place || '',
    locExtra: r.place_extra || '',
    info: infoArr,
    infoHTML,
    infoString,
    qth: r.qth || '',
    keeper: r.keeper || '',
    altitude: parseInt(r.altitude) || 0,
    lat: r.latitude,
    lon: r.longitude,
    mode: modeObj,
    modesArray,
    modesString: modesArray.join(', '),
    rx: rxMHz !== undefined ? getFormatedFreqMHz(rxMHz) : 0,
    tx: txMHz !== undefined ? getFormatedFreqMHz(txMHz) : 0,
    channel: (r && r.freq && r.freq.channel) ? r.freq.channel : (rxMHz !== undefined ? getChannelFromMHz(rxMHz) : 'N/A'),
    tone: tone,
    band,
    coverage: coverage,
    echolink: echolink,
    zello: zello,
    allstarlink: allstarlink,
  };
}

const isLocal = false; //location.hostname === 'localhost';
const api = new BGRepeaters({
  baseURL: isLocal ? 'http://localhost:8787/v1' : 'https://api.varna.radio/v1'
});

async function loadFromAPI() {
  // API no longer requires filters; fetch full list
  const list = await api.getRepeaters();
  return (list || []).filter(r => !r.disabled).map(mapAPIRepeater);
}

(async function initLoad() {
  try {
    reps = await loadFromAPI();
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
      markers.clearLayers();
      reps.forEach(r => {
        const marker = r._marker;
        if (!marker) return;
        if (r.modesArray.some(t => repTypeEnabled[t])) {
          markers.addLayer(marker);
        }
      });
      var el = document.getElementById("active-marker-count");
      if (el) el.textContent = markers.getLayers().length;
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
  var terrainProfileLink =
    '<div class="terrain-profile-link-container" style="width: 100%; text-align: center;">' +
    `<a href="#" class="terrain-profile-link" title="Генерирай профил на терена" onclick="generateTerrainProfile('${r.callsign}');return false;">Генерирай профил на терена</a>` +
    '<div class="terrain-profile-comment">от тук до поставеното габърче</div>' +
    `<div id='terrain-profile-${r.callsign}' style='width: 100%; text-align: center;'></div>` +
    '</div>';

  var title =
    '<div class="reptitle">' +
    '<div style="float: left">' +
    '<a href="#" class="remove-for-sidebar" title="Отвори в странична лента" onclick="setSidebar();"><i class="fa-solid fa-window-restore"></i></a>' +
    "</div>" +
    '<h2><a href = "?callsign=' +
    r.callsign +
    '" title = "вземи директен линк за този репитър" target = "_blank" > ' +
    r.callsign +
    "</a></h2 > " +
    '<div class="title-links">' +
    "<b>" +
    r.location +
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
    (r.altitude ? "Надморска височина: <b>" + r.altitude + "</b> м<br>" : "") +
    "QTH: <b>" +
    r.qth +
    "</b><br>" +
    (r.echolink ? "Echolink #: <b>" + r.echolink + "</b><br>" : "") +
    (r.allstarlink ? "AllStarLink Node: <b>" + r.allstarlink + "</b><br>" : "") +
    (r.zello ? "Zello: <b>" + r.zello + "</b><br>" : "") +
    "<hr>" +
    r.infoHTML +
    "</div>";

  var marker = L.marker(new L.LatLng(r.lat, r.lon), {
    title: r.callsign + " - " + r.loc,
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
  r.modesArray.forEach(type => {
    if (repMarkersByType[type]) repMarkersByType[type].push(marker);
  });
  markers.addLayer(marker);
  repsAll += 1;
  if (r.modesArray.includes("analog") || r.modesArray.includes("usb") || r.modesArray.includes("lsb")) repsFM += 1;
  if (r.modesArray.includes("dstar")) repsDStar += 1;
  if (r.modesArray.includes("dmr")) repsDMR += 1;
  if (r.modesArray.includes("fusion")) repsYSF += 1;
  if (r.modesArray.includes("nxdn")) repsNXDN += 1;
  if (r.modesArray.includes("parrot")) repsParrot += 1;
  r._marker = marker;
}

function generateTerrainProfile(callsign) {
  const rep = reps.find(r => r.callsign === callsign);
  if (!rep) {
    alert('Не е намерен репитър: ' + callsign);
    return;
  }

  const pinCoords = {
    lat: draggablePin.getLatLng().lat,
    lon: draggablePin.getLatLng().lng,
  };

  const container = document.getElementById('terrain-profile-' + callsign);
  if (container) {
    const parent = container.parentElement;
    if (parent) {
      const link = parent.querySelector('.terrain-profile-link');
      const comment = parent.querySelector('.terrain-profile-comment');
      if (link) link.style.display = 'none';
      if (comment) comment.style.display = 'none';
    }
    container.innerHTML = 'Генериране от ' + callsign + ' (' + rep.lat.toFixed(4) + ', ' + rep.lon.toFixed(4) + ') до габърчето (' + pinCoords.lat.toFixed(4) + ', ' + pinCoords.lon.toFixed(4) + ')...';
  }

  function getTerrainProfileImage(node1, node2) {
    const lineColour = 'FF0000';
    const node1MarkerColour = 'FF3366';
    const node2MarkerColour = 'FF3366';
    const node1Latitude = node1.lat;
    const node1Longitude = node1.lon;
    const node2Latitude = node2.lat;
    const node2Longitude = node2.lon;
    const node1ElevationMSL = (rep.altitude ? rep.altitude : '');
    const node2ElevationMSL = '';
    const websiteDomain = 'lz.free.bg';

    const params = new URLSearchParams({
      src: websiteDomain,
      axes: 1,
      metric: 1,
      curvature: 1,
      greatcircle: 1,
      refraction: '',
      exaggeration: '',
      groundrelative: '',
      los: 1,
      freq: parseInt(rep.rx, 10),
      width: 1600,
      height: 500,
      pt0: `${node1Latitude},${node1Longitude},${lineColour},${node1ElevationMSL},${node1MarkerColour}`,
      pt1: `${node2Latitude},${node2Longitude},${lineColour},${node2ElevationMSL},${node2MarkerColour}`,
    });

    return 'https://heywhatsthat.com/bin/profile-0904.cgi?' + params.toString();
  }

  try {
    const terrainImageUrl = getTerrainProfileImage({ lat: rep.lat, lon: rep.lon }, pinCoords);
    if (container) {
      const alt = `Профил на терена между ${callsign} и габърчето`;
      container.innerHTML = `
        <a href="${terrainImageUrl}" target="_blank">
          <img src="${terrainImageUrl}"
               alt="${alt}"
               loading="lazy" decoding="async" referrerpolicy="no-referrer"
               style="width: 100%; height: auto; max-width: 500px; border: 1px solid #dee2e6; border-radius: 0.375rem;"
               onerror="this.parentElement.innerHTML='<' + 'div class=\\'text-muted\\'>Неуспешно зареждане на профила на терена</div>'">
        </a>
        <div class="terrain-profile-credit">Изображение от <a href="https://www.heywhatsthat.com/" target="_blank">HeyWhatsThat.com</a></div>
      `;
    }
  } catch (e) {
    if (container) {
      container.innerHTML = '<div class="text-danger">Възникна грешка при генериране на профила на терена.</div>';
    }
    console.error('Грешка при генериране на профила на терена:', e);
  }
}

const repTypes = [
  { key: "analog", label: "Analog/FM", color: "color-rep-analog" },
  { key: "usb", label: "Analog/USB", color: "color-rep-analog" },
  { key: "lsb", label: "Analog/LSB", color: "color-rep-analog" },
  { key: "dstar", label: "D-Star", color: "color-rep-dstar" },
  { key: "dmr", label: "DMR", color: "color-rep-dmr" },
  { key: "fusion", label: "Fusion", color: "color-rep-fusion" },
  { key: "nxdn", label: "NXDN", color: "color-rep-nxdn" },
  { key: "parrot", label: "Parrot", color: "color-rep-parrot" },
];

let repTypeEnabled = {
  analog: true,
  usb: true,
  lsb: true,
  dstar: true,
  dmr: true,
  fusion: true,
  nxdn: true,
  parrot: true,
};

let repMarkersByType = {
  analog: [],
  usb: [],
  lsb: [],
  dstar: [],
  dmr: [],
  fusion: [],
  nxdn: [],
  parrot: [],
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
              <input type="checkbox" ${repTypeEnabled.analog ? "checked" : ""} data-type="analog" onchange="onRepTypeFilterChange(event)">
            </td>
            <td class="color-rep-analog">Analog/FM/USB/LSB</td>
            <td align="center"><b class="color-rep-analog">${repsFM}</b></td>
            <td align="right">
              <button type="button" title="Изтегли CSV формат съвместим с CHIRP" onClick="downloadCSV('analog');" class="csv-button analog">
                <i class="fa-solid fa-download"></i>
              </button>
            </td>
          </tr>
          <tr>
            <td>
              <input type="checkbox" ${repTypeEnabled.dstar ? "checked" : ""} data-type="dstar" onchange="onRepTypeFilterChange(event)">
            </td>
            <td class="color-rep-dstar">D-Star</td>
            <td align="center"><b class="color-rep-dstar">${repsDStar}</b></td>
            <td align="right">
              <button type="button" title="Изтегли CSV формат съвместим с CHIRP" onClick="downloadCSV('dstar');" class="csv-button dstar">
                <i class="fa-solid fa-download"></i>
              </button>
            </td>
          </tr>
          <tr>
            <td>
              <input type="checkbox" ${repTypeEnabled.dmr ? "checked" : ""} data-type="dmr" onchange="onRepTypeFilterChange(event)">
            </td>
            <td class="color-rep-dmr">DMR</td>
            <td align="center"><b class="color-rep-dmr">${repsDMR}</b></td>
            <td align="right">
              <button type="button" title="Изтегли CSV формат съвместим с CHIRP" onClick="downloadCSV('dmr');" class="csv-button dmr">
                <i class="fa-solid fa-download"></i>
              </button>
            </td>
          </tr>
          <tr>
            <td>
              <input type="checkbox" ${repTypeEnabled.fusion ? "checked" : ""} data-type="fusion" onchange="onRepTypeFilterChange(event)">
            </td>
            <td class="color-rep-fusion">Fusion</td>
            <td align="center"><b class="color-rep-fusion">${repsYSF}</b></td>
            <td align="right">
              <button type="button" title="Изтегли CSV формат съвместим с CHIRP" onClick="downloadCSV('fusion');" class="csv-button fusion">
                <i class="fa-solid fa-download"></i>
              </button>
            </td>
          </tr>
          <tr>
            <td>
              <input type="checkbox" ${repTypeEnabled.nxdn ? "checked" : ""} data-type="nxdn" onchange="onRepTypeFilterChange(event)">
            </td>
            <td class="color-rep-nxdn">NXDN</td>
            <td align="center"><b class="color-rep-nxdn">${repsNXDN}</b></td>
            <td align="right">
              <button type="button" title="Изтегли CSV формат съвместим с CHIRP" onClick="downloadCSV('nxdn');" class="csv-button nxdn">
                <i class="fa-solid fa-download"></i>
              </button>
            </td>
          </tr>
          <tr>
            <td>
              <input type="checkbox" ${repTypeEnabled.parrot ? "checked" : ""} data-type="parrot" onchange="onRepTypeFilterChange(event)">
            </td>
            <td class="color-rep-parrot">Parrot</td>
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
  saveRepTypeEnabled();
  markers.clearLayers();
  reps.forEach(r => {
    const marker = r._marker;
    if (!marker) return;
    if (r.modesArray.some(t => repTypeEnabled[t])) {
      markers.addLayer(marker);
    }
  });
  var el = document.getElementById("active-marker-count");
  if (el) el.textContent = markers.getLayers().length;
};

function updateFuseSearch() {
  fuseSearch = new Fuse(reps, {
    keys: ["shortCallsign", "callsign", "loc", "locExtra", "rx", "tx", "channel"],
    shouldSort: true,
    threshold: 0.0,
    location: 0,
    distance: 0,
  });
}

function doAlert(force = false) {
  if (location.protocol === "https:" || location.hostname === "localhost") {
    var lastModified = new Date(document.lastModified);
    var siteVersion =
      lastModified.getFullYear() +
      "-" +
      ("0" + (lastModified.getMonth() + 1)).slice(-2) +
      "-" +
      ("0" + lastModified.getDate()).slice(-2);

    // Use combined key so the alert appears when either site or DB changes
    var versionKey = siteVersion + '|' + (dbLastUpdate || '');
    var stored = localStorage.getItem("lastAlertVersion") || "";

    if (stored !== versionKey || force) {
      var content = "";
      content += "Последно обновяване на сайта: " + siteVersion + "<br>";
      if (dbLastUpdate) {
        content += "Последно обновяване на базата: " + dbLastUpdate + "<br>";
      }
      content +=
        "Източник на данни: <a href='https://api.varna.radio/v1' target='_blank'>API</a> (<a href='https://api.varna.radio/bgreps.js' target='_blank'>JS библиотека</a>).<br><br>";
      content += "Картата се поддържа и разработва от Димитър, LZ2DMV.<br>";
      content +=
        "За контакт и актуализиране на информация: m (маймунка) mitko (точка) xyz " +
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

      var modal = L.control
        .window(map, {
          title: "Добре дошли!",
          content: content,
        })
        .show();

      localStorage.setItem("lastAlertVersion", versionKey);
    }
  }
}

function downloadCSV(mode) {
  var fn = "CHIRP_repeaters_" + mode + ".csv";

  function exportFile(fileName, rawData, opts = {}) {
    function clean(link) {
      // allow time for iOS
      setTimeout(() => {
        window.URL.revokeObjectURL(link.href);
      }, 10000);

      link.remove();
    }

    const {
      mimeType,
      byteOrderMark,
      encoding
    } =
      typeof opts === "string" ? {
        mimeType: opts,
      } :
        opts;

    const data =
      encoding !== void 0 ?
        new TextEncoder(encoding).encode([rawData]) :
        rawData;
    const blobData = byteOrderMark !== void 0 ? [byteOrderMark, data] : [data];
    const blob = new Blob(blobData, {
      type: mimeType || "application/octet-stream",
    });
    const link = document.createElement("a");

    link.href = window.URL.createObjectURL(blob);
    link.setAttribute("download", fileName);

    // Check for "download" attribute support;
    // If not supported, open this in new window
    if (typeof link.download === "undefined") {
      link.setAttribute("target", "_blank");
    }

    link.classList.add("hidden");
    link.style.position = "fixed"; // avoid scrolling to bottom
    document.body.appendChild(link);

    try {
      link.click();
      clean(link);
      return true;
    } catch (err) {
      clean(link);
      return err;
    }
  }

  function filterRepeaters(reps) {
    var filtered = reps.filter((r) => {
      var show = false;
      if (mode === "all" || r.mode[mode]) show = true;
      if (r.mode.ssb && mode == "analog") show = true;
      return show;
    }).map((r) => {
      let duplex = r.tx - r.rx < 0 ? "-" : r.tx - r.rx > 0 ? "+" : "";
      let offset = Math.abs(r.tx - r.rx);
      if (Math.abs(r.tx - r.rx) > 8) {
        duplex = "split";
        offset = r.tx;
      }
      let csvTone = r.tone || 79.7;
      let csvMode = r.mode.analog || r.mode.parrot ? "FM" : r.mode.dmr ? "DMR" : "Auto";
      let comment =
        (r.channel !== "N/A" ? "Chan: " + r.channel + "\r\n" : "") +
        "Modes: " +
        r.modesArray.join("+") +
        "\r\n" +
        r.location +
        "\r\n" +
        r.infoString;
      return {
        index: 0,
        callsign: r.callsign,
        rx: r.rx,
        duplex: duplex,
        offset: offset,
        tone: r.tone,
        csvTone: csvTone,
        csvMode: csvMode,
        comment: comment,
      };
    });

    filtered.forEach((r, idx) => {
      r.index = idx;
    });

    return filtered;
  }

  var output = csv_stringify_sync.stringify(filterRepeaters(reps), {
    header: true,
    bom: true,
    record_delimiter: '\r\n',
    columns: [{
      key: "index",
      header: "Location",
    },
    {
      key: "callsign",
      header: "Name",
    },
    {
      key: "rx",
      header: "Frequency",
    },
    {
      key: "duplex",
      header: "Duplex",
    },
    {
      key: "offset",
      header: "Offset",
    },
    {
      key: "tone",
      header: "Tone",
    },
    {
      key: "csvTone",
      header: "rToneFreq",
    },
    {
      key: "csvTone",
      header: "cToneFreq",
    },
    {
      key: "csvMode",
      header: "Mode",
    },
    {
      key: "comment",
      header: "Comment",
    },
    ],
    cast: {
      object: (val, ctx) => {
        if (ctx.column == "mode") {
          return {
            value: "FM",
          };
        }
      },
      number: (val, ctx) => {
        if (ctx.column === "index")
          return {
            value: "" + parseInt(val),
          };
        if (ctx.column === "tone" || ctx.column === "csvTone") {
          if (ctx.index == 5) {
            return {
              value: val ? "TSQL" : "",
            };
          }
          if (ctx.index == 6 || ctx.index == 7) {
            return {
              value: val ? val.toFixed(1) : parseFloat("79.7").toFixed(1),
            };
          }
        }
        return {
          value: val.toFixed(6),
        };
      },
      string: (val, ctx) => {
        return (ctx.column === "comment") ? val.replace(/\r?\n/g, ', ').replace(/,?\s*$/, '') : val;
      },
    },
  });
  const status = exportFile(fn, output, "text/csv");
}

sidebarActive = false;
activeForNearbyNodes = false;

var map = L.map("map", {
  // closePopupOnClick: false
}).setView([42.7249925, 25.4833039], 8);

L.tileLayer("https://{s}.tile.osm.org/{z}/{x}/{y}.png", {
  attribution: '&copy; <a href="https://osm.org/copyright">OpenStreetMap</a> contributors ' +
    '| Инфо от <a href="http://repeaters.bg" target="_blank">repeaters.bg</a>, <a href="https://repeaters.lz1ny.net/" target="_blank">repeaters.lz1ny.net</a> и др. ' +
    '| <a href="https://paypal.me/dimitarmilkov" target="_blank">Дарение</a> ' +
    // '| <a href="https://forms.gle/qxetZjuKpmapVvCz9" target="_blank">Изпрати информация</a> ' +
    '| <a href="#" onclick="doAlert(true);">Контакт</a>',
}).addTo(map);

// LZ2DMV: We don't want the user to move the map too far away from where the markers are,
// so we lock the map to its boundaries after it has been fully loaded, but with a bit of
// buffer on the edges to ensure all the markers and their balloons fit nicely.

let bounds = map.getBounds();
let isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
let paddingFactorLat = 0.5; // Padding factor for top and bottom (latitude)
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
  "fa-history",
  function () {
    window.open("changelog.txt", "_blank", "width=600, height=300");
    doAlert(true);
  },
  "История на промените"
).addTo(map);

L.easyButton(
  "fa-info",
  function () {
    doAlert(true);
  },
  "Информация"
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

draggablePin.bindPopup(
  "<p>Влачи това габърче до мястото," +
  " за което искаш да видиш най-близките ретранслатори наоколо.</p>"
);

draggablePin.on("dragend", function () {
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
    markers.clearLayers();
    reps.forEach(r => {
      const marker = r._marker;
      if (!marker) return;
      if (r.modesArray.some(t => repTypeEnabled[t])) {
        markers.addLayer(marker);
      }
    });
    const el = document.getElementById("active-marker-count");
    if (el) el.textContent = markers.getLayers().length;
  }
  var position = {
    coords: {
      latitude: draggablePin.getLatLng().lat,
      longitude: draggablePin.getLatLng().lng,
    },
  };
  handlePosition(position, true);
});

map.addLayer(markers);

function doOverlay(image, LatStart, LngStart, LatEnd, LngEnd) {
  if (!window.overlay) {
    var bounds = new L.LatLngBounds(
      new L.LatLng(LatStart, LngStart),
      new L.LatLng(LatEnd, LngEnd)
    );

    var overlay = new L.ImageOverlay(image, bounds, {
      pane: "general",
    });
    return overlay;
  }
}

// Create a HeyWhatsThat contour tile overlay as a Leaflet TileLayer
function createContoursOverlay(options = {}) {
  // const websiteDomain = (window.location && window.location.hostname) ? window.location.hostname : 'lz.free.bg';
  const websiteDomain = 'lz.free.bg';
  const color = options.color || '83422580'; // semi-transparent brown (RRGGBBAA)

  function defaultIntervalForZoom(z) {
    // Per docs: minimums (m): 0-4:200, 5-7:80, 8:40, 9:20, 10-13:8, 14:4, 15:2, 16+:0.8
    // Use ~4x minimum as a safe, visually reasonable default.
    let min;
    if (z <= 4) min = 200;
    else if (z <= 7) min = 80;
    else if (z === 8) min = 40;
    else if (z === 9) min = 20;
    else if (z <= 13) min = 8;
    else if (z === 14) min = 4;
    else if (z === 15) min = 2;
    else min = 0.8;
    const val = Math.max(1, Math.round(min * 4));
    return options.interval || val;
  }

  const layer = L.tileLayer('', {
    pane: 'general',
    opacity: 1,
    tileSize: 256,
    attribution: 'Contours © HeyWhatsThat.com',
  });

  layer.getTileUrl = function (coords) {
    const z = coords.z;
    const interval = defaultIntervalForZoom(z);
    const x = coords.x;
    const y = coords.y;
    return `https://contour.heywhatsthat.com/bin/contour_tiles.cgi?zoom=${z}&x=${x}&y=${y}&color=${color}&interval=${interval}&src=${encodeURIComponent(websiteDomain)}`;
  };

  return layer;
}

function removeOverlay() {
  if (sidebarActive !== true && activeForNearbyNodes !== true) {
    if (window.overlay) {
      map.removeLayer(overlay);
      window.overlay = null;
    }
  }
}

markers.on("popupopen", function (e) {
  if (sidebar.isVisible() && activeForNearbyNodes === false) {
    sidebar.hide();
  }
  activeMarker = e.popup._source;
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

    // AF: fix a stale coverage overlay, when the popup is auto-closed
    m.on("remove", function (p) {
      // map.closePopup();
      // m.closePopup();
      // p.target.togglePopup();
      // p.target.closePopup();
      removeOverlay();
      // console.log(p.target)
    });

    markers.removeLayer(m);
    out.addLayer(m);
    m.openPopup();
    map.addLayer(overlay);
    window.overlay = overlay;
  } else {
    // No RF coverage image available; fall back to HeyWhatsThat contour tiles overlay
    if (!window.LZ_ENABLE_CONTOURS_OVERLAY) {
      // Contours overlay globally disabled
      return;
    }
    if (window._contoursSuppressed) {
      return; // Avoid repeated attempts if previously blocked/failed
    }
    var overlay = createContoursOverlay({});
    const m = e.popup._source;

    // Ensure overlay is cleaned up if the marker is removed
    m.on("remove", function (p) {
      removeOverlay();
    });

    // If tiles fail to load (blocked or server error), remove the overlay to avoid repeated errors
    overlay.on('tileerror', function(ev) {
      if (!window._contoursSuppressed) {
        console.debug('Contours unavailable or blocked; suppressing further attempts. First failure at z=' + ev.coords.z + ' x=' + ev.coords.x + ' y=' + ev.coords.y);
      }
      window._contoursSuppressed = true;
      if (!window._contoursNoteShown) {
        window._contoursNoteShown = true;
        try {
          const note = document.createElement('div');
          note.id = 'contours-note';
          note.setAttribute('role', 'status');
          note.style.cssText = [
            'position:fixed',
            'left:12px',
            'bottom:12px',
            'z-index:10000',
            'max-width:84vw',
            'background:rgba(42,42,45,0.95)',
            'color:#eee',
            'padding:8px 12px',
            'border-radius:6px',
            'font: 13px/1.4 -apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica,Arial,sans-serif',
            'box-shadow:0 2px 10px rgba(0,0,0,0.25)'
          ].join(';');
          note.innerHTML = "<strong>Слой с контури не е наличен</strong> — услугата на HeyWhatsThat е временно недостъпна или блокирана. Показваме само основната карта. <a href='https://www.heywhatsthat.com/' target='_blank' style='color:#8ecae6;text-decoration:underline'>Повече</a> <button type='button' aria-label='Затвори' style='margin-left:10px;background:transparent;border:none;color:#aaa;cursor:pointer;font-size:14px'>×</button>";
          const btn = note.querySelector('button');
          btn.onclick = () => note.remove();
          document.body.appendChild(note);
          setTimeout(() => { try { note.remove(); } catch (_) {} }, 6000);
        } catch (__) { /* no-op */ }
      }
      if (window.overlay) {
        try { map.removeLayer(window.overlay); } catch (_) {}
        window.overlay = null;
      }
    });

    markers.removeLayer(m);
    out.addLayer(m);
    m.openPopup();
    map.addLayer(overlay);
    window.overlay = overlay;
  }
});

markers.on("popupclose", removeOverlay);

out.on("popupclose", function (e) {
  removeOverlay();
  var m = e.popup._source;
  out.removeLayer(m);
  markers.addLayer(m);
  m.closePopup();
});

// AF: when popup is opened, the cluster is unspiderfied, so we re-spiderfy it again
markers.on("unspiderfied", function (a) {
  a.markers.forEach(function (m) {
    if (m.isPopupOpen()) a.cluster.spiderfy();
  });
});

// map.on('moveend zoomend', function (e) {
//   bounds = map.getBounds();
//   var zoom = map.getZoom();
//   if (zoom > 16) {
//     console.log('zoomed enough');
//     markers.eachLayer(function (layer) {
//       if (bounds.contains(layer.getLatLng())) {
//         markersDisplayed = true;
//         layer.openPopup();
//         layer.spiderfy();
//       }
//     });
//   } else if (markersDisplayed) {
//     console.log('zoomed out enough');
//     markersDisplayed = false;
//     markers.eachLayer(function (layer) {
//       if (bounds.contains(layer.getLatLng())) {
//         layer.closePopup();
//       }
//     });
//   }
// });

// markers.on('clusterclick', function (e) {
//   bounds = map.getBounds();
//   var zoom = map.getZoom();
//   var childMarkers = e.layer.getAllChildMarkers();
//   if (zoom > 16) {
//     console.log('zoomed enough in cluster');
//     console.log(childMarkers);
//     childMarkers.forEach(function (layer) {
//       if (bounds.contains(layer.getLatLng())) {
//         markersDisplayed = true;
//         layer.openPopup();
//       }
//     });
//   }
// });

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
      markers.clearLayers();
      reps.forEach(r => {
        const m = r._marker;
        if (!m) return;
        if (r.modesArray.some(t => repTypeEnabled[t])) {
          markers.addLayer(m);
        }
      });
      var el = document.getElementById("active-marker-count");
      if (el) el.textContent = markers.getLayers().length;
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

function clearHomeIfExists() {
  if (typeof home !== "undefined") {
    map.removeLayer(home);
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

  for (var i = 0; i < closestPoints.length; i++) {
    locDesc = closestPoints[i].layer.options.title;
    locDesc = locDesc.substring(locDesc.indexOf(" - ") + 2);
    distance =
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

    window.handleLayerClick = function (layerName) {
      if (window.overlay) {
        map.removeLayer(overlay);
      }
      window.overlay = null;
      map.closePopup();
      searchLayers(layerName);
    };

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
    "<br/>QTH локатор: " +
    L.Maidenhead.latLngToIndex(
      parseFloat(position.coords.latitude.toFixed(5)),
      parseFloat(position.coords.longitude.toFixed(5)),
      6
    ).toUpperCase() +
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

searchbox.onInput("keyup", function (e) {
  if (e.keyCode == 13) {
    search();
  } else {
    var value = searchbox.getValue();
    if (value != "") {
      var results = fuseSearch.search(value);
      formatedResults = results.map(
        (res) =>
          `📡 | ${res.item.callsign} | ${res.item.loc} | RX:${res.item.rx} | TX:${res.item.tx} | ${res.item.modesArray.map(m => m.toUpperCase()).join('+')}`
      );
      searchbox.setItems(formatedResults);
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

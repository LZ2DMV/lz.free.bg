var repsAll = 0;
var repsFM = 0;
var repsDStar = 0;
var repsDMR = 0;
var repsYSF = 0;
var repsParrot = 0;
var reps = [];
var fuseSearch;

const repeaters = new Repeaters({
  warnings: true,
  debug: true,
});

repeaters.loadData().then(() => {
  reps = repeaters.get();
  if (reps.length) {
    reps.forEach((r) => {
      r.shortCallsign = r.callsign.substr(3);
      addRepeater(r);
    });
    addBottomBox();
    if (callsign) searchNode(callsign);
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
    fuseSearch = new Fuse(reps, {
      keys: ["shortCallsign", "callsign", "loc", "locExtra", "rx", "tx", "channel"],
      shouldSort: true,
      threshold: 0.0,
      location: 0,
      distance: 0,
    });
  }
  doAlert();
});

var addRepeater = function (r) {
  var title =
    '<div class="reptitle">' +
    '<div style="float: left">' +
    '<a href="#" class="remove-for-sidebar" title="отвори в странична лента" onclick="setSidebar();"><i class="fa-solid fa-arrow-left "></i></a>' +
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
    "</div><hr>" +
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
    (r.altitude ? "Надморска височина: <b>" + r.altitude + "</b>м<br>" : "") +
    "QTH: <b>" +
    r.qth +
    "</b><br>" +
    (r.echolink ? "Echolink #: <b>" + r.echolink + "</b><br>" : "") +
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
      // iconSize: new L.Point(256, 256)
    }),
  });
  marker.bindPopup(title, {
    // autoClose: false,
    // autoPan: false,
  });
  // marker.bindTooltip(r.callsign);
  marker.boundary = r.coverage ? r.coverage : null;
  marker.name = r.callsign;
  markers.addLayer(marker);
  repsAll += 1;
  if (r.modesArray.includes("analog")) repsFM += 1;
  if (r.modesArray.includes("dstar")) repsDStar += 1;
  if (r.modesArray.includes("dmr")) repsDMR += 1;
  if (r.modesArray.includes("fusion")) repsYSF += 1;
  if (r.modesArray.includes("parrot")) repsParrot += 1;
};

var addBottomBox = function () {
  // create bottom-right box with info
  var box = L.control({
    position: "bottomright",
  });
  box.onAdd = function (map) {
    var div = L.DomUtil.create("div", box);
    L.DomUtil.addClass(div, "bottom-box");
    div.innerHTML =
      '<table><tr><th colspan="3" class="color-rep-all">Ретранслатори</th></tr>' +
      "<tr>" +
      '<td class="color-rep-all">Всички</td>' +
      '<td align="center"><b class="color-rep-all">' +
      repsAll +
      "</b></td>" +
      '<td align="right">' +
      '<button type="button" title="Изтегли CSV формат съвместим с CHIRP" onClick="downloadCSV(\'all\');" class="csv-button all">' +
      '<i class="fa-solid fa-download"></i>' +
      "</button>" +
      "</td>" +
      "</tr>" +
      "<tr>" +
      '<td class="color-rep-analog">Analog/FM</td>' +
      '<td align="center"><b class="color-rep-analog">' +
      repsFM +
      "</b></td>" +
      '<td align="right">' +
      '<button type="button" title="Изтегли CSV формат съвместим с CHIRP" onClick="downloadCSV(\'analog\');" class="csv-button analog">' +
      '<i class="fa-solid fa-download"></i>' +
      "</button>" +
      "</td>" +
      "</tr>" +
      "<tr>" +
      '<td class="color-rep-dstar">D-Star</td>' +
      '<td align="center"><b class="color-rep-dstar">' +
      repsDStar +
      "</b></td>" +
      '<td align="right">' +
      '<button type="button" title="Изтегли CSV формат съвместим с CHIRP" onClick="downloadCSV(\'dstar\');" class="csv-button dstar">' +
      '<i class="fa-solid fa-download"></i>' +
      "</button>" +
      "</td>" +
      "</tr>" +
      "<tr>" +
      '<td class="color-rep-dmr">DMR</td>' +
      '<td align="center"><b class="color-rep-dmr">' +
      repsDMR +
      "</b></td>" +
      '<td align="right">' +
      '<button type="button" title="Изтегли CSV формат съвместим с CHIRP" onClick="downloadCSV(\'dmr\');" class="csv-button dmr">' +
      '<i class="fa-solid fa-download"></i>' +
      "</button>" +
      "</td>" +
      "</tr>" +
      "<tr>" +
      '<td class="color-rep-fusion">Fusion</td>' +
      '<td align="center"><b class="color-rep-fusion">' +
      repsYSF +
      "</b></td>" +
      '<td align="right">' +
      '<button type="button" title="Изтегли CSV формат съвместим с CHIRP" onClick="downloadCSV(\'fusion\');" class="csv-button fusion">' +
      '<i class="fa-solid fa-download"></i>' +
      "</button>" +
      "</td>" +
      "</tr>" +
      "<tr>" +
      '<td class="color-rep-parrot">Parrot</td>' +
      '<td align="center"><b class="color-rep-parrot">' +
      repsParrot +
      "</b></td>" +
      '<td align="right">' +
      '<button type="button" title="Изтегли CSV формат съвместим с CHIRP" onClick="downloadCSV(\'parrot\');" class="csv-button parrot">' +
      '<i class="fa-solid fa-download"></i>' +
      "</button>" +
      "</td>" +
      "</tr>" +
      "</table>";
    return div;
  };
  box.addTo(map);
};

function doAlert(force = false) {
  if (location.protocol === "https:" || location.hostname === "localhost") {
    var a = localStorage.getItem("lastDBUpdate") || "";

    if (a !== repeaters.lastUpdate() || force) {
      var lastModified = new Date(document.lastModified);
      lastModified =
        lastModified.getFullYear() +
        "-" +
        ("0" + (lastModified.getMonth() + 1)).slice(-2) +
        "-" +
        ("0" + lastModified.getDate()).slice(-2);

      var content = "";
      content += "Последно обновяване на сайта: " + lastModified + "<br>";
      content +=
        "Последно обновяване на базата: " + repeaters.lastUpdate() + "<br>";
      content += "Картата се поддържа и разработва от Димитър, LZ2DMV.<br>";
      content +=
        "За контакт и актуализиране на информация: m (маймунка) mitko (точка) xyz " +
        "или <a href='https://0xaf.org/about/' target='_blank'>LZ2SLL</a>.<br>";
      content +=
        "JSON база с ретранслаторите: <a href='https://varna.radio/reps.json' target='_blank'>https://varna.radio/reps.json</a> (<a href='https://varna.radio/reps.js' target='_blank'>JS Библиотека</a>).<br><br>";
      content +=
        "Забележка: Приемната (RX) и предавателната (TX) честота на всички ретранслатори са посочени от перспективата на вашето радио, а не от тази на ретранслатора!<br><br>";
      content += "Последни промени в базата с репитри:<br>";
      content += "<textarea style='width: 99%; height: 10rem;'>";
      for (const [date, arr] of Object.entries(repeaters.changelog())) {
        content += date + ":\r\n";
        arr.forEach((l) => {
          content += "    - " + l + "\r\n";
        });
        content += "\r\n";
      }
      content += "</textarea>";

      var modal = L.control
        .window(map, {
          title: "Добре дошли!",
          content: content,
        })
        .show();

      localStorage.setItem("lastDBUpdate", repeaters.lastUpdate());
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
    var filtered = JSON.parse(JSON.stringify(reps)).filter((r) => {
      // deep clone of array
      var show = false;
      delete r.coverage;
      r.duplex = r.tx - r.rx < 0 ? "-" : r.tx - r.rx > 0 ? "+" : "";
      r.offset = Math.abs(r.tx - r.rx);
      if (Math.abs(r.tx - r.rx) > 8) {
        r.duplex = "split";
        r.offset = r.tx;
      }
      r.csvTone = r.tone || 79.7;
      r.csvMode =
        r.mode.analog || r.mode.parrot ? "FM" : r.mode.dmr ? "DMR" : "Auto";
      r.comment =
        (r.channel !== "N/A" ? "Chan: " + r.channel + "\r\n" : "") +
        "Modes: " +
        r.modesArray.join("+") +
        "\r\n" +
        r.location +
        "\r\n" +
        r.infoString;
      if (mode === "all" || r.mode[mode]) show = true;
      if (r.mode.ssb && m == "analog") show = true;
      return show;
    });

    let index = 0;
    filtered.forEach((r) => {
      r.index = index++;
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
let paddingFactor = 0.5; // Add 50% padding at the edges

let southWest = bounds.getSouthWest();
let northEast = bounds.getNorthEast();

let latDiff = northEast.lat - southWest.lat;
let lngDiff = northEast.lng - southWest.lng;

let newSouthWest = L.latLng(southWest.lat - latDiff * paddingFactor, southWest.lng - lngDiff * paddingFactor);
let newNorthEast = L.latLng(northEast.lat + latDiff * paddingFactor, northEast.lng + lngDiff * paddingFactor);

let expandedBounds = L.latLngBounds(newSouthWest, newNorthEast);
map.setMaxBounds(expandedBounds);

// LZ2DMV: Zooming too far away also doesn't make sense.

map.setMinZoom(map.getBoundsZoom(expandedBounds));

// L.easyButton(
//   "fa-search",
//   function () {
//     searchNode();
//   },
//   "Търсене на репитер"
// ).addTo(map);

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

// function handleBox() {
//   var style = document.createElement('style');
//   style.type = 'text/css';
//   //прозрачни popup-и
//   style.innerHTML = '.leaflet-popup-content-wrapper { opacity: 0.2; }'+
//     '.leaflet-popup-tip-container { display: none; }';

//   head = document.getElementsByTagName('head')[0];

//   if(this.checked) {
//     head.appendChild(style);
//   } else {
//     head.removeChild(head.lastChild);
// 	}
// }

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
    //като свойство на прозореца за глобален достъп до обекта
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

function searchNode(callsign) {
  var cs = callsign ? callsign : window.prompt("Позивна на репитър:", "LZ0BOT");
  if (!cs) {
    alert("Необходима е позивна за търсене!");
    return;
  }
  searchLayers(cs);
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
  ); // remove the link to sidebar
  var result = el.querySelector(".reptitle").innerHTML;
  sidebar.setContent("<p>" + result + "</p>");
  //map.closePopup();
  sidebar.show();
}

sidebar.on("show", function () {
  map.closePopup();
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
    nodesList +=
      c +
      ". <a href='#' onclick='window.overlay && map.removeLayer(overlay); window.overlay=null; map.closePopup(); searchLayers(\"" +
      closestPoints[i].layer.name +
      "\");'><b>" +
      closestPoints[i].layer.name +
      "</b></a>, " +
      locDesc +
      "<i><b> (" +
      distance.toFixed(2) +
      " км)</i></b><br/>";
    c++;
  }

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
    "</i>" +
    "<br/><a href='?coords=" +
    position.coords.latitude.toFixed(5) +
    "," +
    position.coords.longitude.toFixed(5) +
    "' target='_blank' style='text-decoration:none; float: right;'><i class='fa-solid fa-link'></i> Вземи линк</a>";

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
    localStorage.setItem("lastPinLat", position.coords.latitude);
    localStorage.setItem("lastPinLon", position.coords.longitude);
  }
  /*} else {
  map.setView(home.getLatLng(), 25);
  }*/

  sidebar.setContent(nodesList);
  activeForNearbyNodes = true;
  sidebar.show();
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

function checkPersonInCharge(call) {
  alert("Отговорник: " + pic[call]);
}

// function contact() {
//   alert("Пишете на мейл m (маймунка) mitko (точка) xyz.");
// }

var url_string = window.location.href;
var url = new URL(url_string);
var callsign = url.searchParams.get("callsign");
var coords = url.searchParams.get("coords");

/*
markers.on('animationend', function (e) {
	removeOverlay();
	map.closePopup();
});
*/

//document.getElementById("box").addEventListener("click", handleBox, false);

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
        `📡 | ${res.item.callsign} | ${res.item.loc} | RX:${res.item.rx} | TX:${res.item.tx}`
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
//&&

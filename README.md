# lz.free.bg

Interactive map of the Bulgarian VHF and UHF amateur radio repeaters based on [OpenStreetMap](https://www.openstreetmap.org/), [Leaflet](https://github.com/Leaflet/Leaflet) and [Leaflet.markercluster](https://github.com/Leaflet/Leaflet.markercluster).

## Notes

Data source and client library

- Production data is served from the public API at <https://api.varna.radio/>
- The site consumes the API via the client library loaded from <https://api.varna.radio/bgreps.js>
- There is WEB interface to the repeaters DB at <https://repeaters.varna.radio>
- The app does not ship its own data; no data changes should be made in this repository. Please use the contact methods on the site for content updates.

Development notes

- The legacy JSON workflow (reps.json and an accompanying local client) has been retired. Any remaining historical files were moved to the `legacy/` folder and are not used at runtime.
- The map also integrates optional terrain features via HeyWhatsThat.com (terrain profile images and contour tiles) when available.

Contributions

PRs with code improvements, moderate refactoring or new features are welcome. Please avoid introducing a runtime dependency on local JSON data—API and library usage should remain the primary data path.

## Credits

The following people participated in the development of the project or helped in other ways:

- [Stanislav Lechev](https://github.com/0xAF), LZ2SLL
- Bozhko Todorov, LZ1BTO
- Hristo Stoyanov, LZ1KM

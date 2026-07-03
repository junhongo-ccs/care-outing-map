# Data

This directory contains source and processed data for the Care Outing Map PoC.

## Raw Data

### Tokyo Accessible Toilet Data

Directory:

- `data/raw/tokyo-accessible-toilets/`

Files:

- `public_facilities_accessible_toilets.csv`
- `railway_station_accessible_toilets.csv`

Source:

- https://catalog.data.metro.tokyo.lg.jp/dataset/t000054d0000000342
- https://www.opendata.metro.tokyo.lg.jp/fukushi/3_koukyoshisetsu_barieer_free_wc.csv
- https://www.opendata.metro.tokyo.lg.jp/fukushi/R0606/02/4_tonaitetsudoueki_barrier-free-wc.csv

Notes:

- Encoding: CP932
- Coordinate columns: `経度`, `緯度`
- The data includes toilet equipment attributes and photo URLs.
- Photo ZIP files are not stored in this repository for the MVP. The app can use photo URLs from the CSV.

### OpenStreetMap Ueno POIs

File:

- `data/raw/osm_ueno_pois_overpass.json`

Source:

- OpenStreetMap via Overpass API
- Query file: `data/raw/ueno_overpass_query.txt`

Query area:

- South: 35.705
- West: 139.770
- North: 35.723
- East: 139.785

Included POI types:

- Museums and galleries
- Parks
- Public toilets
- Libraries and arts centres

## Processed Data

Directory:

- `data/processed/`

Files:

- `tokyo_accessible_toilets.geojson`
- `ueno_accessible_toilets_1000m.geojson`
- `ueno_accessible_toilets_1500m.geojson`
- `osm_ueno_pois.geojson`
- `ueno_data_summary.json`

`tokyo_accessible_toilets.geojson` covers Tokyo-wide accessible toilet records with valid coordinates. The app loads this file and filters records by the selected outing area.

`ueno_accessible_toilets_1000m.geojson` and `ueno_accessible_toilets_1500m.geojson` are point GeoJSON files centered on Ueno Station:

- Ueno Station latitude: 35.713768
- Ueno Station longitude: 139.777254

Current processed counts:

- Tokyo-wide accessible toilets: 8,944
- Ueno 1km accessible toilets: 93
- Ueno 1.5km accessible toilets: 144
- Ueno OSM POIs: 90

## MVP Usage

Recommended first app data:

- Use `tokyo_accessible_toilets.geojson` for the main app.
- Use `osm_ueno_pois.geojson` for museums, parks, and surrounding outing context.
- Use `ueno_data_summary.json` for quick demo stats.

For a narrow Ueno fallback map, use `ueno_accessible_toilets_1000m.geojson` or `ueno_accessible_toilets_1500m.geojson`.

## License Notes

Check and preserve attribution for each source when displaying or redistributing data.

- Tokyo Open Data: follow the license and attribution terms from the Tokyo Open Data Catalog.
- OpenStreetMap: attribute OpenStreetMap contributors.

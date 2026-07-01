# Care Outing Map

「ケアを伴う外出」を支える3D GIS PoC。

車椅子の家族、高齢者同伴、乳幼児連れなど、外出時にトイレ・休憩・移動経路への不安がある人のために、東京都の公開データを使って「出かける前に安心材料を確認できる」地図体験をつくる。

## Concept

Care Outing Map is not just a toilet finder.

It is a pre-outing decision support map that helps families and caregivers answer:

- Can we reach the destination without getting stuck?
- Are there wheelchair-accessible toilets nearby?
- Is there a diaper changing table for children?
- Are there backup options if the first place is not usable?
- Can we understand the area before going there?

## Current App

The current app is a browser-based React/Vite PoC. It shows Tokyo accessible toilet data around a selected area, with a Google 3D Maps view when a valid Google Maps API key is available.

Implemented:

- Area search and presets for Tokyo outing areas such as Ueno, Shinjuku, Shibuya, Asakusa, Oshiage, Tokyo Station, and Ikebukuro
- Tokyo-wide accessible toilet GeoJSON loaded from `public/data/processed/tokyo_accessible_toilets.geojson`
- Care modes:
  - Wheelchair family
  - Parent with baby/small child
  - Older adult companion
- Candidate toilet ranking by a rule-based outing confidence score
- Result list with selected-card highlighting
- Google 3D Maps markers for toilet candidates
- Static fallback map preview when Google Maps is unavailable
- Detail modal with equipment reasons, score band, and public photo URLs
- Photo carousel for entrance and inside toilet photos when both are available
- Camera focus tuned so selected toilets appear in the visible map area outside the left result panel

The app intentionally does not try to replace Google Maps for general outing discovery. Food, places, routes, and broader map exploration are left to Google Maps. Care Outing Map focuses on the missing care-planning layer: accessible toilets, equipment, photos, backup candidates, and confidence.

## Current Limitations

- This is still a PoC, not an official accessibility guarantee.
- Scores are planning aids based on source data attributes.
- Real-time toilet availability is not supported.
- Google 3D Maps marker tap behavior is limited by Google Maps event handling. The reliable detail flow is selecting a result card and using `詳しく見る`.
- Public photo URLs are referenced from Tokyo Open Data. Photo files are not stored in this repository.
- Mobile and tablet layouts are secondary; the primary target is desktop around 1920x1080.
- The railway-station source currently checked into `data/raw/` is the R0606/02 CSV. The newer R07/01 railway CSV has been identified but is not yet integrated.

## Spec

See [docs/spec.md](docs/spec.md).

## Deployment

Target deployment service: Render.

The app can be deployed as a Render Static Site.

Environment variables should be stored in `.env` locally and configured in Render's environment settings for deployment. `.env` is intentionally ignored by Git. Use `.env.example` as the shared template.

## Local Environment

Create a local `.env` file from `.env.example` and set your Google Maps API key.

```env
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

Do not commit `.env`.

For the Google Maps API key, restrict allowed referrers in Google Cloud Console. During development, allow:

```text
http://localhost:5173/*
```

After Render deployment, add the Render URL as another allowed referrer.

## Development

Install dependencies:

```sh
npm install
```

Start the local app:

```sh
npm run dev
```

Open:

```text
http://localhost:5173
```

The local app will still show a static preview if `VITE_GOOGLE_MAPS_API_KEY` is missing or if Google 3D Maps fails to initialize.

Build for Render:

```sh
npm run build
```

Render Static Site settings:

```text
Build command: npm run build
Publish directory: dist
```

## Data Preparation

Processed GeoJSON files are generated from the raw Tokyo CSV and Overpass JSON files.

```sh
python scripts/prepare-data.py
```

The app reads deployable GeoJSON files from `public/data/processed/`.

Current processed data:

- Tokyo-wide accessible toilets: 8,944
- Ueno 1km accessible toilets: 93
- Ueno 1.5km accessible toilets: 144
- Ueno OSM POIs: 90, retained in processed data but not currently rendered in the app

The data preparation step also assigns one unique `properties.id` per source CSV row so the result list and selected marker state do not collide across records.

See [data/README.md](data/README.md) for source URLs, encoding notes, and attribution reminders.

## UI Reference

The UI direction references Apple Japan-style design notes from `awesome-design-md-jp`.

Reference:
https://github.com/kzhrknt/awesome-design-md-jp/tree/main/design-md/apple

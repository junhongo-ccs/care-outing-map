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

## MVP

The first PoC focuses on a single outing scenario:

> A family goes to a museum or park with a wheelchair user or a small child, and checks accessible toilets and backup options before leaving.

Core features:

- Display accessible toilet data on a map
- Filter by care scenario
- Show wheelchair and child-care related facilities
- Score candidate toilets by "outing confidence"
- Search by destination area and filter with UI controls
- Visualize results on a 3D map where possible

## Spec

See [docs/spec.md](docs/spec.md).

## Deployment

Target deployment service: Render.

For the first MVP, the app can be deployed as a Render Static Site.

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

## UI Reference

The UI direction references Apple Japan-style design notes from `awesome-design-md-jp`.

Reference:
https://github.com/kzhrknt/awesome-design-md-jp/tree/main/design-md/apple

# 2026-06-30 Next Steps

## Current Status

- React/Vite app exists and builds successfully.
- Tokyo-wide accessible toilet GeoJSON is loaded from `public/data/processed/tokyo_accessible_toilets.geojson`.
- Destination search, care mode selection, left-side results panel, pin selection, and toilet detail modal are implemented.
- Google 3D Maps integration has been started with `maps3d` / `gmp-map-3d`, but local loading still needs verification against Google Cloud API settings.
- If 3D Maps does not initialize, the app falls back to a static preview map so core UI testing can continue.

## Next Tasks

### 1. Deploy To Render

- Deploy as a Render Static Site.
- Build command: `npm run build`
- Publish directory: `dist`
- Add `VITE_GOOGLE_MAPS_API_KEY` in Render environment variables.
- Add the Render URL to Google Cloud API key HTTP referrer restrictions.

### 2. Verify Google 3D Maps

- Confirm `gmp-map-3d` renders in production.
- Confirm `maps3d` and marker libraries load with the deployed referrer.
- If needed, compare behavior with `junhongo-ccs/kosugi_3Dmap`.

### 3. Tune Pin Behavior

- Clicking a result list item should select the toilet and fly the map camera to that point.
- Tapping another pin inside the map should select that pin, fly the camera to center on it, and then open the toilet detail modal.
- Keep list-click and map-pin-click behavior separate:
  - Result list: select and fly to point.
  - Map pin: select, fly to point, and open detail.
- Camera should focus visually on the selected pin, not merely update the coordinate center.

### 4. Polish Details UI

- Detail modal should remain compact and avoid internal scrollbars.
- Photo failures should show a clear fallback instead of broken image icons.
- Selected result card should show `詳しく見る`; unselected cards should remain quiet.

### 5. Future Voice Search

- Browser built-in speech recognition was tested for Japanese area/facility search, but accuracy was not good enough for the current PoC.
- If voice search is pursued seriously, consider Google Cloud Speech-to-Text.
- Accuracy may improve, but API keys and credentials should not be handled directly in the frontend.
- A small backend, such as a Render Web Service, would be needed to call Cloud Speech-to-Text safely.

### 6. Next Visual Assets

- Create OGP metadata and preview image for sharing the deployed app.
- Create and wire up favicon assets.
- Keep the visual direction consistent with the current care outing / accessible toilet map concept.

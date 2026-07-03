# Care Outing Map Spec

## 1. Product Summary

Care Outing Map is a GIS PoC for supporting "care outings": trips where someone needs care, assistance, or extra planning.

The PoC uses public accessible-toilet data from Tokyo and related free/open geospatial data to help users check toilets, backup options, and outing risks before going outside.

The core idea:

> Make it easier for families and caregivers to decide whether an outing feels safe enough.

This project intentionally avoids starting from abstract universal design language. It starts from real outing anxiety:

- Going to a museum with a wheelchair-using family member
- Going to a park or cultural facility with a baby or small child
- Visiting an unfamiliar station area with an older parent
- Needing to know whether a toilet has specific equipment before arriving

## 2. Problem

Existing maps can show that a toilet exists, but they often do not answer the practical questions people have before leaving home:

- Can a wheelchair user enter and turn around?
- Are there handrails?
- Is there a diaper changing table?
- Is there a large bed or universal sheet?
- Is there an alternative nearby if the first toilet is unavailable?
- Is the toilet near the station, museum, park, or route?
- Can the user understand the place visually before arriving?

For care outings, the risk is not just inconvenience. The risk is getting stuck, rushing, giving up on the outing, or placing stress on the person who needs care and the person providing care.

## 3. Target Users

### Primary

- Families going out with a wheelchair-using family member
- Parents or guardians going out with babies or small children
- People accompanying older adults

### Secondary

- Museum, park, and public facility visitors
- Local government staff evaluating accessibility gaps
- Tourism and city UX planners

## 4. Key Scenarios

### Scenario A: Wheelchair Family Museum Outing

A user is going to a museum with their wheelchair-using mother-in-law and sister-in-law.

They want to know:

- Which accessible toilets are near the station, route, or museum?
- Do they support wheelchair entry and turning?
- Are there handrails?
- Is there a large bed or emergency call button?
- Is there a backup option nearby?
- Can they preview the entrance or toilet photo?

### Scenario B: Parent With Small Child

A parent is going to a park or museum with a child.

They want to know:

- Where are toilets with diaper changing tables?
- Are there baby chairs?
- Are there indoor public facilities nearby?
- Are there backup options within a short walking distance?

### Scenario C: Older Adult Companion

A user is going out with an older parent.

They want to know:

- Are there toilets with handrails?
- Are there nearby public facilities where they can rest?
- Is the walking distance reasonable?
- Are there alternatives along the route?

## 5. MVP Scope

The MVP should be demoable with one focused area, such as Ueno, Asakusa, Oshiage, or a museum/park district in Tokyo.

### In Scope

- Load Tokyo accessible-toilet CSV data
- Convert records with latitude/longitude into GeoJSON or API-ready JSON
- Display toilets on a map
- Filter by scenario:
  - Wheelchair family
  - Parent with baby/small child
  - Older adult companion
- Show a details panel for selected toilets
- Calculate a simple outing confidence score
- Search by destination area
- Filter by care scenario and equipment conditions
- Highlight matching toilets and backup options

### Nice to Have

- Google 3D Map visualization
- Toilet photo preview
- Route overlay
- Public facilities and parks overlay
- Slope/elevation caution layer
- "15-minute backup" ring or reachable area

### Out of Scope for MVP

- Real-time toilet availability
- Indoor navigation
- Full route optimization
- Barrier-free verification beyond source data
- Emergency or disaster response workflows
- Crowdsourced corrections

## 6. Data

### Main Data

- Tokyo accessible toilet barrier-free information dataset
  - Public facilities
  - Railway stations
  - Toilet equipment attributes
  - Photos if available

### Additional Free/Open Data Candidates

- Public parks
- Public facilities
- Railway stations
- OpenStreetMap roads and paths
- Elevation tiles or slope-related data

The MVP should avoid too many datasets at first. The first working version can use only:

- Accessible toilets
- A small set of destinations such as museums, parks, or stations

## 7. Care Modes

The application should support care modes. Each mode maps human needs to data filters and scoring weights.

### Wheelchair Family Mode

Required or highly weighted:

- Wheelchair entry
- Wheelchair turning space
- Handrails
- Nearby backup toilet

Preferred:

- Large bed or universal sheet
- Emergency call button
- Photo
- Near station or destination

### Parent With Child Mode

Required or highly weighted:

- Diaper changing table

Preferred:

- Baby chair
- Stroller-friendly public facility
- Indoor location
- Photo
- Near park, station, or destination

### Older Adult Companion Mode

Required or highly weighted:

- Handrails
- Short walking distance

Preferred:

- Public facility nearby
- Rest-friendly destination
- Backup toilet nearby
- Photo

## 8. Outing Confidence Score

The MVP uses a rule-based score. This is not a medical, safety, or official accessibility rating. It is a planning aid.

Example score components:

- Equipment match: 40 points
- Distance to destination or route: 20 points
- Backup option nearby: 15 points
- Photo available: 10 points
- Public facility or station context: 10 points
- Opening hours or availability text present: 5 points

The UI should display score bands instead of only raw numbers:

- High confidence
- Moderate confidence
- Conditional
- Caution

## 9. Search And Filter UX

The MVP should prefer direct UI controls over natural language input. For this use case, selecting care needs and equipment filters is faster and clearer than typing a long prompt.

The search flow:

1. User enters a destination area or facility name
2. The app geocodes the place and centers the map
3. The app searches Tokyo-wide toilet data within a radius
4. User selects a care mode
5. User narrows results with equipment filters
6. The map and candidate list update immediately

### UI Search Example

```text
Destination: 東京都美術館
Care mode: 車椅子の家族
Required: 車椅子出入り可, 転回スペース, 手すり
Preferred: 大型ベッド, 写真あり, 代替候補
```

### GIS Response Example

```json
{
  "summary": "3 matching toilets found near the selected area. 1 has a strong backup option nearby.",
  "matches": [
    {
      "id": "toilet-001",
      "name": "Example Museum Accessible Toilet",
      "confidence": 84,
      "confidence_band": "High confidence",
      "reasons": ["wheelchair entry", "turning space", "handrails", "photo available"]
    }
  ]
}
```

## 10. Map Experience

The map should communicate care outing confidence quickly.

### Marker States

- Strong match: high-visibility marker
- Partial match: muted marker
- Backup option: secondary marker
- Caution: warning marker

### Detail Panel

When selecting a toilet, show:

- Name
- Facility or station
- Distance from selected destination
- Matching equipment
- Missing or unknown equipment
- Confidence score band
- Photo if available
- Why this is recommended

## 11. UI Design Direction

The visual direction should reference the Apple Japan design notes in `awesome-design-md-jp`.

Reference:

- https://github.com/kzhrknt/awesome-design-md-jp/tree/main/design-md/apple

The app should borrow the calm, minimal, premium feel without becoming a marketing page. This is a GIS decision-support tool, so clarity and task flow are more important than large hero sections.

### Visual Principles

- Use a white and light-gray base with near-black text
- Use Apple Blue for primary actions and focus states
- Keep typography clean, spacious, and readable
- Use generous spacing, but maintain enough density for map and result scanning
- Prefer restrained UI chrome so the map, route, toilets, and confidence results stay primary
- Use a glass-like top or side panel only when it improves legibility over the map

### Suggested Design Tokens

```css
--color-text-primary: #1d1d1f;
--color-text-secondary: rgba(0, 0, 0, 0.56);
--color-background: #ffffff;
--color-section: #f5f5f7;
--color-primary: #0071e3;
--color-link: #0066cc;
--color-on-dark: #f5f5f7;
--focus-ring: 0 0 0 3px rgba(0, 113, 227, 0.2);
```

### Typography

Use an Apple Japan-inspired font stack:

```css
font-family:
  "SF Pro JP",
  "SF Pro Text",
  "SF Pro Icons",
  "Hiragino Kaku Gothic Pro",
  "ヒラギノ角ゴ Pro W3",
  Meiryo,
  "Helvetica Neue",
  Helvetica,
  Arial,
  sans-serif;
```

The MVP should avoid oversized marketing typography inside the app surface. Use compact headings for panels and result cards.

### Components

- Primary buttons should use Apple Blue and pill radius
- Result cards should be quiet, readable, and no more rounded than needed
- Filters should use segmented controls, toggles, checkboxes, and concise labels
- Important status should use clear text plus icons, not color alone
- Map overlays should be visually distinct from UI panels

### App-Specific Adaptation

The referenced Apple design is product-page oriented. Care Outing Map should adapt it into a practical map app:

- No large first-screen marketing hero in the app
- Map should be the primary first viewport
- Right-side or bottom sheet controls should be immediately usable
- Result explanations should be short and confidence-oriented
- Accessibility and care context should be visible without emotional overstatement

### Primary Viewport

The primary target screen is a company-provided desktop PC with a 1920x1080 display.

The first MVP should optimize for this viewport before mobile:

- Full-screen app shell at 1920x1080
- Map as the dominant surface
- Right-side control and result panel
- Compact top bar for project name, scenario, and actions
- No landing page before the map
- Avoid oversized hero typography or decorative sections
- UI controls must fit within 1920x1080 without clipping or overlap

Recommended desktop layout:

```text
+---------------------------------------------------------------+
| Top bar: Care Outing Map / scenario / actions                  |
+--------------------------------------------+------------------+
|                                            | Search            |
|                                            | Care mode         |
|                3D / GIS Map                | Filters           |
|                                            | Results           |
|                                            | Selected details  |
+--------------------------------------------+------------------+
```

Suggested sizing for 1920x1080:

- Top bar: 56px to 64px height
- Right panel: 420px to 480px width
- Map area: remaining width
- Result cards: compact enough to show 3 to 5 candidates without scrolling too much

### Large Screen Layout Constraints

The layout should remain stable on large desktop screens.

Use Google Maps-like product behavior as the reference:

- The map can expand, crop, or overflow visually as the flexible background surface
- UI panels and controls must remain within the visible viewport
- Primary controls should stay anchored to predictable edges
- Avoid centered decorative layouts that break when the map grows
- Avoid floating cards scattered across the map
- Keep the right panel width fixed or clamped instead of scaling endlessly
- Keep top navigation compact and single-row at 1920px width
- Result lists should scroll internally when content exceeds available height
- Detail panels should not push core controls outside the viewport
- Do not rely on browser zoom or page scroll for primary workflows

Recommended constraints:

```css
.app {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}

.map-surface {
  position: absolute;
  inset: 0;
}

.top-bar {
  height: 60px;
}

.side-panel {
  width: clamp(420px, 24vw, 480px);
  max-height: calc(100vh - 84px);
  overflow: hidden;
}

.results-list {
  overflow: auto;
}
```

At 1920x1080, the complete UI should be visible:

- Top bar
- Destination search input
- Care mode selector
- Key filters
- Result list
- Selected toilet summary

The map may sit underneath UI chrome and may extend beyond what the user focuses on. The UI itself should not overflow, overlap, or require page-level scrolling.

Mobile and tablet layouts are secondary for the PoC. They can use a bottom sheet pattern later.

## 12. 3D Map Direction

Google 3D Map can be used to make the area understandable before arrival.

The 3D layer is valuable when it helps users see:

- Station side and surrounding buildings
- Museum or park context
- Major road crossings
- Spatial relationship between destination and backup toilets
- Whether the outing has enough safe fallback points

The project should keep the map provider replaceable. Core data processing should not depend on Google-specific objects.

## 13. Technical Direction

Recommended initial stack:

- React
- Vite
- TypeScript
- Map component abstraction
- Static GeoJSON for first demo
- Optional API layer later
- Render Static Site for initial deployment

Possible future stack:

- PostGIS for spatial queries
- Supabase or lightweight Node API
- Google Maps Platform for 3D visualization
- OpenStreetMap-derived data for route context
- Render Web Service for a backend if server-side APIs are needed

### Environment Variables

Local secrets should be stored in `.env`, which is ignored by Git.

The repository should include `.env.example` to document required variables without exposing secrets.

Possible variables:

```text
VITE_GOOGLE_MAPS_API_KEY=
```

## 14. Success Criteria

The PoC is successful if a user can:

1. Select or describe an outing scenario
2. See relevant accessible toilets on a map
3. Understand why certain toilets are recommended
4. Identify at least one backup option
5. Feel the map answers practical care outing questions better than a simple point map

## 15. Demo Narrative

Suggested demo:

> "I am going to a museum with my wheelchair-using mother-in-law. Before leaving, I want to check whether there are toilets she can use, whether there are handrails and turning space, and whether there is a backup option nearby."

The demo should then show:

- Destination search
- Care mode and equipment filters
- Matching toilets
- 3D or map visualization
- Confidence explanation
- Backup option

## 16. Repository Principles

- Start from real care outing use cases
- Keep the first demo small and understandable
- Prefer public and open data
- Prefer direct UI controls over natural language when they are faster
- Treat scores as planning aids, not official guarantees
- Design for families and caregivers, not only individual facility search

## 17. Work Notes

Date-based work notes are stored in `docs/notes/`.

Current next-step note:

- `docs/notes/2026-06-30-next-steps.md`

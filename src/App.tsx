import {
  ChevronRight,
  MapPinned,
  Search,
  Toilet,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  areaPresets,
  bandForScore,
  careModes,
  centerOf,
  distanceMeters,
  featureMatchesMode,
  featureReasons,
  scoreForMode,
} from "./data";
import { loadGoogleMaps } from "./googleMapsLoader";
import type { CareMode, FeatureCollection, PoiFeature, ToiletFeature } from "./types";

const mapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;

export function App() {
  const [mode, setMode] = useState<CareMode>("wheelchair");
  const [areaId, setAreaId] = useState("ueno");
  const [query, setQuery] = useState("上野");
  const [toilets, setToilets] = useState<ToiletFeature[]>([]);
  const [pois, setPois] = useState<PoiFeature[]>([]);
  const [selected, setSelected] = useState<ToiletFeature | null>(null);
  const [modalToilet, setModalToilet] = useState<ToiletFeature | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [customArea, setCustomArea] = useState<{ label: string; center: { lat: number; lng: number } } | null>(null);
  const [areaError, setAreaError] = useState<string | null>(null);

  const activeArea = customArea ?? areaPresets.find((area) => area.id === areaId) ?? areaPresets[0];
  useEffect(() => {
    async function loadData() {
      try {
        const [toiletsResponse, poisResponse] = await Promise.all([
          fetch("/data/processed/tokyo_accessible_toilets.geojson"),
          fetch("/data/processed/osm_ueno_pois.geojson"),
        ]);
        const toiletGeo = (await toiletsResponse.json()) as FeatureCollection<ToiletFeature>;
        const poiGeo = (await poisResponse.json()) as FeatureCollection<PoiFeature>;
        setToilets(toiletGeo.features);
        setPois(poiGeo.features);
      } catch (error) {
        setLoadError(error instanceof Error ? error.message : "Failed to load data");
      }
    }

    loadData();
  }, []);

  const nearbyToilets = useMemo(() => {
    return toilets
      .map((feature) => {
        const distance = distanceMeters(activeArea.center, centerOf(feature));
        return {
          ...feature,
          properties: {
            ...feature.properties,
            distance_to_ueno_station_m: distance,
          },
        };
      })
      .filter((feature) => (feature.properties.distance_to_ueno_station_m ?? 9999) <= 1500);
  }, [activeArea.center, toilets]);

  const rankedToilets = useMemo(() => {
    return nearbyToilets
      .map((feature) => ({
        feature,
        modeScore: scoreForMode(feature, mode),
        matches: featureMatchesMode(feature, mode),
      }))
      .sort((a, b) => Number(b.matches) - Number(a.matches) || b.modeScore - a.modeScore)
      .slice(0, 16);
  }, [mode, nearbyToilets]);

  const destinations = useMemo(() => {
    if (areaId !== "ueno") return [];
    return pois
      .filter((poi) => poi.properties.tourism === "museum" || poi.properties.tourism === "gallery")
      .slice(0, 6);
  }, [areaId, pois]);

  useEffect(() => {
    setSelected(null);
    setModalToilet(null);
  }, [areaId, mode]);

  function handleToiletSelect(feature: ToiletFeature) {
    if (selected?.properties.id === feature.properties.id) {
      setModalToilet(feature);
      return;
    }
    setSelected(feature);
  }

  async function handleAreaSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalized = query.trim();
    setAreaError(null);
    if (!normalized) return;
    const matched = areaPresets.find((area) => normalized.includes(area.label) || area.label.includes(normalized));
    if (matched) {
      setCustomArea(null);
      setAreaId(matched.id);
      setQuery(matched.label);
      return;
    }

    if (!mapsApiKey || !window.google?.maps?.Geocoder) {
      setAreaError("地名検索はGoogle Maps読み込み後に使えます。下の候補から選んでください。");
      return;
    }

    const geocoder = new google.maps.Geocoder();
    const result = await geocoder.geocode({
      address: `${normalized}, 東京都`,
      region: "JP",
    });
    const location = result.results[0]?.geometry.location;
    if (!location) {
      setAreaError("地名が見つかりませんでした。例: 渋谷区役所、東京都美術館");
      return;
    }
    setCustomArea({ label: normalized, center: { lat: location.lat(), lng: location.lng() } });
    setAreaId("custom");
  }

  return (
    <main className="app-shell">
      <section className="map-stage" aria-label={`${activeArea.label}周辺の地図`}>
        <MapView
          toilets={rankedToilets.map((item) => item.feature)}
          pois={destinations}
          selected={selected}
          mode={mode}
          center={activeArea.center}
          areaLabel={activeArea.label}
          onSelect={handleToiletSelect}
          onOpen={(feature) => {
            setSelected(feature);
            setModalToilet(feature);
          }}
        />
      </section>

      <header className="top-bar">
        <div className="brand-block">
          <span className="brand-mark">
            <MapPinned size={20} />
          </span>
          <div>
            <p className="eyebrow">Care Outing Map</p>
            <h1>東京おでかけ安心3Dマップ</h1>
          </div>
        </div>
        <div className="top-status">
          <span>{activeArea.label} 1.5km圏</span>
        </div>
        <label className="care-select">
          <span>ケアモード</span>
          <select value={mode} onChange={(event) => setMode(event.target.value as CareMode)}>
            {careModes.map((careMode) => (
              <option key={careMode.id} value={careMode.id}>
                {careMode.label}
              </option>
            ))}
          </select>
        </label>
      </header>

      <aside className="side-panel" aria-label="検索と結果">
        <section className="panel-section">
          <div className="section-title">
            <Search size={18} />
            <span>行き先エリア</span>
          </div>
          <form className="area-search" onSubmit={handleAreaSubmit}>
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="例: 渋谷、東京都美術館、代々木公園" />
            <button type="submit">検索</button>
          </form>
          {areaError ? <p className="area-error">{areaError}</p> : null}
        </section>

        <section className="panel-section result-section">
          <div className="section-title">
            <Toilet size={18} />
            <span>候補トイレ</span>
          </div>
          {loadError ? <p className="error-text">{loadError}</p> : null}
          <div className="results-list">
            {rankedToilets.map(({ feature }) => (
              <button
                className={`result-card ${selected?.properties.id === feature.properties.id ? "is-selected" : ""}`}
                key={feature.properties.id}
                onClick={() => handleToiletSelect(feature)}
                type="button"
              >
                <div className="result-main">
                  <strong>{feature.properties.name || feature.properties.toilet_name}</strong>
                  <span>{feature.properties.toilet_name || feature.properties.floor}</span>
                </div>
                <div className="result-meta">
                  {selected?.properties.id === feature.properties.id ? <span className="badge good">詳しく見る</span> : null}
                  <ChevronRight size={16} />
                </div>
              </button>
            ))}
          </div>
        </section>

      </aside>

      <ToiletModal selected={modalToilet} mode={mode} onClose={() => setModalToilet(null)} />
    </main>
  );
}

function ToiletModal({ selected, mode, onClose }: { selected: ToiletFeature | null; mode: CareMode; onClose: () => void }) {
  useEffect(() => {
    if (!selected) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, selected]);

  if (!selected) {
    return null;
  }

  const score = scoreForMode(selected, mode);
  const reasons = featureReasons(selected, mode);

  return (
    <div className="modal-backdrop" onClick={onClose} role="presentation">
      <section className="toilet-modal" aria-label="トイレ詳細" aria-modal="true" onClick={(event) => event.stopPropagation()} role="dialog">
        <button className="modal-close" onClick={onClose} type="button" aria-label="閉じる">
          <X size={18} />
        </button>
        <div className="selected-header">
          <span className="score-ring">{score}</span>
          <div>
            <p>{bandForScore(score)}</p>
            <h2>{selected.properties.name}</h2>
          </div>
        </div>
        <p className="selected-sub">{selected.properties.toilet_name || selected.properties.floor}</p>
        <div className="reason-list">
          {reasons.map((reason) => (
            <span key={reason}>{reason}</span>
          ))}
        </div>
        <ToiletPhoto src={selected.properties.photo_entrance} alt={`${selected.properties.name}のトイレ入口`} />
      </section>
    </div>
  );
}

function ToiletPhoto({ src, alt }: { src: string; alt: string }) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  if (!src) {
    return <div className="photo-fallback">写真データなし</div>;
  }

  if (failed) {
    return <div className="photo-fallback">写真URLはありますが、公開先から取得できません</div>;
  }

  return <img className="toilet-photo" src={normalizePhotoUrl(src)} alt={alt} onError={() => setFailed(true)} />;
}

function normalizePhotoUrl(src: string) {
  return src
    .replace("http://www.opendata.metro.tokyo.jp/", "https://www.opendata.metro.tokyo.lg.jp/")
    .replace("https://www.opendata.metro.tokyo.jp/", "https://www.opendata.metro.tokyo.lg.jp/");
}

function MapView({
  toilets,
  pois,
  selected,
  mode,
  center,
  areaLabel,
  onSelect,
  onOpen,
}: {
  toilets: ToiletFeature[];
  pois: PoiFeature[];
  selected: ToiletFeature | null;
  mode: CareMode;
  center: { lat: number; lng: number };
  areaLabel: string;
  onSelect: (feature: ToiletFeature) => void;
  onOpen: (feature: ToiletFeature) => void;
}) {
  const mapElement = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<HTMLElement | null>(null);
  const markersRef = useRef<HTMLElement[]>([]);
  const [mapError, setMapError] = useState<string | null>(null);
  const [useMapFallback, setUseMapFallback] = useState(false);

  function flyToSelectedToilet(feature: ToiletFeature) {
    if (!mapRef.current) return;
    const [lng, lat] = feature.geometry.coordinates;
    const map = mapRef.current as HTMLElement & {
      center?: { lat: number; lng: number; altitude?: number };
      range?: number;
      tilt?: number;
      heading?: number;
      flyCameraTo?: (options: {
        endCamera: {
          center: { lat: number; lng: number; altitude?: number };
          range: number;
          tilt: number;
          heading: number;
        };
        durationMillis?: number;
      }) => void;
      stopCameraAnimation?: () => void;
    };
    const camera = {
      center: { lat, lng, altitude: 80 },
      range: 420,
      tilt: 48,
      heading: 0,
    };

    map.stopCameraAnimation?.();
    if (typeof map.flyCameraTo === "function") {
      map.flyCameraTo({ endCamera: camera, durationMillis: 850 });
      return;
    }

    map.center = camera.center;
    map.range = camera.range;
    map.tilt = camera.tilt;
    map.heading = camera.heading;
  }

  useEffect(() => {
    if (!mapsApiKey || !mapElement.current || mapRef.current) return;
    setUseMapFallback(false);

    const fallbackTimer = window.setTimeout(() => {
      if (!mapRef.current) {
        setUseMapFallback(true);
        setMapError("Google 3D Mapを読み込めないため、プレビュー表示に切り替えました。");
      }
    }, 6000);

    loadGoogleMaps(mapsApiKey)
      .then(async (googleMaps) => {
        window.clearTimeout(fallbackTimer);
        const { Map3DElement } = (await googleMaps.importLibrary("maps3d")) as google.maps.Maps3DLibrary;
        const map = new Map3DElement({
          center: { ...center, altitude: 500 },
          range: 1800,
          tilt: 67.5,
          heading: 24,
          mode: "HYBRID",
          defaultUIHidden: false,
          gestureHandling: "GREEDY",
          description: "Care Outing Map 3D view",
        });

        map.className = "google-map";
        mapElement.current!.replaceChildren(map);
        mapRef.current = map;
      })
      .catch((error) => {
        window.clearTimeout(fallbackTimer);
        setUseMapFallback(true);
        setMapError(error instanceof Error ? error.message : "Google 3D Map failed to load");
      });

    return () => window.clearTimeout(fallbackTimer);
  }, [center]);

  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current as HTMLElement & {
      center?: { lat: number; lng: number; altitude?: number };
      range?: number;
      tilt?: number;
      heading?: number;
    };
    map.center = { ...center, altitude: 500 };
    map.range = 1800;
    map.tilt = 67.5;
    map.heading = 24;
  }, [center]);

  useEffect(() => {
    if (!mapRef.current || !selected) return;
    flyToSelectedToilet(selected);
  }, [selected]);

  useEffect(() => {
    if (!mapRef.current) return;
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    async function drawMarkers() {
      const [{ Marker3DElement }, { PinElement }] = (await Promise.all([
        google.maps.importLibrary("maps3d"),
        google.maps.importLibrary("marker"),
      ])) as [google.maps.Maps3DLibrary, google.maps.MarkerLibrary];

      pois.forEach((poi) => {
        const [lng, lat] = poi.geometry.coordinates;
        const marker = new Marker3DElement({
          position: { lat, lng, altitude: 20 },
          altitudeMode: "RELATIVE_TO_GROUND",
          extruded: true,
          label: poi.properties.name,
        });
        const pin = new PinElement({
            background: "#1d1d1f",
            borderColor: "#ffffff",
            glyphColor: "#ffffff",
            glyphText: "",
            scale: 0.85,
          });
        marker.append(pin.element ?? pin);
        mapRef.current!.append(marker);
        markersRef.current.push(marker);
      });

      toilets.forEach((toilet) => {
        const [lng, lat] = toilet.geometry.coordinates;
        const isSelected = selected?.properties.id === toilet.properties.id;
        const score = scoreForMode(toilet, mode);
        const marker = new Marker3DElement({
          position: { lat, lng, altitude: isSelected ? 70 : 35 },
          altitudeMode: "RELATIVE_TO_GROUND",
          extruded: true,
          label: toilet.properties.name,
        });
        const pin = new PinElement({
            background: score >= 75 ? "#0071e3" : score >= 55 ? "#34a853" : "#fbbc04",
            borderColor: "#ffffff",
            glyphColor: "#ffffff",
            glyphText: isSelected ? "●" : "",
            scale: isSelected ? 1.25 : 1,
          });
        marker.append(pin.element ?? pin);
        marker.addEventListener("click", () => onOpen(toilet));
        marker.addEventListener("gmp-click", () => onOpen(toilet));
        mapRef.current!.append(marker);
        markersRef.current.push(marker);
      });
    }

    void drawMarkers().catch((error) => {
      setMapError(error instanceof Error ? error.message : "3D markers failed to load");
    });
  }, [mode, onOpen, pois, selected, toilets]);

  if (!mapsApiKey || useMapFallback) {
    return (
      <StaticMapPreview
        toilets={toilets}
        pois={pois}
        selected={selected}
        mode={mode}
        center={center}
        areaLabel={areaLabel}
        onSelect={onSelect}
        onOpen={onOpen}
        warning={mapError ?? "Google Maps APIキー未設定時のプレビューです。"}
      />
    );
  }

  return (
    <>
      <div className="google-map-host" ref={mapElement} />
      {mapError ? <div className="map-warning">{mapError}</div> : null}
      <div className="map-caption">Google 3D Maps / {areaLabel} care outing demo</div>
    </>
  );
}

function StaticMapPreview({
  toilets,
  pois,
  selected,
  mode,
  center,
  areaLabel,
  onSelect,
  onOpen,
  warning,
}: {
  toilets: ToiletFeature[];
  pois: PoiFeature[];
  selected: ToiletFeature | null;
  mode: CareMode;
  center: { lat: number; lng: number };
  areaLabel: string;
  onSelect: (feature: ToiletFeature) => void;
  onOpen: (feature: ToiletFeature) => void;
  warning: string;
}) {
  const previewCenter = selected ? centerOf(selected) : center;
  const bounds = {
    minLng: previewCenter.lng - 0.012,
    maxLng: previewCenter.lng + 0.012,
    minLat: previewCenter.lat - 0.01,
    maxLat: previewCenter.lat + 0.01,
  };
  const toPosition = ([lng, lat]: [number, number]) => ({
    left: `${((lng - bounds.minLng) / (bounds.maxLng - bounds.minLng)) * 100}%`,
    top: `${(1 - (lat - bounds.minLat) / (bounds.maxLat - bounds.minLat)) * 100}%`,
  });
  const openFromPin = (event: React.MouseEvent<HTMLButtonElement>, toilet: ToiletFeature) => {
    event.preventDefault();
    event.stopPropagation();
    onOpen(toilet);
  };

  return (
      <div className="static-map">
      <div className="grid-lines" />
      <div className="ueno-label">{areaLabel}</div>
      {pois.map((poi) => (
        <span className="poi-dot" key={`${poi.properties.osm_type}-${poi.properties.osm_id}`} style={toPosition(poi.geometry.coordinates)}>
          {poi.properties.name}
        </span>
      ))}
      {toilets.map((toilet) => {
        const score = scoreForMode(toilet, mode);
        const selectedClass = selected?.properties.id === toilet.properties.id ? " is-selected" : "";
        return (
          <button
            className={`toilet-dot${selectedClass}`}
            key={toilet.properties.id}
            onClick={(event) => openFromPin(event, toilet)}
            style={toPosition(toilet.geometry.coordinates)}
            title={toilet.properties.name}
            type="button"
          >
            <span className={score >= 75 ? "high" : score >= 55 ? "medium" : "low"} />
          </button>
        );
      })}
      <div className="map-warning">{warning}</div>
    </div>
  );
}

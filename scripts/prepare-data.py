import csv
import json
import math
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RAW_TOILETS = ROOT / "data" / "raw" / "tokyo-accessible-toilets"
RAW_OSM_UENO = ROOT / "data" / "raw" / "osm_ueno_pois_overpass.json"
PROCESSED = ROOT / "data" / "processed"
PUBLIC_PROCESSED = ROOT / "public" / "data" / "processed"

UENO = {"lat": 35.713768, "lng": 139.777254}

ATTR_MAP = {
    "wheelchair_entry": "車椅子が出入りできる（出入口の有効幅員80cm以上）",
    "wheelchair_turning_space": "車椅子が転回できる（直径150cm以上の円が内接できる）",
    "backrest": "便座に背もたれがある",
    "handrails": "便座に手すりがある",
    "ostomate": "オストメイト用設備がある",
    "ostomate_warm_water": "オストメイト用設備が温水対応している",
    "large_bed": "大型ベッドを備えている",
    "diaper_changing_table": "乳幼児用おむつ交換台等を備えている",
    "baby_chair": "乳幼児用椅子を備えている",
    "emergency_call_button": "非常用呼び出しボタンを設置している",
}


def yes(value):
    return (value or "").strip() == "○"


def distance_meters(a, b):
    radius = 6371000
    p1 = math.radians(a["lat"])
    p2 = math.radians(b["lat"])
    dp = math.radians(b["lat"] - a["lat"])
    dl = math.radians(b["lng"] - a["lng"])
    h = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return round(2 * radius * math.asin(math.sqrt(h)))


def facility_name(row, source):
    name = (row.get("施設名") or row.get("鉄道駅名") or "").strip()
    if source == "railway_station" and name and not name.endswith("駅"):
        return f"{name}駅"
    return name


def read_toilet_features():
    features = []
    sources = [
        ("public_facility", "public_facilities_accessible_toilets.csv"),
        ("railway_station", "railway_station_accessible_toilets.csv"),
    ]

    for source, filename in sources:
        with (RAW_TOILETS / filename).open(encoding="cp932", newline="") as handle:
            for row_index, row in enumerate(csv.DictReader(handle), start=1):
                try:
                    lon = float(row.get("経度") or "nan")
                    lat = float(row.get("緯度") or "nan")
                except ValueError:
                    continue

                if not (138.5 < lon < 140.5 and 34.8 < lat < 36.2):
                    continue

                props = {
                    "id": f"{source}:{row_index}",
                    "source": source,
                    "name": facility_name(row, source),
                    "toilet_name": row.get("トイレ名") or "",
                    "floor": row.get("設置フロア") or "",
                    "address": row.get("市区町村・番地") or "",
                    "photo_entrance": row.get("写真データ（トイレの入り口）") or "",
                    "photo_inside": row.get("写真データ（トイレ内）") or "",
                    "notes": row.get("備考") or "",
                    "created_ym": row.get("データの作成年月") or row.get("データの作成年月 ") or "",
                    "updated_ym": row.get("データの変更年月") or row.get(" データの変更年月") or "",
                    "deleted_ym": row.get("データの削除年月") or row.get(" データの削除年月") or "",
                }
                for key, column in ATTR_MAP.items():
                    props[key] = yes(row.get(column))

                features.append(
                    {
                        "type": "Feature",
                        "geometry": {"type": "Point", "coordinates": [lon, lat]},
                        "properties": props,
                    }
                )

    return features


def write_json(path, payload):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")


def build_toilet_geojson(features, name, extra_metadata=None):
    source_counts = {}
    for feature in features:
        source = feature["properties"]["source"]
        source_counts[source] = source_counts.get(source, 0) + 1

    return {
        "type": "FeatureCollection",
        "name": name,
        "metadata": {
            "feature_count": len(features),
            "source_counts": source_counts,
            **(extra_metadata or {}),
        },
        "features": features,
    }


def build_osm_ueno_geojson():
    if not RAW_OSM_UENO.exists():
        return None

    raw = json.loads(RAW_OSM_UENO.read_text(encoding="utf-8"))
    features = []
    for element in raw.get("elements", []):
        tags = element.get("tags", {})
        lon = element.get("lon") or element.get("center", {}).get("lon")
        lat = element.get("lat") or element.get("center", {}).get("lat")
        if lon is None or lat is None:
            continue

        features.append(
            {
                "type": "Feature",
                "geometry": {"type": "Point", "coordinates": [float(lon), float(lat)]},
                "properties": {
                    "osm_type": element.get("type"),
                    "osm_id": element.get("id"),
                    "name": tags.get("name") or tags.get("name:ja") or tags.get("name:en") or "",
                    "tourism": tags.get("tourism") or "",
                    "amenity": tags.get("amenity") or "",
                    "leisure": tags.get("leisure") or "",
                    "website": tags.get("website") or "",
                    "wikidata": tags.get("wikidata") or "",
                    "distance_to_ueno_station_m": distance_meters(UENO, {"lat": float(lat), "lng": float(lon)}),
                },
            }
        )

    features.sort(key=lambda feature: feature["properties"]["distance_to_ueno_station_m"])
    return {
        "type": "FeatureCollection",
        "name": "osm_ueno_pois",
        "metadata": {"feature_count": len(features), "source": "OpenStreetMap via Overpass API"},
        "features": features,
    }


def main():
    all_features = read_toilet_features()
    tokyo = build_toilet_geojson(all_features, "tokyo_accessible_toilets")
    write_json(PROCESSED / "tokyo_accessible_toilets.geojson", tokyo)
    write_json(PUBLIC_PROCESSED / "tokyo_accessible_toilets.geojson", tokyo)

    ueno_features = []
    for feature in all_features:
        lon, lat = feature["geometry"]["coordinates"]
        distance = distance_meters(UENO, {"lat": lat, "lng": lon})
        if distance <= 1500:
            copied = json.loads(json.dumps(feature, ensure_ascii=False))
            copied["properties"]["distance_to_ueno_station_m"] = distance
            ueno_features.append(copied)

    ueno_features.sort(key=lambda feature: feature["properties"]["distance_to_ueno_station_m"])
    ueno_1500 = build_toilet_geojson(
        ueno_features,
        "ueno_accessible_toilets_1500m",
        {"center": {"name": "Ueno Station", **UENO}, "radius_m": 1500},
    )
    ueno_1000 = build_toilet_geojson(
        [feature for feature in ueno_features if feature["properties"]["distance_to_ueno_station_m"] <= 1000],
        "ueno_accessible_toilets_1000m",
        {"center": {"name": "Ueno Station", **UENO}, "radius_m": 1000},
    )
    write_json(PROCESSED / "ueno_accessible_toilets_1500m.geojson", ueno_1500)
    write_json(PROCESSED / "ueno_accessible_toilets_1000m.geojson", ueno_1000)
    write_json(PUBLIC_PROCESSED / "ueno_accessible_toilets_1000m.geojson", ueno_1000)

    osm = build_osm_ueno_geojson()
    if osm:
        write_json(PROCESSED / "osm_ueno_pois.geojson", osm)
        write_json(PUBLIC_PROCESSED / "osm_ueno_pois.geojson", osm)

    summary = {
        "tokyo_accessible_toilets": tokyo["metadata"],
        "ueno_toilets_1500m": ueno_1500["metadata"],
        "ueno_toilets_1000m": ueno_1000["metadata"],
        "osm_ueno_pois": osm["metadata"] if osm else None,
    }
    write_json(PROCESSED / "ueno_data_summary.json", summary)
    print(json.dumps(summary, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()

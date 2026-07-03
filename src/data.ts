import type { CareMode, ToiletFeature } from "./types";

export type AreaPreset = {
  id: string;
  label: string;
  description: string;
  center: { lat: number; lng: number };
};

export const areaPresets: AreaPreset[] = [
  { id: "ueno", label: "上野", description: "美術館・博物館・公園", center: { lat: 35.713768, lng: 139.777254 } },
  { id: "shibuya", label: "渋谷", description: "駅周辺・買い物・文化施設", center: { lat: 35.658034, lng: 139.701636 } },
  { id: "shinjuku", label: "新宿", description: "駅・都庁・大型施設", center: { lat: 35.690921, lng: 139.700258 } },
  { id: "asakusa", label: "浅草", description: "観光・高齢者同伴", center: { lat: 35.711736, lng: 139.79638 } },
  { id: "oshiage", label: "押上", description: "スカイツリー・子連れ", center: { lat: 35.710063, lng: 139.81347 } },
  { id: "tokyo", label: "東京駅", description: "乗換・丸の内周辺", center: { lat: 35.681236, lng: 139.767125 } },
  { id: "ikebukuro", label: "池袋", description: "駅・大型商業施設", center: { lat: 35.728926, lng: 139.71038 } },
];

export const careModes: Array<{
  id: CareMode;
  label: string;
  description: string;
}> = [
  {
    id: "wheelchair",
    label: "車椅子の家族",
    description: "出入り、転回、手すり、代替候補を重視",
  },
  {
    id: "child",
    label: "乳幼児連れ",
    description: "おむつ台、ベビーチェア、駅や公園の近さを重視",
  },
  {
    id: "older",
    label: "高齢者同伴",
    description: "手すり、短い移動距離、公共施設内を重視",
  },
];

export function distanceMeters(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const radius = 6371000;
  const p1 = (a.lat * Math.PI) / 180;
  const p2 = (b.lat * Math.PI) / 180;
  const dp = ((b.lat - a.lat) * Math.PI) / 180;
  const dl = ((b.lng - a.lng) * Math.PI) / 180;
  const h = Math.sin(dp / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2;
  return Math.round(2 * radius * Math.asin(Math.sqrt(h)));
}

export function centerOf(feature: ToiletFeature) {
  const [lng, lat] = feature.geometry.coordinates;
  return { lat, lng };
}

export function scoreForMode(feature: ToiletFeature, mode: CareMode) {
  const p = feature.properties;
  let score = 0;

  if (mode === "wheelchair") {
    score += p.wheelchair_entry ? 25 : 0;
    score += p.wheelchair_turning_space ? 25 : 0;
    score += p.handrails ? 18 : 0;
    score += p.large_bed ? 10 : 0;
    score += p.emergency_call_button ? 8 : 0;
  }

  if (mode === "child") {
    score += p.diaper_changing_table ? 35 : 0;
    score += p.baby_chair ? 20 : 0;
    score += p.wheelchair_entry ? 10 : 0;
    score += p.photo_entrance ? 10 : 0;
  }

  if (mode === "older") {
    score += p.handrails ? 35 : 0;
    score += p.wheelchair_entry ? 15 : 0;
    score += p.wheelchair_turning_space ? 10 : 0;
    score += p.source === "public_facility" ? 8 : 0;
  }

  const distance = p.distance_to_ueno_station_m ?? 9999;
  score += distance <= 500 ? 18 : distance <= 1000 ? 10 : 4;
  score += p.photo_entrance ? 8 : 0;

  return Math.min(100, score);
}

export function bandForScore(score: number) {
  if (score >= 75) return "安心度 高";
  if (score >= 55) return "安心度 中";
  if (score >= 35) return "条件つき";
  return "要確認";
}

export function featureMatchesMode(feature: ToiletFeature, mode: CareMode) {
  const p = feature.properties;
  if (mode === "wheelchair") {
    return p.wheelchair_entry && p.wheelchair_turning_space && p.handrails;
  }
  if (mode === "child") {
    return p.diaper_changing_table;
  }
  return p.handrails;
}

export function featureReasons(feature: ToiletFeature, mode: CareMode) {
  const p = feature.properties;
  const reasons: string[] = [];

  if (p.wheelchair_entry) reasons.push("車椅子出入り可");
  if (p.wheelchair_turning_space) reasons.push("転回スペース");
  if (p.handrails) reasons.push("手すり");
  if (mode === "child" && p.diaper_changing_table) reasons.push("おむつ台");
  if (mode === "child" && p.baby_chair) reasons.push("ベビーチェア");
  if (mode === "wheelchair" && p.large_bed) reasons.push("大型ベッド");
  if (p.ostomate) reasons.push("オストメイト");
  if (p.photo_entrance) reasons.push("写真あり");

  return reasons.slice(0, 5);
}

// src/api/poeNinjaSeries.js
import { fetchPoeNinja } from "./poeNinja";

const parseLeagues = (s) =>
  String(s ?? "")
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);

const pickName = (line) =>
  line?.currencyTypeName ??
  line?.name ??
  line?.detailsId ??
  "";

const buildIconMap = (json) => {
  const map = new Map();
  const details = Array.isArray(json?.currencyDetails) ? json.currencyDetails : [];
  for (const d of details) {
    if (d?.name && d?.icon) map.set(d.name, d.icon);
  }
  return map;
};

const toFiniteNumber = (x) => {
  const n = Number(x);
  return Number.isFinite(n) ? n : NaN;
};

// ★最後のN点だけにして day を 1..N に振り直す
const takeLastNAndReindex = (values, n) => {
  if (!Array.isArray(values) || values.length === 0) return [];
  const tail = values.slice(-n);
  return tail.map((v, i) => ({ ...v, day: i + 1 }));
};

/**
 * currencyoverview の sparkline(data) は「%変化」なので、chaosEquivalent から価格推移を復元する
 */
const currencyLineToValues = (line, pick) => {
  const recv = line?.receiveSparkLine;
  const pay = line?.paySparkLine;

  const chosen = pick === "pay" ? pay : recv;
  const fallback = pick === "pay" ? recv : pay;

  const sparkObj =
    chosen && Array.isArray(chosen.data) && chosen.data.length > 0
      ? chosen
      : fallback && Array.isArray(fallback.data) && fallback.data.length > 0
      ? fallback
      : null;

  if (!sparkObj) return [];

  const pctArr = sparkObj.data
    .map((v) => toFiniteNumber(v))
    .map((v) => (Number.isFinite(v) ? v : null));

  let lastPct = null;
  for (let i = pctArr.length - 1; i >= 0; i -= 1) {
    if (pctArr[i] != null) {
      lastPct = pctArr[i];
      break;
    }
  }
  if (lastPct == null) return [];

  const current = toFiniteNumber(line?.chaosEquivalent);

  // chaosEquivalent が取れない場合は％配列のまま返す（保険）
  if (!Number.isFinite(current)) {
    return pctArr
      .map((pct, i) => (pct == null ? null : { day: i + 1, price: pct }))
      .filter(Boolean);
  }

  const denom = 1 + lastPct / 100;
  if (!Number.isFinite(denom) || denom === 0) return [];

  const base = current / denom;

  return pctArr
    .map((pct, i) => {
      if (pct == null) return null;
      const price = base * (1 + pct / 100);
      if (!Number.isFinite(price)) return null;
      return { day: i + 1, price };
    })
    .filter(Boolean);
};

/**
 * poe.ninja から series を取得する
 *
 * - 後方互換:
 *   - type: "Currency" だけでも動く
 * - 新機能:
 *   - types: ["Currency", "Fragment"] のように複数 type をまとめて取得できる
 */
export async function fetchSeriesForLeagues({
  leaguesText,
  endpoint,
  type,          // 後方互換（単体）
  types,         // ★新：複数指定
  pick = "receive", // currencyoverview: receive/pay
  windowDays = 7,   // ★直近N点（Keepersは7固定で使う想定）
}) {
  const leagues = parseLeagues(leaguesText);
  if (leagues.length === 0) return [];

  const typeList =
    Array.isArray(types) && types.length > 0
      ? types
      : type
      ? [type]
      : [];

  if (typeList.length === 0) return [];

  const out = [];

  for (const league of leagues) {
    for (const t of typeList) {
      const json = await fetchPoeNinja({ endpoint, league, type: t });
      const lines = Array.isArray(json?.lines) ? json.lines : [];

      console.log("[poeNinjaSeries]", { league, endpoint, type: t, lines: lines.length });

      const iconMap = buildIconMap(json);

      for (const line of lines) {
        const name = pickName(line);
        if (!name) continue;

        let values = [];

        if (endpoint === "currencyoverview") {
          values = currencyLineToValues(line, pick);
        } else {
          const arr = line?.sparkline?.data;
          if (Array.isArray(arr) && arr.length > 0) {
            values = arr
              .map((price, i) => {
                const p = toFiniteNumber(price);
                return Number.isFinite(p) ? { day: i + 1, price: p } : null;
              })
              .filter(Boolean);
          }
        }

        if (!values.length) continue;

        // ★直近 windowDays 点に切る（「全部欲しい」運用なら、App側で windowDays を大きくする/渡さない運用にしてもOK）
        const sliced = takeLastNAndReindex(values, windowDays);
        if (!sliced.length) continue;

        const icon = line?.icon ?? iconMap.get(name) ?? null;

        out.push({
          name,
          icon,
          league,
          values: sliced,
          windowDays,
          sourceType: t, // ★Currency/Fragment の区別用（任意）
        });
      }
    }
  }

  return out;
}

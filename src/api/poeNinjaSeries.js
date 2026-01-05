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

/**
 * currencyoverview の sparkline(data) は「%変化」なので、chaosEquivalent から価格推移を復元する
 */
const currencyLineToValues = (line, pick) => {
  const recv = line?.receiveSparkLine;
  const pay = line?.paySparkLine;

  const chosen = pick === "pay" ? pay : recv;
  const fallback = pick === "pay" ? recv : pay;

  const sparkObj =
    (chosen && Array.isArray(chosen.data) && chosen.data.length > 0) ? chosen :
    (fallback && Array.isArray(fallback.data) && fallback.data.length > 0) ? fallback :
    null;

  if (!sparkObj) return [];

  const pctArr = sparkObj.data
    .map((v) => toFiniteNumber(v))
    .map((v) => (Number.isFinite(v) ? v : null));

  // 最後に有効な%（通常は totalChange と一致することが多い）
  let lastPct = null;
  for (let i = pctArr.length - 1; i >= 0; i -= 1) {
    if (pctArr[i] != null) {
      lastPct = pctArr[i];
      break;
    }
  }
  if (lastPct == null) return [];

  const current = toFiniteNumber(line?.chaosEquivalent);

  // current が取れない場合は「%のまま」でも一応描けるようにする
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

export async function fetchSeriesForLeagues({
  leaguesText,
  endpoint,
  type,
  pick = "receive", // currencyoverview: receive/pay どっちを見るか
}) {
  const leagues = parseLeagues(leaguesText);
  if (leagues.length === 0) return [];

  const out = [];

  for (const league of leagues) {
    const json = await fetchPoeNinja({ endpoint, league, type });
    const lines = Array.isArray(json?.lines) ? json.lines : [];

    // デバッグ：本当に lines が来てるか
    console.log("[poeNinjaSeries]", { league, endpoint, type, lines: lines.length });

    const iconMap = buildIconMap(json);

    for (const line of lines) {
      const name = pickName(line);
      if (!name) continue;

      let values = [];

      if (endpoint === "currencyoverview") {
        values = currencyLineToValues(line, pick);
      } else {
        // itemoverview 系（sparkline.data が価格のことが多い）
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

      const icon = line?.icon ?? iconMap.get(name) ?? null;

      out.push({
        name,
        icon,
        league, // ← これが付くので Unknown にならない
        values,
      });
    }
  }

  return out;
}

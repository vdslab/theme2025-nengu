// src/api/poeNinja.js
export async function fetchPoeNinja({ endpoint, league, type }) {
  const qs = new URLSearchParams({ endpoint, league, type });
  const res = await fetch(`/.netlify/functions/poe-ninja?${qs.toString()}`);

  const text = await res.text();

  let json;
  try {
    json = JSON.parse(text);
  } catch (e) {
    // JSONじゃない＝サーバが HTML を返してる等
    throw new Error(`Response is not JSON (HTTP ${res.status}). First 120 chars: ${text.slice(0, 120)}`);
  }

  if (!res.ok) {
    const msg = json?.error ? json.error : `HTTP ${res.status}`;
    throw new Error(msg);
  }

  return json;
}

// poe.ninja の sparkline 配列を Day 1..N に変換
export function sparklineToValues(arr) {
  if (!Array.isArray(arr)) return [];
  return arr
    .map((price, i) => ({
      day: i + 1,
      price: price == null ? null : Number(price),
    }))
    .filter((d) => d.price != null && Number.isFinite(d.price));
}

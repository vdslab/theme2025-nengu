export async function fetchPoeNinja({ endpoint, league, type }) {
  const targetUrl = `https://poe.ninja/api/data/${endpoint}?league=${encodeURIComponent(league)}&type=${encodeURIComponent(type)}`;
  
  // Try multiple methods to fetch data
  const attempts = [
    // 1. Local Proxy (Best for correctly configured Dev/Prod environments)
    // Note: If this returns index.html (SPA fallback), we catch that error and try the next method.
    `/api/ninja/${endpoint}?league=${encodeURIComponent(league)}&type=${encodeURIComponent(type)}`,
    
    // 2. High performance CORS proxy
    `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`,
    
    // 3. Backup CORS proxy
    `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`
  ];

  let lastError = null;

  for (const url of attempts) {
    try {
      console.log("[fetchPoeNinja] Attempting fetch:", url);
      const res = await fetch(url);

      if (!res.ok) {
        throw new Error(`HTTP ${res.status} ${res.statusText}`);
      }

      const text = await res.text();

      // Check for HTML response (SPA fallback issue)
      if (text.trim().startsWith("<!doctype html") || text.trim().startsWith("<html")) {
        throw new Error("Received HTML content (likely SPA fallback or proxy error)");
      }

      try {
        const json = JSON.parse(text);
        // Basic validation of poe.ninja structure
        if (json && (json.lines || json.currencyDetails)) {
            console.log("[fetchPoeNinja] Success via:", url);
            return json;
        }
        // If JSON is valid but empty/weird, maybe keep it, but let's be safe
        return json;
      } catch (e) {
        throw new Error(`Invalid JSON response: ${text.slice(0, 50)}...`);
      }

    } catch (e) {
      console.warn(`[fetchPoeNinja] Failed with ${url}:`, e.message);
      lastError = e;
      // Continue to next attempt
    }
  }

  throw new Error(`All fetch attempts failed. Last error: ${lastError?.message}`);
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
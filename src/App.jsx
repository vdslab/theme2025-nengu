import { useEffect, useState } from "react";
import Sidebar from "./components/Sidebar";
import Dashboard from "./components/Dashboard";
import { fetchSeriesForLeagues } from "./api/poeNinjaSeries";

function App() {
  const [filters, setFilters] = useState({
    compareLeagues: "",
    selectedSourceLeagues: ["Average"],
    buyDay: 3,
    sellDay: 14,
    showHighlight: true,
    minPrice: "",
    maxPrice: "",
    currency: "chaos",

    // ★追加：Keepersの表示ウィンドウ切り替え
    liveWindowMode: "all", // "all" | "last7"
  });

  const [analysisRequested, setAnalysisRequested] = useState(true);

  const [apiSeries, setApiSeries] = useState([]);
  const [apiError, setApiError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    setAnalysisRequested(false);
  };

  const handleAnalyze = () => {
    console.log("[App] Analyze clicked");
    setAnalysisRequested(true);
  };

  useEffect(() => {
    if (!analysisRequested) return;

    const leaguesText = String(filters.compareLeagues ?? "").trim();
    console.log("[App] analysisRequested=true leaguesText =", leaguesText);

    if (!leaguesText) {
      setApiSeries([]);
      setApiError("");
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        setApiError("");
        setIsLoading(true);

        // ★ここは「全部取る」。last7 は Dashboard 側で切る
        const series = await fetchSeriesForLeagues({
          leaguesText,
          endpoint: "currencyoverview",
          type: "Currency",
          pick: "receive",
          // windowDays は渡さない（全部ほしい）
        });

        console.log("[App] fetched api series:", series.length, series[0]);

        if (!cancelled) setApiSeries(series);
      } catch (e) {
        const msg = String(e?.message ?? e);
        console.log("[App] api fetch error:", msg);
        if (!cancelled) {
          setApiSeries([]);
          setApiError(msg);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [analysisRequested, filters.compareLeagues]);

  useEffect(() => {
    console.log("[App] apiSeries updated:", apiSeries.length, apiSeries[0]);
  }, [apiSeries]);

  return (
    <div className="min-h-screen bg-base-100 text-base-content flex">
      <aside className="w-64 h-screen sticky top-0 bg-base-200">
        <Sidebar
          filters={filters}
          onFilterChange={handleFilterChange}
          onAnalyze={handleAnalyze}
        />
      </aside>

      <main className="flex-1 h-screen overflow-hidden">
        <Dashboard
          filters={filters}
          analysisRequested={analysisRequested}
          apiSeries={apiSeries}
          apiError={apiError}
          isLoading={isLoading}
        />
      </main>
    </div>
  );
}

export default App;

import { useEffect, useState } from "react";
import Sidebar from "./components/Sidebar";
import Dashboard from "./components/Dashboard";
import { fetchSeriesForLeagues } from "./api/poeNinjaSeries";

function App() {
  const [filters, setFilters] = useState({
    compareLeagues: "", // 他者の変更を取り込み
    buyDay: 3,
    sellDay: 14,
    showHighlight: true,
    minPrice: "",
    maxPrice: "",
  });

  // Analyze を押したら true（フィルタ変更で false）
  const [analysisRequested, setAnalysisRequested] = useState(false); // 初期値はfalseに変更（他者の変更に合わせる）

  const [apiSeries, setApiSeries] = useState([]);
  const [apiError, setApiError] = useState("");

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    setAnalysisRequested(false);
  };
  
  const handleAnalyze = () => {
    console.log("[App] Analyze clicked");
    setAnalysisRequested(true);
  };

  // ★ここが本体：analysisRequested が true になったら fetch する（他者の変更を取り込み）
  useEffect(() => {
    if (!analysisRequested) return;

    const leaguesText = String(filters.compareLeagues ?? "").trim();
    console.log("[App] analysisRequested=true leaguesText =", leaguesText);

    // 空なら API 比較しない
    if (!leaguesText) {
      setApiSeries([]);
      setApiError("");
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        setApiError("");

        const series = await fetchSeriesForLeagues({
          leaguesText,
          endpoint: "currencyoverview",
          type: "Currency",
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
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [analysisRequested, filters.compareLeagues]);

  // apiSeries 更新確認
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
        />
      </main>
    </div>
  );
}

export default App;
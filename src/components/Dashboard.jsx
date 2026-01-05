import React, { useMemo, useState } from "react";
import { Range } from "react-range";
import PriceChart from "./PriceChart";
import ItemTable from "./ItemTable";
import ItemCountSelector from "./ItemCountSelector";
import { processedChartData } from "../data/processedData.js";

const ALL_DAYS = processedChartData
  .flatMap((d) => (Array.isArray(d.values) ? d.values.map((v) => v.day) : []))
  .filter((x) => Number.isFinite(x));

const DAY_MIN = ALL_DAYS.length ? Math.min(...ALL_DAYS) : 1;
const DAY_MAX = ALL_DAYS.length ? Math.max(...ALL_DAYS) : 30;

const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));

const toNumOrNaN = (v) => {
  if (v === "" || v === null || v === undefined) return NaN;
  const n = Number(v);
  return Number.isFinite(n) ? n : NaN;
};

const Dashboard = ({ filters, analysisRequested, apiSeries = [], apiError = "" }) => {
  const [dayRange, setDayRange] = useState([
    DAY_MIN,
    Math.min(DAY_MIN + 29, DAY_MAX),
  ]);
  const [itemCount, setItemCount] = useState(10);

  const colorDomain = useMemo(() => processedChartData.map((d) => d.name), []);
  const trackDen = Math.max(1, DAY_MAX - DAY_MIN);

  const { tableData, chartDataLocal } = useMemo(() => {
    if (!analysisRequested) return { tableData: [], chartDataLocal: [] };

    const rawBuyDay = Number(filters.buyDay);
    const rawSellDay = Number(filters.sellDay);

    if (!Number.isFinite(rawBuyDay) || !Number.isFinite(rawSellDay)) {
      return { tableData: [], chartDataLocal: [] };
    }

    const buyDay = clamp(rawBuyDay, DAY_MIN, DAY_MAX);
    const sellDay = clamp(rawSellDay, DAY_MIN, DAY_MAX);

    const findPriceForDay = (values, day) => {
      if (!Array.isArray(values) || values.length === 0) return null;

      const sorted = values.slice().sort((a, b) => a.day - b.day);

      let best = null;
      for (let i = 0; i < sorted.length; i += 1) {
        const v = sorted[i];
        if (!Number.isFinite(v.day)) continue;
        if (v.day <= day) best = v;
        else break;
      }
      return best && Number.isFinite(best.price) ? best.price : null;
    };

    const minP = toNumOrNaN(filters.minPrice);
    const maxP = toNumOrNaN(filters.maxPrice);

    const results = processedChartData
      .map((item) => {
        const buyPrice = findPriceForDay(item.values, buyDay);
        const sellPrice = findPriceForDay(item.values, sellDay);

        if (buyPrice === null || buyPrice <= 0) return null;
        if (sellPrice === null) return null;

        if (Number.isFinite(minP) && buyPrice < minP) return null;
        if (Number.isFinite(maxP) && buyPrice > maxP) return null;

        const roi = (sellPrice - buyPrice) / buyPrice;

        return {
          name: item.name,
          icon: item.icon,
          buyPrice,
          sellPrice,
          roi,
          buyDay,
          sellDay,
        };
      })
      .filter(Boolean)
      .sort((a, b) => b.roi - a.roi);

    const effectiveCount = Math.max(1, Math.min(10, itemCount, results.length || 1));
    const topResults = results.slice(0, effectiveCount);

    const topNames = new Set(topResults.map((r) => r.name));

    const local = processedChartData
      .filter((item) => topNames.has(item.name))
      .map((item) => ({ ...item, league: "Local" }));

    console.log(
      "[Dashboard] results:",
      results.length,
      "top:",
      topResults.length,
      "min/max:",
      minP,
      maxP
    );

    return { tableData: topResults, chartDataLocal: local };
  }, [
    analysisRequested,
    filters.buyDay,
    filters.sellDay,
    filters.minPrice,
    filters.maxPrice,
    itemCount,
  ]);

  // ★ ここが重要：apiSeries が変わったら再計算されるようにする
  const chartData = useMemo(() => {
    console.log("[Dashboard] apiSeries:", apiSeries?.length || 0, "local:", chartDataLocal.length);

    // APIが取れてるならAPI優先（ただし線が多すぎるなら絞る）
    if (Array.isArray(apiSeries) && apiSeries.length > 0) {
      // ローカルの top 名が取れてるならそれに合わせて API 側も絞る
      const topNames = new Set(tableData.map((r) => r.name));
      const filtered = apiSeries.filter((s) => topNames.has(s.name));

      // filtered が空なら（名前が一致しない等）とりあえず itemCount 件だけ出す
      const fallback = apiSeries.slice(0, Math.max(1, Math.min(10, itemCount)));

      const picked = filtered.length > 0 ? filtered : fallback;

      console.log("[Dashboard] chartSource first:", picked[0]?.league || "(no league)");
      return picked;
    }

    console.log("[Dashboard] chartSource first:", chartDataLocal[0]?.league || "(no league)");
    return chartDataLocal;
  }, [apiSeries, chartDataLocal, tableData, itemCount]);

  return (
    <div className="p-4">
      {apiError ? (
        <div className="alert alert-error mb-4">
          <span>{apiError}</span>
        </div>
      ) : null}

      <div className="bg-base-200 p-6 rounded-lg mb-4 text-base-content flex flex-wrap gap-6">
        <div className="flex-1 min-w-[300px]">
          <ItemCountSelector value={itemCount} min={1} max={10} onChange={setItemCount} />
        </div>

        <div className="flex-1 min-w-[300px]">
          <div className="bg-base-300 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-semibold">Chart Display Range</label>
              <div className="text-sm">
                Day {dayRange[0]} - {dayRange[1]}
              </div>
            </div>

            <Range
              values={dayRange}
              step={1}
              min={DAY_MIN}
              max={DAY_MAX}
              onChange={(values) => setDayRange(values)}
              renderTrack={({ props, children }) => (
                <div
                  onMouseDown={props.onMouseDown}
                  onTouchStart={props.onTouchStart}
                  style={{ ...props.style, height: "36px", display: "flex", width: "100%" }}
                >
                  <div
                    ref={props.ref}
                    className="w-full h-1.5 self-center rounded-full bg-base-content/30 relative"
                  >
                    <div
                      className="absolute h-full bg-primary"
                      style={{
                        left: `${((dayRange[0] - DAY_MIN) / trackDen) * 100}%`,
                        right: `${100 - ((dayRange[1] - DAY_MIN) / trackDen) * 100}%`,
                      }}
                    />
                    {children}
                  </div>
                </div>
              )}
              renderThumb={({ props, isDragged }) => {
                const { key, style, ...restProps } = props;
                return (
                  <div
                    key={key}
                    {...restProps}
                    style={style}
                    className={`h-6 w-6 rounded-full shadow-md flex justify-center items-center cursor-grab ${
                      isDragged ? "bg-primary-focus" : "bg-primary"
                    }`}
                  >
                    <div className="h-3 w-3 rounded-full bg-base-100" />
                  </div>
                );
              }}
            />

            <div className="flex justify-between text-xs text-base-content/70 mt-2">
              <span>{DAY_MIN}</span>
              <span>{DAY_MAX}</span>
            </div>
          </div>
        </div>
      </div>

      <PriceChart data={chartData} filters={filters} dayRange={dayRange} colorDomain={colorDomain} />
      <ItemTable data={tableData} />
    </div>
  );
};

export default Dashboard;

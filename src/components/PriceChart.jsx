import React, { useMemo, useState } from "react";
import Tooltip from "./Tooltip";
import ChartViewport from "./ChartViewport";
import PriceChartHeader from "./PriceChartHeader";
import TrendChart from "./TrendChart";
import ScatterChart from "./ScatterChart";

const PriceChart = ({ data, filters, dayRange }) => {
  const [viewType, setViewType] = useState("trend"); // "trend" | "scatter"
  const [trendMode, setTrendMode] = useState("roi"); // "price" | "roi"

  const [tooltip, setTooltip] = useState({
    visible: false,
    x: 0,
    y: 0,
    name: "",
    icon: "",
    day: "",
    price: null,
    league: "",
    roi: null,
    unit: "c",
    riskStd: null, // scatter用
  });

  const hideTooltip = () => {
    setTooltip((t) => ({ ...t, visible: false }));
  };

  // name -> color（リーグが違っても同じ色）
  const getColor = (name) => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const h = Math.abs(hash % 360);
    return `hsl(${h}, 75%, 60%)`;
  };

  // 凡例は item name で統合
  const legendItems = useMemo(() => {
    const m = new Map();
    (data || []).forEach((s) => {
      if (!s?.name) return;
      if (!m.has(s.name)) {
        m.set(s.name, { name: s.name, color: getColor(s.name) });
      }
    });
    return Array.from(m.values());
  }, [data]);

  // チャート領域は固定高さ（ヘッダーが伸びても潰れない）
  const CHART_HEIGHT = 320;

  return (
    <div className="w-full bg-base-200 rounded-lg shadow-inner flex flex-col p-4">
      <PriceChartHeader
        viewType={viewType}
        setViewType={setViewType}
        trendMode={trendMode}
        setTrendMode={setTrendMode}
        legendItems={legendItems}
      />

      <ChartViewport height={CHART_HEIGHT}>
        {({ width, height, containerRef }) => (
          <div className="relative w-full h-full" ref={containerRef}>
            {viewType === "trend" ? (
              <TrendChart
                data={data}
                filters={filters}
                dayRange={dayRange}
                mode={trendMode}
                width={width}
                height={height}
                containerRef={containerRef}
                getColor={getColor}
                setTooltip={setTooltip}
                hideTooltip={hideTooltip}
              />
            ) : (
              <ScatterChart
                data={data}
                filters={filters}
                dayRange={dayRange}
                width={width}
                height={height}
                containerRef={containerRef}
                getColor={getColor}
                setTooltip={setTooltip}
                hideTooltip={hideTooltip}
              />
            )}

            <Tooltip {...tooltip} />
          </div>
        )}
      </ChartViewport>
    </div>
  );
};

export default PriceChart;

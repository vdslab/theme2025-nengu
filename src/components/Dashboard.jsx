import React, { useState, useEffect } from "react";
import { Range } from "react-range";
import PriceChart from "./PriceChart";
import ItemTable from "./Itemtable";
import ItemCountSelector from "./ItemCountSelector";
import { processedChartData } from "../data/processedData.js";

const Dashboard = ({ filters, analysisRequested }) => {
  const [chartData, setChartData] = useState([]);
  const [tableData, setTableData] = useState([]);
  const [dayRange, setDayRange] = useState([1, 30]);

  // 追加：表示件数（1〜10）
  const [itemCount, setItemCount] = useState(10);

  useEffect(() => {
    if (!analysisRequested) return;

    const findPriceForDay = (values, day) => {
      const dataPoint = values.find((v) => v.day === day);
      return dataPoint ? dataPoint.price : null;
    };

    const buyDay = parseInt(filters.buyDay, 10);
    const sellDay = parseInt(filters.sellDay, 10);

    const results = processedChartData
      .map((item) => {
        const buyPrice = findPriceForDay(item.values, buyDay);
        const sellPrice = findPriceForDay(item.values, sellDay);

        // Budget filtering
        if (
          buyPrice === null ||
          (filters.minPrice && buyPrice < parseFloat(filters.minPrice)) ||
          (filters.maxPrice && buyPrice > parseFloat(filters.maxPrice))
        ) {
          return null;
        }

        if (sellPrice !== null) {
          const roi = (sellPrice - buyPrice) / buyPrice;
          return {
            name: item.name,
            buyPrice,
            sellPrice,
            roi,
          };
        }

        return null;
      })
      .filter(Boolean);

    // ROI降順
    const sorted = results.sort((a, b) => b.roi - a.roi);

    // 1〜10の範囲で、さらに結果件数以内に丸める
    const effectiveCount = Math.max(1, Math.min(10, itemCount, sorted.length || 1));

    const topResults = sorted.slice(0, effectiveCount);
    setTableData(topResults);

    // チャートも topResults に合わせる
    const topNames = topResults.map((r) => r.name);
    const newChartData = processedChartData.filter((item) =>
      topNames.includes(item.name)
    );
    setChartData(newChartData);
  }, [filters, analysisRequested, itemCount]);

  return (
    <div className="p-4">
      <div className="bg-gray-800 p-6 rounded-lg mb-4 text-white space-y-6">
        {/* 追加：表示件数スライダー（1〜10） */}
        <ItemCountSelector
          value={itemCount}
          min={1}
          max={10}
          onChange={setItemCount}
        />

        {/* 既存：dayRange スライダー */}
        <div>
          <label
            htmlFor="day-range-slider"
            className="block text-center text-lg mb-6"
          >
            Chart Display Range: Day {dayRange[0]} - {dayRange[1]}
          </label>

          <div className="px-4">
            <Range
              values={dayRange}
              step={1}
              min={1}
              max={30}
              onChange={(values) => setDayRange(values)}
              renderTrack={({ props, children }) => (
                <div
                  onMouseDown={props.onMouseDown}
                  onTouchStart={props.onTouchStart}
                  style={{
                    ...props.style,
                    height: "36px",
                    display: "flex",
                    width: "100%",
                  }}
                >
                  <div
                    ref={props.ref}
                    style={{
                      height: "5px",
                      width: "100%",
                      borderRadius: "4px",
                      background: `linear-gradient(to right, #4b5563 ${
                        ((dayRange[0] - 1) / 29) * 100
                      }%, #a78bfa ${((dayRange[0] - 1) / 29) * 100}%, #a78bfa ${
                        ((dayRange[1] - 1) / 29) * 100
                      }%, #4b5563 ${((dayRange[1] - 1) / 29) * 100}%)`,
                      alignSelf: "center",
                    }}
                  >
                    {children}
                  </div>
                </div>
              )}
              renderThumb={({ props }) => (
                <div
                  {...props}
                  style={{
                    ...props.style,
                    height: "24px",
                    width: "24px",
                    borderRadius: "9999px",
                    backgroundColor: "#FFF",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    boxShadow: "0px 2px 6px #AAA",
                  }}
                >
                  <div
                    style={{
                      height: "12px",
                      width: "12px",
                      borderRadius: "9999px",
                      backgroundColor: "#a78bfa",
                    }}
                  />
                </div>
              )}
            />
          </div>
        </div>
      </div>

<PriceChart
  data={chartData}
  filters={filters}
  dayRange={dayRange}
  colorDomain={processedChartData.map(d => d.name)}
/>
<ItemTable data={tableData} />

    </div>
  );
};

export default Dashboard;

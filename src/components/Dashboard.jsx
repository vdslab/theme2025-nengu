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
            icon: item.icon,
            buyPrice,
            sellPrice,
            roi,
            buyDay: buyDay,
            sellDay: sellDay,
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
      <div className="bg-base-200 p-6 rounded-lg mb-4 text-base-content flex flex-wrap gap-6">
        <div className="flex-1 min-w-[300px]">
          {/* 追加：表示件数スライダー（1〜10） */}
          <ItemCountSelector
            value={itemCount}
            min={1}
            max={10}
            onChange={setItemCount}
          />
        </div>

                <div className="flex-1 min-w-[300px]">

                  {/* 既存：dayRange スライダー */}

                  <div className="bg-base-300 p-4 rounded-lg">

                    <div className="flex items-center justify-between mb-3">

                      <label className="text-sm font-semibold">

                        Chart Display Range

                      </label>

                      <div className="text-sm">

                        Day {dayRange[0]} - {dayRange[1]}

                      </div>

                    </div>

        

                    <Range

                      values={dayRange}

                      step={1}

                      min={1}

                      max={30}

                      onChange={(values) => setDayRange(values)}

                                      renderTrack={({ props, children }) => (

                                        // スライダーのトラック全体（イベントハンドラ用）

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

                                          {/* スライダーのトラック（背景部分） */}

                                          <div

                                            ref={props.ref}

                                            className="w-full h-1.5 self-center rounded-full bg-base-content/30 relative"

                                          >

                                            {/* スライダーの進捗部分 */}

                                            <div

                                              className="absolute h-full bg-primary"

                                              style={{

                                                left: `${((dayRange[0] - 1) / 29) * 100}%`,

                                                right: `${100 - ((dayRange[1] - 1) / 29) * 100}%`,

                                              }}

                                            />

                                            {children} {/* スライダーのつまみ（サム）がここに含まれます */}

                                          </div>

                                        </div>

                                      )}

                                                                      renderThumb={({ props, isDragged }) => {

                                                                        const { key, style, ...restProps } = props; // key, style を分離

                                                                        return (

                                                                          // スライダーのつまみ（外側）

                                                                          <div

                                                                            key={key} // key は明示的に渡す

                                                                            {...restProps} // 残りの props を展開

                                                                            style={style} // style も明示的に渡す

                                                                            className={`h-6 w-6 rounded-full shadow-md flex justify-center items-center cursor-grab ${isDragged ? 'bg-primary-focus' : 'bg-primary'}`}

                                                                          >

                                                                            {/* スライダーのつまみ（内側ドット） */}

                                                                            <div className="h-3 w-3 rounded-full bg-base-100" />

                                                                          </div>

                                                                        );

                                                                      }}

                    />

                    <div className="flex justify-between text-xs text-base-content/70 mt-2">

                      <span>1</span>

                      <span>30</span>

                    </div>

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

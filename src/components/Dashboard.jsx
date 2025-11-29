import React, { useState, useEffect } from 'react';
import { Range } from 'react-range';
import PriceChart from './PriceChart';
import ItemTable from './ItemTable';
import { processedChartData } from '../data/processedData.js';

const Dashboard = ({ filters, analysisRequested }) => {
  const [chartData, setChartData] = useState([]);
  const [tableData, setTableData] = useState([]);
  const [dayRange, setDayRange] = useState([1, 30]);

  useEffect(() => {
    if (analysisRequested) {
      console.log("Analysis requested with filters:", filters);
      
      const findPriceForDay = (values, day) => {
        const dataPoint = values.find(v => v.day === day);
        return dataPoint ? dataPoint.price : null;
      };

      const results = processedChartData.map(item => {
        const buyPrice = findPriceForDay(item.values, parseInt(filters.buyDay, 10));
        const sellPrice = findPriceForDay(item.values, parseInt(filters.sellDay, 10));

        // Budget filtering
        if (buyPrice === null || (filters.minPrice && buyPrice < parseFloat(filters.minPrice)) || (filters.maxPrice && buyPrice > parseFloat(filters.maxPrice))) {
          return null;
        }

        if (sellPrice !== null) {
          const roi = ((sellPrice - buyPrice) / buyPrice); // Calculate ROI as a raw number
          return {
            name: item.name,
            buyPrice,
            sellPrice,
            roi,
          };
        }
        return null;
      }).filter(Boolean); // Remove null entries

      // Sort by ROI descending and take top 10
      const topResults = results.sort((a, b) => b.roi - a.roi).slice(0, 10);
      
      setTableData(topResults);

      // Filter chart data to only show the top results
      const topItemNames = topResults.map(r => r.name);
      const newChartData = processedChartData.filter(item => topItemNames.includes(item.name));
      setChartData(newChartData);
    }
  }, [filters, analysisRequested]);


  return (
    <div className="p-4">
      <div className="bg-gray-800 p-6 rounded-lg mb-4 text-white">
        <label htmlFor="day-range-slider" className="block text-center text-lg mb-6">Chart Display Range: Day {dayRange[0]} - {dayRange[1]}</label>
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
                  height: '36px',
                  display: 'flex',
                  width: '100%'
                }}
              >
                <div
                  ref={props.ref}
                  style={{
                    height: '5px',
                    width: '100%',
                    borderRadius: '4px',
                    background: `linear-gradient(to right, #4b5563 ${((dayRange[0] - 1) / 29) * 100}%, #a78bfa ${((dayRange[0] - 1) / 29) * 100}%, #a78bfa ${((dayRange[1] - 1) / 29) * 100}%, #4b5563 ${((dayRange[1] - 1) / 29) * 100}%)`,
                    alignSelf: 'center'
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
                  height: '24px',
                  width: '24px',
                  borderRadius: '9999px',
                  backgroundColor: '#FFF',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  boxShadow: '0px 2px 6px #AAA'
                }}
              >
                <div
                  style={{
                    height: '12px',
                    width: '12px',
                    borderRadius: '9999px',
                    backgroundColor: '#a78bfa'
                  }}
                />
              </div>
            )}
          />
        </div>
      </div>
      <PriceChart data={chartData} filters={filters} dayRange={dayRange} />
      <ItemTable data={tableData} />
    </div>
  );
};

export default Dashboard;

import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import Tooltip from "./Tooltip";

const PriceChart = ({ data, filters, dayRange, colorDomain }) => {
  const containerRef = useRef(null);
  const svgRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [chartMode, setChartMode] = useState("roi"); // "price" | "roi"

  const [tooltip, setTooltip] = useState({
    visible: false,
    x: 0,
    y: 0,
    name: "",
    day: null,
    price: null,
    league: "",
    roi: null, // Tooltip用にROIも保持
  });

  // Calculate colors based on item name hash to avoid duplicates and ensure consistency
  const getColor = (name) => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const h = Math.abs(hash % 360);
    return `hsl(${h}, 75%, 60%)`;
  };

  // Resize Observer to handle responsiveness
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      const { width, height } = entries[0].contentRect;
      setDimensions({ width, height });
    });

    resizeObserver.observe(containerRef.current);

    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    if (!svgRef.current || dimensions.width === 0 || dimensions.height === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    if (!data || data.length === 0) {
      svg
        .append("text")
        .attr("x", dimensions.width / 2)
        .attr("y", dimensions.height / 2)
        .attr("text-anchor", "middle")
        .style("fill", "#A0AEC0")
        .style("font-size", "16px")
        .text("No items selected. Please select items from the table below.");
      return;
    }

    const margin = { top: 10, right: 20, bottom: 30, left: 60 };
    const width = dimensions.width - margin.left - margin.right;
    const height = dimensions.height - margin.top - margin.bottom;

    const chart = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const xDomain = dayRange || [1, 30];
    const buyDay = parseInt(filters.buyDay, 10) || 1;

    // --- Data Preparation based on Mode ---
    let renderData = [];
    
    if (chartMode === "price") {
        renderData = data.map(series => ({
            ...series,
            icon: series.icon,
            renderValues: (series.values || [])
                .filter(v => v.day >= xDomain[0] && v.day <= xDomain[1])
                .map(v => ({ ...v, value: Number(v.price) }))
                .filter(v => Number.isFinite(v.value))
        }));
    } else {
        // ROI Mode
        renderData = data.map(series => {
            const values = series.values || [];
            // Find base price at buyDay
            // Using exact match first, could interpolate but simple find is safer for now
            const basePoint = values.find(v => v.day === buyDay);
            const basePrice = basePoint ? Number(basePoint.price) : null;

            if (!basePrice || basePrice <= 0) return null; // Cannot calculate ROI

            const renderValues = values
                .filter(v => v.day >= xDomain[0] && v.day <= xDomain[1])
                .map(v => {
                    const price = Number(v.price);
                    if (!Number.isFinite(price)) return null;
                    const roi = ((price - basePrice) / basePrice) * 100;
                    return { ...v, value: roi, originalPrice: price };
                })
                .filter(Boolean);

            if (renderValues.length === 0) return null;

            return { ...series, icon: series.icon, renderValues };
        }).filter(Boolean);
    }

    if (renderData.length === 0 && chartMode === "roi") {
        svg.append("text")
           .attr("x", dimensions.width / 2)
           .attr("y", dimensions.height / 2)
           .attr("text-anchor", "middle")
           .style("fill", "#A0AEC0")
           .text(`No data available for ROI calculation based on Day ${buyDay}.`);
        return;
    }


    // --- Scales ---
    const allValues = renderData.flatMap(s => s.renderValues.map(v => v.value));
    let yMin = d3.min(allValues);
    let yMax = d3.max(allValues);
    
    // Add padding to Y domain
    if (chartMode === "price") {
        yMin = 0;
        yMax = (yMax || 0) * 1.1;
    } else {
        // ROI mode: center around 0 if possible, or at least show negative
        const padding = (yMax - yMin) * 0.1 || 10;
        yMin = (yMin || 0) - padding;
        yMax = (yMax || 0) + padding;
    }

    const xScale = d3.scaleLinear().domain(xDomain).range([0, width]);
    const yScale = d3.scaleLinear().domain([yMin, yMax]).range([height, 0]);


    // Clip Path
    const clipId = `chart-area-clip-${Math.random().toString(36).slice(2)}`;
    svg
      .append("defs")
      .append("clipPath")
      .attr("id", clipId)
      .append("rect")
      .attr("width", width)
      .attr("height", height);

    // Grid lines (X axis)
    chart.append("g")
        .attr("class", "grid")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(xScale).ticks(10).tickSize(-height).tickFormat("").tickPadding(10))
        .style("stroke-opacity", 0.1)
        .style("stroke", "white");

    // Grid lines (Y axis)
    chart.append("g")
        .attr("class", "grid")
        .call(d3.axisLeft(yScale).ticks(8).tickSize(-width).tickFormat(""))
        .style("stroke-opacity", 0.1)
        .style("stroke", "white");
    
    // Zero line for ROI
    if (chartMode === "roi") {
        chart.append("line")
            .attr("x1", 0)
            .attr("x2", width)
            .attr("y1", yScale(0))
            .attr("y2", yScale(0))
            .attr("stroke", "white")
            .attr("stroke-opacity", 0.3)
            .attr("stroke-dasharray", "4,4");
    }

    const contentGroup = chart.append("g").attr("clip-path", `url(#${clipId})`);

    // Axes
    const unitSuffix = filters.currency === 'divine' ? 'div' : 'c';
    const xAxis = d3.axisBottom(xScale).ticks(10).tickFormat(d => `Day ${d}`);
    const yAxis = d3.axisLeft(yScale)
        .ticks(8)
        .tickFormat(d => chartMode === "roi" ? `${d > 0 ? '+' : ''}${d.toFixed(0)}%` : `${d3.format("~s")(d)}${unitSuffix}`);

    chart.append("g")
      .attr("transform", `translate(0, ${height})`)
      .call(xAxis)
      .attr("color", "#718096") 
      .style("font-size", "11px");

    chart.append("g")
      .call(yAxis)
      .attr("color", "#718096")
      .style("font-size", "11px");

    // Highlight Range (only if valid)
    if (filters.showHighlight && filters.buyDay && filters.sellDay) {
      const xBuy = xScale(parseInt(filters.buyDay, 10));
      const xSell = xScale(parseInt(filters.sellDay, 10));
      
      if (!isNaN(xBuy) && !isNaN(xSell)) {
          contentGroup
            .append("rect")
            .attr("x", Math.min(xBuy, xSell))
            .attr("y", 0)
            .attr("width", Math.abs(xSell - xBuy))
            .attr("height", height)
            .attr("fill", "rgba(72, 187, 120, 0.15)");
      }
    }

    const line = d3
      .line()
      .x(d => xScale(d.day))
      .y(d => yScale(d.value))
      .curve(d3.curveMonotoneX);

    renderData.forEach((series) => {
      const c = getColor(series.name);
      const league = series.league || "";

      if (series.renderValues.length === 0) return;

      let opacity = 1;
      let strokeDash = "0";

      // League differentiation logic
      if (league && filters.selectedSourceLeagues && filters.selectedSourceLeagues.length > 0) {
          const idx = filters.selectedSourceLeagues.indexOf(league);
          if (idx !== -1) {
              // 1st: 1.0, 2nd: 0.6, 3rd: 0.4 ...
              opacity = Math.max(0.3, 1 - (idx * 0.4));
              // Optional: Add dash pattern for secondary leagues to make it even clearer?
              // if (idx > 0) strokeDash = "4,2";
          }
      }

      // Draw Line
      contentGroup
        .append("path")
        .datum(series.renderValues)
        .attr("fill", "none")
        .attr("stroke", c)
        .attr("stroke-width", 2)
        .attr("stroke-opacity", opacity)
        .attr("stroke-dasharray", strokeDash)
        .attr("d", line);

      // Hit Area
      contentGroup
        .append("path")
        .datum(series.renderValues)
        .attr("fill", "none")
        .attr("stroke", "transparent")
        .attr("stroke-width", 20)
        .style("cursor", "crosshair")
        .attr("d", line)
        .on("mousemove", (event) => {
          const [mx] = d3.pointer(event, contentGroup.node());
          const day = Math.round(xScale.invert(mx));
          const v = series.renderValues.find(d => d.day === day);
          
          if (!v) return;

          const containerRect = containerRef.current.getBoundingClientRect();

          setTooltip({
            visible: true,
            x: event.clientX - containerRect.left,
            y: event.clientY - containerRect.top,
            name: series.name,
            icon: series.icon, // Pass icon
            league: league,
            day: v.day,
            price: chartMode === 'roi' ? v.originalPrice : v.value,
            roi: chartMode === 'roi' ? v.value : null,
            color: c,
            unit: filters.currency === 'divine' ? 'div' : 'c'
          });
        })
        .on("mouseleave", () => setTooltip(t => ({ ...t, visible: false })));
    });

  }, [data, filters, dayRange, dimensions, chartMode]);

  return (
    <div className="w-full h-full bg-base-200 rounded-lg shadow-inner flex flex-col p-4">
       {/* Header with Title, Toggle, and Legend */}
       <div className="flex-none flex flex-wrap items-center justify-between gap-4 mb-2">
          
          <div className="flex items-center gap-4">
              <h3 className="text-xs font-bold text-base-content/50 uppercase tracking-widest">Price History</h3>
              
              {/* Mode Toggle - Re-styled for better visibility */}
              <div className="bg-black/40 p-1 rounded-lg flex gap-1 border border-white/10 shadow-lg">
                  <button 
                    className={`btn btn-xs no-animation px-4 rounded transition-all border-none ${
                        chartMode === 'price' 
                        ? 'bg-amber-500 text-black font-extrabold shadow-[0_0_10px_rgba(245,158,11,0.3)]' 
                        : 'bg-transparent text-base-content/50 hover:text-base-content/80'
                    }`}
                    onClick={() => setChartMode('price')}
                  >
                    Price
                  </button>
                  <button 
                    className={`btn btn-xs no-animation px-4 rounded transition-all border-none ${
                        chartMode === 'roi' 
                        ? 'bg-amber-500 text-black font-extrabold shadow-[0_0_10px_rgba(245,158,11,0.3)]' 
                        : 'bg-transparent text-base-content/50 hover:text-base-content/80'
                    }`}
                    onClick={() => setChartMode('roi')}
                  >
                    ROI %
                  </button>
              </div>
          </div>
          
          {/* Legend Section */}
          <div className="flex flex-wrap gap-x-4 gap-y-1 justify-end flex-1">
             {data.map((series) => (
               <div key={`${series.name}-${series.league}`} className="flex items-center gap-1.5">
                  <div 
                    className="w-2.5 h-2.5 rounded-full" 
                    style={{ backgroundColor: getColor(series.name) }}
                  ></div>
                  <span className="text-[10px] font-medium text-base-content/70 whitespace-nowrap">
                    {series.name} {series.league ? `(${series.league})` : ""}
                  </span>
               </div>
             ))}
          </div>
       </div>

      {/* SVG Container */}
      <div ref={containerRef} className="flex-1 w-full min-h-0 relative">
        <svg ref={svgRef} width={dimensions.width} height={dimensions.height} className="block" />
        <Tooltip {...tooltip} />
      </div>
    </div>
  );
};

export default PriceChart;
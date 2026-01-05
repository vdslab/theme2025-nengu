import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import Tooltip from "./Tooltip";

const PriceChart = ({ data, filters, dayRange, colorDomain }) => {
  const containerRef = useRef(null);
  const svgRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [tooltip, setTooltip] = useState({
    visible: false,
    x: 0,
    y: 0,
    name: "",
    day: null,
    price: null,
  });

  // Calculate colors based on item name hash to avoid duplicates and ensure consistency
  const getColor = (name) => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    // Generate HSL color:
    // Hue: Distributed across 360 degrees
    // Saturation: Fixed high value for visibility (e.g., 75%)
    // Lightness: Fixed medium-high value for dark mode (e.g., 60%)
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

    const valuesInDomain = data.flatMap(d =>
      d.values
        .filter(v => v.day >= xDomain[0] && v.day <= xDomain[1])
        .map(v => v.price)
    );

    const yMax = d3.max(valuesInDomain) || 0;

    const xScale = d3.scaleLinear().domain(xDomain).range([0, width]);
    const yScale = d3.scaleLinear().domain([0, yMax * 1.1]).range([height, 0]);

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
        .call(d3.axisBottom(xScale)
            .ticks(10)
            .tickSize(-height)
            .tickFormat("")
        )
        .style("stroke-opacity", 0.1)
        .style("stroke", "white");

    // Grid lines (Y axis)
    chart.append("g")
        .attr("class", "grid")
        .call(d3.axisLeft(yScale)
            .ticks(8)
            .tickSize(-width)
            .tickFormat("")
        )
        .style("stroke-opacity", 0.1)
        .style("stroke", "white");

    const contentGroup = chart.append("g").attr("clip-path", `url(#${clipId})`);

    // Axes
    const xAxis = d3.axisBottom(xScale).ticks(10).tickFormat(d => `Day ${d}`);
    const yAxis = d3.axisLeft(yScale).ticks(8).tickFormat(d3.format("~s"));

    chart.append("g")
      .attr("transform", `translate(0, ${height})`)
      .call(xAxis)
      .attr("color", "#718096") 
      .style("font-size", "11px");

    chart.append("g")
      .call(yAxis)
      .attr("color", "#718096")
      .style("font-size", "11px");

    // Highlight Range
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
      .y(d => yScale(d.price))
      .curve(d3.curveMonotoneX);

    data.forEach((series) => {
      const c = getColor(series.name);

      contentGroup
        .append("path")
        .datum(series.values)
        .attr("fill", "none")
        .attr("stroke", c)
        .attr("stroke-width", 2)
        .attr("d", line);

      contentGroup
        .append("path")
        .datum(series.values)
        .attr("fill", "none")
        .attr("stroke", "transparent")
        .attr("stroke-width", 20)
        .style("cursor", "crosshair")
        .attr("d", line)
        .on("mousemove", (event) => {
          const [mx] = d3.pointer(event, contentGroup.node());
          const day = Math.round(xScale.invert(mx));
          const v = series.values.find(d => d.day === day);
          
          if (!v) return;

          const containerRect = containerRef.current.getBoundingClientRect();

          setTooltip({
            visible: true,
            x: event.clientX - containerRect.left,
            y: event.clientY - containerRect.top,
            name: series.name,
            day: v.day,
            price: v.price,
            color: c
          });
        })
        .on("mouseleave", () => setTooltip(t => ({ ...t, visible: false })));
    });

  }, [data, filters, dayRange, dimensions]);

  return (
    <div className="w-full h-full bg-base-200 rounded-lg shadow-inner flex flex-col p-4">
       {/* Header with Title and Legend */}
       <div className="flex-none flex flex-wrap items-center justify-between gap-4 mb-2">
          <h3 className="text-xs font-bold text-base-content/50 uppercase tracking-widest">Price History</h3>
          
          {/* Legend Section */}
          <div className="flex flex-wrap gap-x-4 gap-y-1">
             {data.map((series) => (
               <div key={series.name} className="flex items-center gap-1.5">
                  <div 
                    className="w-2.5 h-2.5 rounded-full" 
                    style={{ backgroundColor: getColor(series.name) }}
                  ></div>
                  <span className="text-[10px] font-medium text-base-content/70 whitespace-nowrap">
                    {series.name}
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

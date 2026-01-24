import React, { useEffect, useRef, useMemo } from "react";
import * as d3 from "d3";
import { processedChartData, availableLeagues } from "../data/processedData.js";

const RangeChart = React.memo(({
  selectedItemNames,
  filters,
  dayRange,
  mode = "price", // "price" | "roi"
  width,
  height,
  containerRef,
  getColor, // Received from parent
  setTooltip,
  hideTooltip,
}) => {
  const svgRef = useRef(null);

  const selectedKeys = selectedItemNames ? selectedItemNames.join(",") : "";

  // 1. Prepare Data: Calculate Min/Max/Avg per day for ALL selected items
  // Combined logic for Price and ROI modes
  const renderData = useMemo(() => {
    if (!selectedItemNames || selectedItemNames.length === 0) return [];
    const buyDay = parseInt(filters.buyDay, 10) || 1;
    
    return selectedItemNames.map(targetName => {
        const itemData = processedChartData.find(d => d.name === targetName);
        if (!itemData || !itemData.leagues) return null;

        const minDay = 1;
        const maxDay = 40; 
        const dailyStats = [];

        for (let d = minDay; d <= maxDay; d++) {
            // Collect values (Price or ROI) from all available leagues for this day
            const values = availableLeagues.map(league => {
                const leagueData = itemData.leagues[league];
                if (!leagueData) return null;

                const entry = leagueData.find(v => v.day === d);
                if (!entry) return null;
                const currentPrice = Number(entry.price);

                if (mode === "price") {
                    return currentPrice;
                } else {
                    // ROI Mode: Calculate based on THIS league's buyDay price
                    const buyEntry = leagueData.find(v => v.day === buyDay);
                    const buyPrice = buyEntry ? Number(buyEntry.price) : null;
                    
                    if (!buyPrice || buyPrice <= 0) return null;
                    return ((currentPrice - buyPrice) / buyPrice) * 100;
                }
            }).filter(v => v !== null && (mode === "roi" ? Number.isFinite(v) : v > 0));

            if (values.length > 0) {
                const min = Math.min(...values);
                const max = Math.max(...values);
                const avg = values.reduce((a, b) => a + b, 0) / values.length;
                
                // For tooltip display (price mode needs original prices, roi mode acts as value)
                // If ROI mode, we might want to know the "average price" too for display?
                // But structure expects min/max/avg to be the plotted values.
                // Let's add extra fields if needed, but for now plotting is primary.
                
                // If ROI mode, we also need 'originalAvg' for tooltip "Price" field?
                // We can calculate avg price separately if needed, but let's see what tooltip uses.
                // Tooltip uses: d.avg (for plot), d.originalAvg (for price display in ROI mode).
                
                let originalAvg = avg;
                if (mode === "roi") {
                     // Calculate average price separately for tooltip context
                     const prices = availableLeagues.map(league => {
                        const ld = itemData.leagues[league];
                        const e = ld?.find(v => v.day === d);
                        return e ? Number(e.price) : null;
                     }).filter(p => p !== null && p > 0);
                     if (prices.length > 0) {
                         originalAvg = prices.reduce((a, b) => a + b, 0) / prices.length;
                     } else {
                         originalAvg = 0;
                     }
                }

                dailyStats.push({
                    day: d,
                    min,
                    max,
                    avg,
                    originalAvg, // Used for tooltip price display
                    item: targetName,
                    icon: itemData.icon
                });
            }
        }
        
        if (dailyStats.length === 0) return null;

        return {
            name: targetName,
            icon: itemData.icon,
            stats: dailyStats
        };
    }).filter(d => d !== null);

  }, [selectedKeys, mode, filters.buyDay]); // Re-calculate when mode or buyDay changes

  // Renamed chartData -> renderData logic above, so we don't need the second useMemo
  // ... clean up old useMemo ...


  useEffect(() => {
    if (!svgRef.current || !width || !height) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    if (renderData.length === 0) {
      svg
        .append("text")
        .attr("x", width / 2)
        .attr("y", height / 2)
        .attr("text-anchor", "middle")
        .style("fill", "#A0AEC0")
        .style("font-size", "16px")
        .text(mode === "roi" ? "Cannot calculate ROI (missing Buy Day data)." : "No historical data available.");
      return;
    }

    const margin = { top: 20, right: 30, bottom: 40, left: 50 };
    const iw = Math.max(0, width - margin.left - margin.right);
    const ih = Math.max(0, height - margin.top - margin.bottom);

    const chart = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Flatten stats for scale calculation
    const allStats = renderData.flatMap(d => d.stats);

    // Scales
    // X Axis: Day Range
    const xMin = dayRange ? dayRange[0] : d3.min(allStats, d => d.day);
    const xMax = dayRange ? dayRange[1] : d3.max(allStats, d => d.day);

    const xScale = d3.scaleLinear()
      .domain([xMin, xMax])
      .range([0, iw]);

    // Y Axis: Price or ROI
    let yMin = d3.min(allStats, d => d.min);
    let yMax = d3.max(allStats, d => d.max);

    if (mode === "price") {
        yMin = yMin * 0.9;
        yMax = yMax * 1.1;
    } else {
        // ROI Mode: Add padding
        const pad = (yMax - yMin) * 0.1 || 10;
        yMin -= pad;
        yMax += pad;
    }

    const yScale = d3.scaleLinear()
      .domain([yMin, yMax])
      .range([ih, 0]);

    // --- Draw ---

    // 1. Grid
    const xAxis = d3.axisBottom(xScale).ticks(10).tickSize(-ih).tickPadding(10);
    const yAxis = d3.axisLeft(yScale).ticks(8).tickSize(-iw).tickPadding(10);

    chart.append("g")
      .attr("class", "grid x-grid")
      .attr("transform", `translate(0,${ih})`)
      .call(xAxis)
      .style("stroke-opacity", 0.1)
      .style("stroke", "white")
      .selectAll("text").style("fill", "#9ca3af");

    chart.append("g")
      .attr("class", "grid y-grid")
      .call(yAxis
        .tickFormat(d => mode === "roi" ? `${d}%` : d)
      )
      .style("stroke-opacity", 0.1)
      .style("stroke", "white")
      .selectAll("text").style("fill", "#9ca3af");

    // Zero line for ROI
    if (mode === "roi") {
        chart.append("line")
            .attr("x1", 0)
            .attr("x2", iw)
            .attr("y1", yScale(0))
            .attr("y2", yScale(0))
            .attr("stroke", "white")
            .attr("stroke-opacity", 0.3)
            .attr("stroke-dasharray", "4,4");
    }

    // Generators
    const areaGenerator = d3.area()
      .x(d => xScale(d.day))
      .y0(d => yScale(d.min))
      .y1(d => yScale(d.max))
      .curve(d3.curveMonotoneX); 

    const lineGenerator = d3.line()
      .x(d => xScale(d.day))
      .y(d => yScale(d.avg))
      .curve(d3.curveMonotoneX);

    // Draw for each item
    renderData.forEach(series => {
        const color = getColor ? getColor(series.name) : "#f59e0b";

        // Area (Min-Max Range)
        chart.append("path")
            .datum(series.stats)
            .attr("fill", color) 
            .attr("fill-opacity", 0.15) 
            .attr("d", areaGenerator);

        // Line (Average)
        chart.append("path")
            .datum(series.stats)
            .attr("fill", "none")
            .attr("stroke", color) 
            .attr("stroke-width", 2.0) 
            .attr("d", lineGenerator);
    });

    // Highlight Buy/Sell Window (if configured)
    if (filters.buyDay && filters.sellDay) {
        const bDay = parseInt(filters.buyDay);
        const sDay = parseInt(filters.sellDay);
        
        if (bDay < sDay) {
            const bx = xScale(bDay);
            const sx = xScale(sDay);
            
            // Draw window background
            chart.append("rect")
                .attr("x", bx)
                .attr("width", Math.max(0, sx - bx))
                .attr("y", 0)
                .attr("height", ih)
                .attr("fill", "#10b981") // Green
                .attr("fill-opacity", 0.05)
                .style("pointer-events", "none"); 

             // Vertical lines
             [bx, sx].forEach(xPos => {
                 chart.append("line")
                    .attr("x1", xPos)
                    .attr("x2", xPos)
                    .attr("y1", 0)
                    .attr("y2", ih)
                    .attr("stroke", "#10b981")
                    .attr("stroke-dasharray", "4,4")
                    .attr("stroke-opacity", 0.5);
             });
        }
    }

    // 5. Interaction / Tooltip Overlay
    const overlay = chart.append("rect")
      .attr("width", iw)
      .attr("height", ih)
      .attr("fill", "transparent")
      .style("cursor", "crosshair");

    const bisectDay = d3.bisector(d => d.day).left;

    overlay.on("mousemove", (event) => {
      const [mx, my] = d3.pointer(event);
      const dayVal = xScale.invert(mx);
      
      // Find closest item
      let closestItem = null;
      let minDistance = Infinity;
      let closestPoint = null;

      renderData.forEach(series => {
          const index = bisectDay(series.stats, dayVal, 1);
          const d0 = series.stats[index - 1];
          const d1 = series.stats[index];
          const d = (d1 && d0) ? (dayVal - d0.day > d1.day - dayVal ? d1 : d0) : (d0 || d1);
          
          if (d) {
              const py = yScale(d.avg);
              const dist = Math.abs(py - my);
              if (dist < minDistance) {
                  minDistance = dist;
                  closestItem = series;
                  closestPoint = d;
              }
          }
      });

      if (closestItem && closestPoint) {
        const d = closestPoint;
        const color = getColor ? getColor(closestItem.name) : "#f59e0b";
        const rect = containerRef.current.getBoundingClientRect();
        
        // Draw vertical guide line
        chart.selectAll(".guide-line").remove();
        chart.append("line")
            .attr("class", "guide-line")
            .attr("x1", xScale(d.day))
            .attr("x2", xScale(d.day))
            .attr("y1", 0)
            .attr("y2", ih)
            .attr("stroke", "white")
            .attr("stroke-opacity", 0.2)
            .style("pointer-events", "none"); // Prevent event interference

        // Draw circles for Avg, Min, Max
        chart.selectAll(".focus-circle").remove();
        const points = [
            { y: d.min, opacity: 0.5 },
            { y: d.max, opacity: 0.5 },
            { y: d.avg, opacity: 1.0 }
        ];

        points.forEach(p => {
            chart.append("circle")
                .attr("class", "focus-circle")
                .attr("cx", xScale(d.day))
                .attr("cy", yScale(p.y))
                .attr("r", 4)
                .attr("fill", color)
                .attr("fill-opacity", p.opacity)
                .attr("stroke", "#000")
                .style("pointer-events", "none"); // Prevent event interference
        });

        // Set Tooltip
        setTooltip({
          visible: true,
          x: event.clientX - rect.left,
          y: event.clientY - rect.top,
          name: d.item,
          icon: d.icon,
          day: `Day ${d.day}`,
          // Show original price even in ROI mode, show ROI in roi field
          price: mode === "roi" ? d.originalAvg : d.avg, 
          league: mode === "roi" 
            ? `Range: ${d.min.toFixed(1)}% ~ ${d.max.toFixed(1)}%` 
            : `Range: ${d.min.toFixed(1)} - ${d.max.toFixed(1)}`,
          unit: filters.currency === "divine" ? "div" : "c",
          // Pass ROI value if in ROI mode
          roi: mode === "roi" ? d.avg : null
        });
      }
    }).on("mouseleave", () => {
        chart.selectAll(".guide-line").remove();
        chart.selectAll(".focus-circle").remove();
        hideTooltip();
    });

  }, [renderData, width, height, dayRange, filters, getColor, mode]);

  return <svg ref={svgRef} width={width} height={height} className="block" />;
});

export default RangeChart;

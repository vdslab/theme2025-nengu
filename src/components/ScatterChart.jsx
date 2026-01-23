import React, { useEffect, useRef } from "react";
import * as d3 from "d3";
import { processedChartData, availableLeagues } from "../data/processedData.js";

const ScatterChart = ({
  data,
  filters,
  dayRange,
  width,
  height,
  containerRef,
  getColor,
  setTooltip,
  hideTooltip,
}) => {
  const svgRef = useRef(null);

  const findPrice = (values, day) => {
    if (!Array.isArray(values)) return null;
    const p = values.find((v) => v.day === day);
    const n = p ? Number(p.price) : null;
    return Number.isFinite(n) ? n : null;
  };

  // Find item in processedChartData by name
  const findItemData = (name) => {
    return processedChartData.find(d => d.name === name);
  };

  // ROI Risk Calculation (Standard Deviation of ROI across available leagues)
  const calcRoiRisk = (itemName, buyDay, sellDay) => {
    const item = findItemData(itemName);
    if (!item || !item.leagues) return 0; // fallback

    const rois = availableLeagues
      .map(league => {
        const leagueValues = item.leagues[league];
        const lBuy = findPrice(leagueValues, buyDay);
        const lSell = findPrice(leagueValues, sellDay);
        
        if (lBuy !== null && lSell !== null && lBuy > 0) {
           return (lSell - lBuy) / lBuy;
        }
        return null;
      })
      .filter(val => val !== null);

    if (rois.length > 1) {
      const mean = rois.reduce((a, b) => a + b, 0) / rois.length;
      const variance = rois.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / rois.length;
      return Math.sqrt(variance) * 100; // Return as %
    } else {
       return 0; 
    }
  };

  const buildPoints = () => {
    const buyDay = parseInt(filters.buyDay, 10) || 1;
    const sellDay = parseInt(filters.sellDay, 10) || buyDay + 1;

    const pts = [];
    (data || []).forEach((series) => {
      const values = series.values || [];
      const buy = findPrice(values, buyDay);
      const sell = findPrice(values, sellDay);
      if (!buy || !sell) return;

      const roi = ((sell - buy) / buy) * 100;
      const riskStd = calcRoiRisk(series.name, buyDay, sellDay);
      // Even if risk is 0, we plot it
      if (!Number.isFinite(roi)) return;

      pts.push({
        name: series.name,
        icon: series.icon,
        league: series.league || "",
        roi,
        riskStd, // This is now ROI Risk %
        buy,
        sell,
        buyDay,
        sellDay,
      });
    });

    return pts;
  };

  useEffect(() => {
    if (!svgRef.current) return;
    if (!width || !height) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const points = buildPoints();

    if (!points.length) {
      svg
        .append("text")
        .attr("x", width / 2)
        .attr("y", height / 2)
        .attr("text-anchor", "middle")
        .style("fill", "#A0AEC0")
        .style("font-size", "16px")
        .text("No data for Scatter (need Buy/Sell prices).");
      return;
    }

    const margin = { top: 10, right: 20, bottom: 40, left: 60 };
    const iw = Math.max(0, width - margin.left - margin.right);
    const ih = Math.max(0, height - margin.top - margin.bottom);

    const chart = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const xMax = d3.max(points, (d) => d.riskStd) || 1;
    const yMin = d3.min(points, (d) => d.roi) || 0;
    const yMax = d3.max(points, (d) => d.roi) || 1;

    const xPad = xMax * 0.1 || 1;
    const yPad = (yMax - yMin) * 0.1 || 5;

    const x = d3.scaleLinear().domain([0, xMax + xPad]).range([0, iw]);
    const y = d3.scaleLinear().domain([yMin - yPad, yMax + yPad]).range([ih, 0]);

    // Grid
    chart
      .append("g")
      .attr("transform", `translate(0,${ih})`)
      .call(d3.axisBottom(x).ticks(10).tickSize(-ih).tickFormat(""))
      .style("stroke-opacity", 0.1)
      .style("stroke", "white");

    chart
      .append("g")
      .call(d3.axisLeft(y).ticks(8).tickSize(-iw).tickFormat(""))
      .style("stroke-opacity", 0.1)
      .style("stroke", "white");

    // Axes
    chart
      .append("g")
      .attr("transform", `translate(0,${ih})`)
      .call(d3.axisBottom(x).ticks(10).tickFormat((d) => `±${Number(d).toFixed(1)}%`))
      .attr("color", "#718096")
      .style("font-size", "11px");

    chart
      .append("g")
      .call(
        d3.axisLeft(y).ticks(8).tickFormat((d) => `${d > 0 ? "+" : ""}${Number(d).toFixed(0)}%`)
      )
      .attr("color", "#718096")
      .style("font-size", "11px");

    // Labels
    chart
      .append("text")
      .attr("x", iw)
      .attr("y", ih + 34)
      .attr("text-anchor", "end")
      .style("fill", "#94A3B8")
      .style("font-size", "11px")
      .text("Risk (ROI Standard Deviation)");

    chart
      .append("text")
      .attr("x", 0)
      .attr("y", -2)
      .attr("text-anchor", "start")
      .style("fill", "#94A3B8")
      .style("font-size", "11px")
      .text("Mean ROI (Buy→Sell)");

    // Zero line (ROI)
    chart
      .append("line")
      .attr("x1", 0)
      .attr("x2", iw)
      .attr("y1", y(0))
      .attr("y2", y(0))
      .attr("stroke", "white")
      .attr("stroke-opacity", 0.25)
      .attr("stroke-dasharray", "4,4");

    // Points
    chart
      .append("g")
      .selectAll("circle")
      .data(points)
      .enter()
      .append("circle")
      .attr("cx", (d) => x(d.riskStd))
      .attr("cy", (d) => y(d.roi))
      .attr("r", 4)
      .attr("fill", (d) => getColor(d.name))
      .attr("fill-opacity", 0.9)
      .attr("stroke", "rgba(255,255,255,0.2)")
      .attr("stroke-width", 1)
      .style("cursor", "crosshair")
      .on("mousemove", (event, d) => {
        const rect = containerRef.current.getBoundingClientRect();
        setTooltip({
          visible: true,
          x: event.clientX - rect.left,
          y: event.clientY - rect.top,
          name: d.name,
          icon: d.icon,
          league: d.league,
          day: `Buy ${d.buyDay} → Sell ${d.sellDay}`,
          price: d.sell, // Tooltipはprice欄があるので一旦 sell を見せる
          roi: d.roi,
          unit: filters.currency === "divine" ? "div" : "c",
          riskStd: d.riskStd, // This is now ROI Risk
        });
      })
      .on("mouseleave", hideTooltip);
  }, [data, filters, dayRange, width, height]);

  return <svg ref={svgRef} width={width} height={height} className="block" />;
};

export default ScatterChart;

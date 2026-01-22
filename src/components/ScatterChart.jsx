import React, { useEffect, useRef } from "react";
import * as d3 from "d3";

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

  // 日次リターン σ（%）
  const calcRiskStd = (values, range) => {
    if (!Array.isArray(values) || values.length < 2) return null;

    const minD = range?.[0] ?? 1;
    const maxD = range?.[1] ?? 30;

    const sliced = values
      .filter((v) => v.day >= minD && v.day <= maxD)
      .sort((a, b) => a.day - b.day)
      .map((v) => ({ day: v.day, price: Number(v.price) }))
      .filter((v) => Number.isFinite(v.price) && v.price > 0);

    if (sliced.length < 2) return null;

    const rets = [];
    for (let i = 1; i < sliced.length; i++) {
      const prev = sliced[i - 1].price;
      const cur = sliced[i].price;
      if (prev > 0) {
        rets.push((cur - prev) / prev);
      }
    }
    if (rets.length < 2) return null;

    const dev = d3.deviation(rets);
    if (!Number.isFinite(dev)) return null;

    return dev * 100; // %表記
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
      const riskStd = calcRiskStd(values, dayRange);
      if (!Number.isFinite(roi) || !Number.isFinite(riskStd)) return;

      pts.push({
        name: series.name,
        icon: series.icon,
        league: series.league || "",
        roi,
        riskStd,
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
        .text("No data for Scatter (need Buy/Sell prices + enough days for risk σ).");
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
      .call(d3.axisBottom(x).ticks(10).tickFormat((d) => `${Number(d).toFixed(1)}%`))
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
      .text("Risk (σ of daily returns)");

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
          riskStd: d.riskStd,
        });
      })
      .on("mouseleave", hideTooltip);
  }, [data, filters, dayRange, width, height]);

  return <svg ref={svgRef} width={width} height={height} className="block" />;
};

export default ScatterChart;

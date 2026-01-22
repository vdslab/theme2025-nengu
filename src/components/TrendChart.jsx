import React, { useEffect, useRef } from "react";
import * as d3 from "d3";

const TrendChart = ({
  data,
  filters,
  dayRange,
  mode, // "price" | "roi"
  width,
  height,
  containerRef,
  getColor,
  setTooltip,
  hideTooltip,
}) => {
  const svgRef = useRef(null);

  useEffect(() => {
    if (!svgRef.current) return;
    if (!width || !height) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    if (!data || data.length === 0) {
      svg
        .append("text")
        .attr("x", width / 2)
        .attr("y", height / 2)
        .attr("text-anchor", "middle")
        .style("fill", "#A0AEC0")
        .style("font-size", "16px")
        .text("No items selected. Please select items from the table below.");
      return;
    }

    const margin = { top: 10, right: 20, bottom: 30, left: 60 };
    const iw = Math.max(0, width - margin.left - margin.right);
    const ih = Math.max(0, height - margin.top - margin.bottom);

    const chart = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const xDomain = dayRange || [1, 30];
    const buyDay = parseInt(filters.buyDay, 10) || 1;

    // --- Prepare data ---
    let renderData = [];

    if (mode === "price") {
      renderData = (data || []).map((series) => ({
        ...series,
        renderValues: (series.values || [])
          .filter((v) => v.day >= xDomain[0] && v.day <= xDomain[1])
          .map((v) => ({ ...v, value: Number(v.price) }))
          .filter((v) => Number.isFinite(v.value)),
      }));
    } else {
      renderData = (data || [])
        .map((series) => {
          const values = series.values || [];
          const basePoint = values.find((v) => v.day === buyDay);
          const basePrice = basePoint ? Number(basePoint.price) : null;
          if (!basePrice || basePrice <= 0) return null;

          const renderValues = values
            .filter((v) => v.day >= xDomain[0] && v.day <= xDomain[1])
            .map((v) => {
              const price = Number(v.price);
              if (!Number.isFinite(price)) return null;
              const roi = ((price - basePrice) / basePrice) * 100;
              return { ...v, value: roi, originalPrice: price };
            })
            .filter(Boolean);

          if (!renderValues.length) return null;
          return { ...series, renderValues };
        })
        .filter(Boolean);
    }

    if (renderData.length === 0 && mode === "roi") {
      svg
        .append("text")
        .attr("x", width / 2)
        .attr("y", height / 2)
        .attr("text-anchor", "middle")
        .style("fill", "#A0AEC0")
        .text(`No data available for ROI calculation based on Day ${buyDay}.`);
      return;
    }

    // --- Scales ---
    const allValues = renderData.flatMap((s) => s.renderValues.map((v) => v.value));
    let yMin = d3.min(allValues);
    let yMax = d3.max(allValues);

    if (mode === "price") {
      yMin = 0;
      yMax = (yMax || 0) * 1.1;
    } else {
      const pad = (yMax - yMin) * 0.1 || 10;
      yMin = (yMin || 0) - pad;
      yMax = (yMax || 0) + pad;
    }

    const xScale = d3.scaleLinear().domain(xDomain).range([0, iw]);
    const yScale = d3.scaleLinear().domain([yMin, yMax]).range([ih, 0]);

    const isKeepers = filters.compareLeagues === "Keepers";
    const formatTimeLabel = (d) => {
      if (!isKeepers) return `Day ${d}`;
      const date = new Date();
      date.setDate(date.getDate() - (7 - d));
      return date.toLocaleDateString(undefined, { month: "numeric", day: "numeric" });
    };

    // Clip
    const clipId = `trend-clip-${Math.random().toString(36).slice(2)}`;
    svg
      .append("defs")
      .append("clipPath")
      .attr("id", clipId)
      .append("rect")
      .attr("width", iw)
      .attr("height", ih);

    // Grid
    chart
      .append("g")
      .attr("transform", `translate(0,${ih})`)
      .call(d3.axisBottom(xScale).ticks(10).tickSize(-ih).tickFormat(""))
      .style("stroke-opacity", 0.1)
      .style("stroke", "white");

    chart
      .append("g")
      .call(d3.axisLeft(yScale).ticks(8).tickSize(-iw).tickFormat(""))
      .style("stroke-opacity", 0.1)
      .style("stroke", "white");

    // Zero line
    if (mode === "roi") {
      chart
        .append("line")
        .attr("x1", 0)
        .attr("x2", iw)
        .attr("y1", yScale(0))
        .attr("y2", yScale(0))
        .attr("stroke", "white")
        .attr("stroke-opacity", 0.3)
        .attr("stroke-dasharray", "4,4");
    }

    const content = chart.append("g").attr("clip-path", `url(#${clipId})`);

    // Axes
    const unitSuffix = filters.currency === "divine" ? "div" : "c";

    chart
      .append("g")
      .attr("transform", `translate(0, ${ih})`)
      .call(d3.axisBottom(xScale).ticks(10).tickFormat((d) => formatTimeLabel(d)))
      .attr("color", "#718096")
      .style("font-size", "11px");

    chart
      .append("g")
      .call(
        d3
          .axisLeft(yScale)
          .ticks(8)
          .tickFormat((d) =>
            mode === "roi"
              ? `${d > 0 ? "+" : ""}${Number(d).toFixed(0)}%`
              : `${d3.format("~s")(d)}${unitSuffix}`
          )
      )
      .attr("color", "#718096")
      .style("font-size", "11px");

    // Highlight range
    if (filters.showHighlight && filters.buyDay && filters.sellDay) {
      const xBuy = xScale(parseInt(filters.buyDay, 10));
      const xSell = xScale(parseInt(filters.sellDay, 10));
      if (!Number.isNaN(xBuy) && !Number.isNaN(xSell)) {
        content
          .append("rect")
          .attr("x", Math.min(xBuy, xSell))
          .attr("y", 0)
          .attr("width", Math.abs(xSell - xBuy))
          .attr("height", ih)
          .attr("fill", "rgba(72, 187, 120, 0.15)");
      }
    }

    const line = d3
      .line()
      .x((d) => xScale(d.day))
      .y((d) => yScale(d.value))
      .curve(d3.curveMonotoneX);

    renderData.forEach((series) => {
      const c = getColor(series.name);
      const league = series.league || "";

      if (!series.renderValues?.length) return;

      let opacity = 1;
      let strokeDash = "0";

      if (league && filters.selectedSourceLeagues?.length) {
        const idx = filters.selectedSourceLeagues.indexOf(league);
        if (idx !== -1) opacity = Math.max(0.3, 1 - idx * 0.4);
      }

      // line
      content
        .append("path")
        .datum(series.renderValues)
        .attr("fill", "none")
        .attr("stroke", c)
        .attr("stroke-width", 2)
        .attr("stroke-opacity", opacity)
        .attr("stroke-dasharray", strokeDash)
        .attr("d", line);

      // hit area
      content
        .append("path")
        .datum(series.renderValues)
        .attr("fill", "none")
        .attr("stroke", "transparent")
        .attr("stroke-width", 20)
        .style("cursor", "crosshair")
        .attr("d", line)
        .on("mousemove", (event) => {
          const [mx] = d3.pointer(event, content.node());
          const day = Math.round(xScale.invert(mx));
          const v = series.renderValues.find((d) => d.day === day);
          if (!v) return;

          const rect = containerRef.current.getBoundingClientRect();

          setTooltip({
            visible: true,
            x: event.clientX - rect.left,
            y: event.clientY - rect.top,
            name: series.name,
            icon: series.icon,
            league,
            day: formatTimeLabel(v.day),
            price: mode === "roi" ? v.originalPrice : v.value,
            roi: mode === "roi" ? v.value : null,
            unit: filters.currency === "divine" ? "div" : "c",
            riskStd: null,
          });
        })
        .on("mouseleave", hideTooltip);
    });
  }, [data, filters, dayRange, mode, width, height]);

  return <svg ref={svgRef} width={width} height={height} className="block" />;
};

export default TrendChart;

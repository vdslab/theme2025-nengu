import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import Tooltip from "./Tooltip";

const PriceChart = ({ data, filters, dayRange }) => {
  const d3Container = useRef(null);

  const [tooltip, setTooltip] = useState({
    visible: false,
    x: 0,
    y: 0,
    name: "",
    day: null,
    price: null,
  });

  useEffect(() => {
    if (!data || data.length === 0 || !d3Container.current) return;

    const svg = d3.select(d3Container.current);
    svg.selectAll("*").remove();

    const margin = { top: 20, right: 120, bottom: 40, left: 60 };
    const width = 800 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    const chart = svg
      .attr(
        "viewBox",
        `0 0 ${width + margin.left + margin.right} ${
          height + margin.top + margin.bottom
        }`
      )
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const allValues = data.flatMap(d => d.values.map(v => v.price));
    const yMax = d3.max(allValues);

    const xScale = d3
      .scaleLinear()
      .domain(dayRange || [1, 30])
      .range([0, width]);

    const yScale = d3
      .scaleLinear()
      .domain([0, yMax * 1.1])
      .range([height, 0]);

    // ===== Axes =====
    chart
      .append("g")
      .attr("transform", `translate(0, ${height})`)
      .call(d3.axisBottom(xScale).ticks(10).tickFormat(d => `Day ${d}`));

    chart
      .append("g")
      .call(d3.axisLeft(yScale).ticks(8).tickFormat(d => `${d.toFixed(2)}c`));

    svg.selectAll(".domain").remove();

    // ===== Buy / Sell highlight =====
    if (filters.buyDay && filters.sellDay) {
      chart
        .append("rect")
        .attr("x", xScale(+filters.buyDay))
        .attr("y", 0)
        .attr("width", xScale(+filters.sellDay) - xScale(+filters.buyDay))
        .attr("height", height)
        .attr("fill", "green")
        .attr("opacity", 0.1);
    }

    const line = d3
      .line()
      .x(d => xScale(d.day))
      .y(d => yScale(d.price))
      .curve(d3.curveMonotoneX);

    const colors = d3.scaleOrdinal(d3.schemeCategory10);

    // ===== Lines + Hit Areas =====
    data.forEach((series, i) => {
      // 見える線
      chart
        .append("path")
        .datum(series.values)
        .attr("fill", "none")
        .attr("stroke", colors(i))
        .attr("stroke-width", 2)
        .attr("d", line);

      // ヒット判定用の透明線
      chart
        .append("path")
        .datum(series.values)
        .attr("fill", "none")
        .attr("stroke", "transparent")
        .attr("stroke-width", 16) // ← 操作感はここ
        .style("pointer-events", "stroke")
        .attr("d", line)
        .on("mousemove", (event) => {
          const [mx] = d3.pointer(event);
          const day = Math.round(xScale.invert(mx));

          const v = series.values.find(d => d.day === day);
          if (!v) return;

          const rect = d3Container.current.getBoundingClientRect();

          setTooltip({
            visible: true,
            x: event.clientX - rect.left,
            y: event.clientY - rect.top,
            name: series.name,
            day: v.day,
            price: v.price,
          });
        })
        .on("mouseleave", () =>
          setTooltip(t => ({ ...t, visible: false }))
        );

      // ラベル
      const last = series.values.at(-1);
      if (last) {
        chart
          .append("text")
          .attr(
            "transform",
            `translate(${xScale(last.day) + 5},${yScale(last.price)})`
          )
          .attr("dy", "0.35em")
          .style("fill", colors(i))
          .style("font-size", "12px")
          .text(series.name);
      }
    });
  }, [data, filters, dayRange]);

  return (
    <div className="bg-gray-800 p-4 rounded-lg">
      <h3 className="text-lg font-bold text-white mb-2">
        Top Investment Candidates
      </h3>

      <div className="relative w-full overflow-x-auto">
        <svg ref={d3Container} width={800} height={400} />
        <Tooltip {...tooltip} />
      </div>
    </div>
  );
};

export default PriceChart;

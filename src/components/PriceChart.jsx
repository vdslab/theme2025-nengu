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
    league: "",
  });

  useEffect(() => {
    // --- デバッグ（まずここで data が空じゃないかを見る） ---
    console.log("[PriceChart] data length =", data?.length, data);

    if (!d3Container.current) return;

    const svg = d3.select(d3Container.current);
    svg.selectAll("*").remove();

    // data が空ならメッセージだけ出す
    if (!data || data.length === 0) {
      svg
        .attr("viewBox", "0 0 800 200")
        .append("text")
        .attr("x", 20)
        .attr("y", 40)
        .attr("fill", "#A0AEC0")
        .style("font-size", "14px")
        .text("No data to display (data is empty).");
      return;
    }

    const margin = { top: 20, right: 220, bottom: 40, left: 80 };
    const width = 800 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    const chart = svg
      .attr(
        "viewBox",
        `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`
      )
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const xDomain = dayRange || [1, 30];

    // ---- 重要：price を必ず数値化して yMax を取る（NaN/0対策） ----
    const valuesInDomain = data.flatMap((s) =>
      (s.values || [])
        .filter((v) => v.day >= xDomain[0] && v.day <= xDomain[1])
        .map((v) => Number(v.price))
        .filter((p) => Number.isFinite(p))
    );

    const yMaxRaw = d3.max(valuesInDomain);
    const yMax = Number.isFinite(yMaxRaw) ? yMaxRaw : 0;

    // yMax が 0 だと domain が [0,0] になって line が NaN → 無描画になるので最低値を入れる
    const yTop = Math.max(1, yMax * 1.1);

    const xScale = d3.scaleLinear().domain(xDomain).range([0, width]);
    const yScale = d3.scaleLinear().domain([0, yTop]).range([height, 0]);

    // 色をリーグで固定（league が無いデータでも "Unknown" で扱う）
    const leagues = Array.from(new Set(data.map((s) => s.league || "Unknown")));
    const colors = d3.scaleOrdinal().domain(leagues).range(d3.schemeCategory10);

    const clipId = `chart-area-clip-${Math.random().toString(36).slice(2)}`;

    svg
      .append("defs")
      .append("clipPath")
      .attr("id", clipId)
      .append("rect")
      .attr("width", width)
      .attr("height", height);

    const contentGroup = chart.append("g").attr("clip-path", `url(#${clipId})`);

    // Axes
    chart
      .append("g")
      .attr("class", "x-axis")
      .attr("transform", `translate(0, ${height})`)
      .call(d3.axisBottom(xScale).ticks(10).tickFormat((d) => `Day ${d}`));

    chart
      .append("g")
      .attr("class", "y-axis")
      .call(d3.axisLeft(yScale).ticks(8).tickFormat(d3.format("~s")));

    svg
      .selectAll(".x-axis path, .y-axis path, .x-axis line, .y-axis line")
      .attr("stroke", "#4A5568");

    svg
      .selectAll(".x-axis text, .y-axis text")
      .attr("fill", "#A0AEC0")
      .style("font-size", "12px");

    svg.selectAll(".domain").remove();

    // highlight
    if (filters?.showHighlight && filters?.buyDay && filters?.sellDay) {
      const buy = parseInt(filters.buyDay, 10);
      const sell = parseInt(filters.sellDay, 10);

      if (Number.isFinite(buy) && Number.isFinite(sell) && sell > buy) {
        contentGroup
          .append("rect")
          .attr("x", xScale(buy))
          .attr("y", 0)
          .attr("width", xScale(sell) - xScale(buy))
          .attr("height", height)
          .attr("fill", "green")
          .attr("opacity", 0.1);
      }
    }

    // line（ここでも price 数値化）
    const line = d3
      .line()
      .x((d) => xScale(d.day))
      .y((d) => yScale(Number(d.price)))
      .defined((d) => Number.isFinite(Number(d.price)))
      .curve(d3.curveMonotoneX);

    // Lines
    data.forEach((series) => {
      const league = series.league || "Unknown";
      const c = colors(league);

      const seriesValues = (series.values || []).filter(
        (v) => v.day >= xDomain[0] && v.day <= xDomain[1]
      );

      // データが無い series はスキップ
      if (seriesValues.length === 0) return;

      // Visible line
      contentGroup
        .append("path")
        .datum(seriesValues)
        .attr("fill", "none")
        .attr("stroke", c)
        .attr("stroke-width", 2)
        .attr("d", line);

      // Hit area
      contentGroup
        .append("path")
        .datum(seriesValues)
        .attr("fill", "none")
        .attr("stroke", "transparent")
        .attr("stroke-width", 16)
        .style("pointer-events", "stroke")
        .attr("d", line)
        .on("mousemove", (event) => {
          const [mx] = d3.pointer(event);
          const day = Math.round(xScale.invert(mx));

          const v = seriesValues.find((d) => d.day === day);
          if (!v) return;

          const rect = d3Container.current.getBoundingClientRect();

          setTooltip({
            visible: true,
            x: event.clientX - rect.left,
            y: event.clientY - rect.top,
            name: series.name,
            league,
            day: v.day,
            price: Number(v.price),
          });
        })
        .on("mouseleave", () => setTooltip((t) => ({ ...t, visible: false })));

      // Label
      const lastValue = seriesValues[seriesValues.length - 1];
      if (lastValue) {
        chart
          .append("text")
          .attr(
            "transform",
            `translate(${xScale(lastValue.day) + 6}, ${yScale(Number(lastValue.price))})`
          )
          .attr("dy", "0.35em")
          .attr("text-anchor", "start")
          .style("fill", c)
          .style("font-size", "12px")
          .text(`${series.name} (${league})`);
      }
    });

    // Legend（リーグ単位）
    const legend = chart.append("g").attr("transform", `translate(${width + 10}, 10)`);

    leagues.forEach((league, i) => {
      const row = legend.append("g").attr("transform", `translate(0, ${i * 20})`);
      const c = colors(league);

      row.append("rect").attr("width", 10).attr("height", 10).attr("fill", c);

      row
        .append("text")
        .attr("x", 15)
        .attr("y", 10)
        .attr("text-anchor", "start")
        .style("fill", "#A0AEC0")
        .style("font-size", "12px")
        .text(league);
    });
  }, [data, filters, dayRange]);

  return (
    <div className="bg-gray-800 p-4 rounded-lg">
      <h3 className="text-lg font-bold text-white mb-2">
        League Comparison (Top Candidates)
      </h3>
      <div className="relative overflow-x-auto">
        <svg className="d3-component" ref={d3Container} width="1200" height="600" />
        <Tooltip {...tooltip} />
      </div>
    </div>
  );
};

export default PriceChart;

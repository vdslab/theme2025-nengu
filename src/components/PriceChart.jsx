import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

const PriceChart = ({ data, filters, dayRange }) => {
  const d3Container = useRef(null);

  useEffect(() => {
    if (data && data.length > 0 && d3Container.current) {
      const svg = d3.select(d3Container.current);
      svg.selectAll("*").remove(); // Clear SVG before redrawing

      const margin = { top: 20, right: 120, bottom: 40, left: 80 };
      const width = 800 - margin.left - margin.right;
      const height = 400 - margin.top - margin.bottom;

      const chart = svg
        .attr('viewBox', `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

      const xDomain = dayRange || [1, 30];
      
      const valuesInDomain = data.flatMap(d => 
        d.values
         .filter(v => v.day >= xDomain[0] && v.day <= xDomain[1])
         .map(v => v.price)
      );
      
      const yMax = d3.max(valuesInDomain) || 0; // Handle case with no data in domain

      const xScale = d3.scaleLinear()
        .domain(xDomain) // Use the xDomain for the x-axis
        .range([0, width]);

      const yScale = d3.scaleLinear()
        .domain([0, yMax * 1.1]) // Add some padding to the top
        .range([height, 0]);

      const clipId = `chart-area-clip-${Math.random().toString(36).substr(2, 9)}`;

      svg.append("defs").append("clipPath")
        .attr("id", clipId)
        .append("rect")
        .attr("width", width)
        .attr("height", height);

      const contentGroup = chart.append('g')
        .attr('clip-path', `url(#${clipId})`);

      // Add Axes
      chart.append('g')
        .attr('class', 'x-axis')
        .attr('transform', `translate(0, ${height})`)
        .call(d3.axisBottom(xScale).ticks(10).tickFormat(d => `Day ${d}`));

      chart.append('g')
        .attr('class', 'y-axis')
        .call(d3.axisLeft(yScale).ticks(8).tickFormat(d3.format("~s")));
        
      svg.selectAll('.x-axis path, .y-axis path, .x-axis line, .y-axis line')
         .attr('stroke', '#4A5568');
         
      svg.selectAll('.x-axis text, .y-axis text')
         .attr('fill', '#A0AEC0')
         .style('font-size', '12px');
         
      svg.selectAll('.domain').remove();
      
      // Add highlight rect for buy/sell period
      if (filters.showHighlight && filters.buyDay && filters.sellDay) {
        contentGroup.append('rect')
          .attr('x', xScale(parseInt(filters.buyDay, 10)))
          .attr('y', 0)
          .attr('width', xScale(parseInt(filters.sellDay, 10)) - xScale(parseInt(filters.buyDay, 10)))
          .attr('height', height)
          .attr('fill', 'green')
          .attr('opacity', 0.1);
      }

      const line = d3.line()
        .x(d => xScale(d.day))
        .y(d => yScale(d.price))
        .curve(d3.curveMonotoneX);

      const colors = d3.scaleOrdinal(d3.schemeCategory10);

      data.forEach((series, i) => {
        contentGroup.append('path')
          .datum(series.values)
          .attr('fill', 'none')
          .attr('stroke', colors(i))
          .attr('stroke-width', 2)
          .attr('d', line);

        const lastValue = series.values[series.values.length-1];
        if (lastValue && lastValue.day >= xDomain[0] && lastValue.day <= xDomain[1]) {
            chart.append('text')
            .attr('transform', `translate(${xScale(lastValue.day) + 5}, ${yScale(lastValue.price)})`)
            .attr('dy', '0.35em')
            .attr('text-anchor', 'start')
            .style('fill', colors(i))
            .style('font-size', '12px')
            .text(series.name);
        }
      });
      
      // Add Legend
      const legend = chart.append('g')
        .attr('transform', `translate(10, 10)`); // Position at top left inside chart area with padding

      data.forEach((series, i) => {
        const legendRow = legend.append('g')
          .attr('transform', `translate(0, ${i * 20})`); // 20px spacing between legend items

        legendRow.append('rect')
          .attr('width', 10)
          .attr('height', 10)
          .attr('fill', colors(i));

        legendRow.append('text')
          .attr('x', 15)
          .attr('y', 10)
          .attr('text-anchor', 'start')
          .style('fill', '#A0AEC0')
          .style('font-size', '12px')
          .text(series.name);
      });
    }
  }, [data, filters, dayRange]);

  return (
    <div className="bg-gray-800 p-4 rounded-lg">
      <h3 className="text-lg font-bold text-white mb-2">Top Investment Candidates</h3>
      <div className="overflow-x-auto">
        <svg
          className="d3-component"
          ref={d3Container}
          width="1200"
          height="600"
        />
      </div>
    </div>
  );
};

export default PriceChart;

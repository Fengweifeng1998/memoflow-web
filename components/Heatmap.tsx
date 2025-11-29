import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { Note } from '../types';

interface HeatmapProps {
  notes: Note[];
}

const Heatmap: React.FC<HeatmapProps> = ({ notes }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !notes) return;

    // Clear previous
    d3.select(svgRef.current).selectAll("*").remove();

    // Process data: Count notes per day
    const dayCounts = d3.rollup(
      notes,
      (v) => v.length,
      (d: Note) => new Date(d.createdAt).toISOString().split('T')[0]
    );

    // Generate dates for the last 1 year
    const today = new Date();
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(today.getFullYear() - 1);
    
    const dateRange = d3.timeDays(oneYearAgo, today);

    // Config
    const cellSize = 10;
    const cellGap = 2;
    const weekWidth = cellSize + cellGap;
    const height = (cellSize + cellGap) * 7 + 20; // 7 days + padding
    // Calculate width based on weeks
    const width = Math.ceil(dateRange.length / 7) * weekWidth + 40;

    const svg = d3.select(svgRef.current)
      .attr("width", "100%")
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("preserveAspectRatio", "xMinYMin meet");

    const g = svg.append("g").attr("transform", "translate(20, 10)");

    // Color scale (Green shades like Flomo/GitHub)
    // Cast to number[] to handle TS inference issue where spread args might be unknown
    const values = Array.from(dayCounts.values()) as number[];
    const maxCount = Math.max(...values, 1);
    
    const colorScale = d3.scaleThreshold<number, string>()
        .domain([1, 2, 4, 6]) 
        .range(["#f1f5f9", "#bbf7d0", "#86efac", "#4ade80", "#22c55e"]);

    // Draw cells
    g.selectAll("rect")
      .data(dateRange)
      .enter()
      .append("rect")
      .attr("width", cellSize)
      .attr("height", cellSize)
      .attr("x", (d) => d3.timeWeek.count(oneYearAgo, d) * weekWidth)
      .attr("y", (d) => d.getDay() * (cellSize + cellGap))
      .attr("rx", 2)
      .attr("fill", (d) => {
        const dateStr = d.toISOString().split('T')[0];
        const count = dayCounts.get(dateStr) || 0;
        return count === 0 ? "#f1f5f9" : colorScale(count);
      })
      .append("title")
      .text((d) => {
        const dateStr = d.toISOString().split('T')[0];
        const count = dayCounts.get(dateStr) || 0;
        return `${dateStr}: ${count} memos`;
      });

  }, [notes]);

  return (
    <div className="w-full overflow-x-auto no-scrollbar">
      <svg ref={svgRef} className="block mx-auto"></svg>
    </div>
  );
};

export default Heatmap;
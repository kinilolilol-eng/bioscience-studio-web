import { useEffect, useRef, useState } from 'react';
import { number, shortDate } from '../format.js';

// Coordinates only: all concentrations, exposures and observed values come from the API.
export default function Chart({ series, unit, title, markers = [], observations = false }) {
  const container = useRef(null);
  const [width, setWidth] = useState(720);
  useEffect(() => {
    const observer = new ResizeObserver(([entry]) => setWidth(Math.max(280, Math.floor(entry.contentRect.width))));
    if (container.current) observer.observe(container.current);
    return () => observer.disconnect();
  }, []);
  const lines = series.map((line) => ({ ...line, points: line.times.map((time, index) => ({ time: new Date(time).getTime(), value: line.values[index], original: time })).filter((point) => Number.isFinite(point.time) && Number.isFinite(point.value)) }));
  const points = lines.flatMap((line) => line.points);
  if (!points.length) return null;
  const height = 236;
  const left = 59, right = width - 20, top = 18, bottom = height - 38;
  const start = Math.min(...points.map((point) => point.time));
  const end = Math.max(...points.map((point) => point.time));
  const low = Math.min(...points.map((point) => point.value));
  const high = Math.max(...points.map((point) => point.value));
  const yLow = observations ? low : Math.min(0, low);
  const spread = high - yLow || Math.abs(high) || 1;
  const x = (time) => end === start ? (left + right) / 2 : left + ((time - start) / (end - start)) * (right - left);
  const y = (value) => high === yLow ? (top + bottom) / 2 : bottom - ((value - yLow) / spread) * (bottom - top);
  const ticks = high === yLow ? [high] : [yLow, yLow + spread / 2, high];
  const visibleMarkers = markers.filter((marker) => new Date(marker.occurred_at).getTime() >= start && new Date(marker.occurred_at).getTime() <= end);
  return <figure className="chart" ref={container}><figcaption><span>{title}</span><span className="chart-unit">{unit || 'Observed value'}</span></figcaption>
    <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`${title}. ${observations ? 'Actual observations only.' : 'Server-calculated exposure curves.'} Values in ${unit || 'configured units'}.`}>
      {ticks.map((tick, index) => <g key={index}><line x1={left} x2={right} y1={y(tick)} y2={y(tick)} className="chart-grid" /><text x={left - 12} y={y(tick) + 4} textAnchor="end">{number(tick)}</text></g>)}
      {visibleMarkers.map((marker) => <g key={marker.id || marker.occurred_at}><line x1={x(new Date(marker.occurred_at).getTime())} x2={x(new Date(marker.occurred_at).getTime())} y1={top} y2={bottom} className="chart-marker" /><title>{`${marker.title} · ${new Date(marker.occurred_at).toLocaleString()}`}</title></g>)}
      {lines.map((line, index) => <g key={line.label || index}><polyline points={line.points.map((point) => `${x(point.time)},${y(point.value)}`).join(' ')} fill="none" className={`chart-line chart-line-${index} ${line.dashed ? 'chart-dashed' : ''}`} />{(observations || line.points.length === 1) && line.points.map((point, pointIndex) => <circle key={pointIndex} cx={x(point.time)} cy={y(point.value)} r="4" className={`chart-point chart-point-${index}`}><title>{`${new Date(point.original).toLocaleString()} · ${number(point.value)} ${unit || ''}`}</title></circle>)}</g>)}
      <text x={left} y={height - 10}>{shortDate(start)}</text>{end !== start && <text x={right} y={height - 10} textAnchor="end">{shortDate(end)}</text>}
    </svg>
    <div className="chart-legend">{lines.map((line, index) => <span key={line.label || index}><i className={`legend-line legend-line-${index} ${line.dashed ? 'legend-dashed' : ''}`} />{line.label}</span>)}{visibleMarkers.length > 0 && <span><i className="legend-marker" />Protocol change</span>}</div>
  </figure>;
}

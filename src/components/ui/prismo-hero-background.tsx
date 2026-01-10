"use client";

import { useMemo } from "react";

interface PrismoHeroBackgroundProps {
  className?: string;
  showGridLines?: boolean;
  gridLineCount?: number;
}

// Ellipse configuration matching prismo-react
const ellipseConfig = [
  { color: "rgba(138, 67, 225, 1)", top: 207, left: 0 },    // Purple
  { color: "rgba(213, 17, 253, 1)", top: 363, left: 37 },   // Pink
  { color: "rgba(239, 123, 22, 1)", top: 0, left: 213 },    // Orange
  { color: "rgba(255, 47, 47, 1)", top: 80, left: 9 },      // Red
];

export function PrismoHeroBackground({
  className = "",
  showGridLines = true,
  gridLineCount = 24,
}: PrismoHeroBackgroundProps) {
  const gridLines = useMemo(
    () => Array.from({ length: gridLineCount }, (_, i) => i),
    [gridLineCount]
  );

  return (
    <div className={`prismo-hero-bg ${className}`}>
      {/* Left Abstract - Two groups of ellipses */}
      <div className="prismo-abstract prismo-abstract-left">
        <div className="prismo-ellipse-group">
          {ellipseConfig.map((ellipse, i) => (
            <div
              key={`left-1-${i}`}
              className="prismo-ellipse"
              style={{
                background: ellipse.color,
                top: `${ellipse.top}px`,
                left: `${ellipse.left}px`,
              }}
            />
          ))}
        </div>
        <div className="prismo-ellipse-group">
          {ellipseConfig.map((ellipse, i) => (
            <div
              key={`left-2-${i}`}
              className="prismo-ellipse"
              style={{
                background: ellipse.color,
                top: `${ellipse.top}px`,
                left: `${ellipse.left}px`,
              }}
            />
          ))}
        </div>
      </div>

      {/* Right Abstract - Two groups of ellipses (rotated 180deg) */}
      <div className="prismo-abstract prismo-abstract-right">
        <div className="prismo-ellipse-group">
          {ellipseConfig.map((ellipse, i) => (
            <div
              key={`right-1-${i}`}
              className="prismo-ellipse"
              style={{
                background: ellipse.color,
                top: `${ellipse.top}px`,
                left: `${ellipse.left}px`,
              }}
            />
          ))}
        </div>
        <div
          className="prismo-ellipse-group"
          style={{ transform: "rotate(-25deg)", top: "20px", left: "-50px" }}
        >
          {ellipseConfig.map((ellipse, i) => (
            <div
              key={`right-2-${i}`}
              className="prismo-ellipse"
              style={{
                background: ellipse.color,
                top: `${ellipse.top}px`,
                left: `${ellipse.left}px`,
              }}
            />
          ))}
        </div>
      </div>

      {/* Vertical Grid Lines */}
      {showGridLines && (
        <div className="prismo-grid-lines">
          {gridLines.map((i) => (
            <div key={i} className="prismo-grid-line" />
          ))}
        </div>
      )}

      {/* Gradient overlays - Order matches Prismo original: top first, then bottom */}
      <div className="prismo-gradient-top" />
      <div className="prismo-gradient-bottom" />

      {/* Noise texture - Using Prismo's original texture */}
      <div className="prismo-noise" />
    </div>
  );
}

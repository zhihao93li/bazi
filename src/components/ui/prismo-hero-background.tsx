"use client";

import { useMemo } from "react";

interface PrismoHeroBackgroundProps {
  className?: string;
  gridCount?: number;
  showLeftGlow?: boolean;
  showRightGlow?: boolean;
  glowColors?: string[];
  backgroundColor?: string;
  showTopGradient?: boolean;
  showBottomGradient?: boolean;
  noiseOpacity?: number;
}

// Exact values from Prismo React reference
const DEFAULT_GLOW_COLORS = [
  'rgba(138, 67, 225, 1)',   // Purple
  'rgba(213, 17, 253, 1)',   // Pink
  'rgba(239, 123, 22, 1)',   // Orange
  'rgba(255, 47, 47, 1)',    // Red
];

const ELLIPSE_POSITIONS = [
  { top: '207px', left: '0' },
  { top: '363px', left: '37px' },
  { top: '0', left: '213px' },
  { top: '80px', left: '9px' },
];

export function PrismoHeroBackground({
  className = "",
  gridCount = 24,
  showLeftGlow = true,
  showRightGlow = true,
  glowColors = DEFAULT_GLOW_COLORS,
  backgroundColor = "var(--light-95)",
  showTopGradient = true,
  showBottomGradient = true,
  noiseOpacity = 0.75, // Exact match
}: PrismoHeroBackgroundProps) {
  // Generate grid lines
  const gridLines = useMemo(() => Array.from({ length: gridCount }, (_, i) => i), [gridCount]);

  return (
    <div 
      className={`prismo-hero-bg ${className}`}
      style={{ backgroundColor }}
    >
      {/* Left Abstract */}
      {showLeftGlow && (
        <div className="prismo-abstract-left">
          <div className="prismo-ellipse-group">
            {glowColors.map((color, i) => (
              <div 
                key={`l1-${i}`} 
                className="prismo-ellipse" 
                style={{ background: color, ...ELLIPSE_POSITIONS[i] }} 
              />
            ))}
          </div>
          <div className="prismo-ellipse-group">
            {glowColors.map((color, i) => (
              <div 
                key={`l2-${i}`} 
                className="prismo-ellipse" 
                style={{ background: color, ...ELLIPSE_POSITIONS[i] }} 
              />
            ))}
          </div>
        </div>
      )}

      {/* Right Abstract */}
      {showRightGlow && (
        <div className="prismo-abstract-right">
          <div className="prismo-ellipse-group">
            {glowColors.map((color, i) => (
              <div 
                key={`r1-${i}`} 
                className="prismo-ellipse" 
                style={{ background: color, ...ELLIPSE_POSITIONS[i] }} 
              />
            ))}
          </div>
          <div 
            className="prismo-ellipse-group"
            style={{ transform: 'rotate(-25deg)', top: '20px', left: '-50px' }}
          >
            {glowColors.map((color, i) => (
              <div 
                key={`r2-${i}`} 
                className="prismo-ellipse" 
                style={{ background: color, ...ELLIPSE_POSITIONS[i] }} 
              />
            ))}
          </div>
        </div>
      )}

      {/* Grid Lines */}
      <div className="prismo-grid-lines">
        {gridLines.map((i) => (
          <div key={i} className="prismo-grid-line" />
        ))}
      </div>

      {/* Gradients */}
      {showTopGradient && <div className="prismo-gradient-top" />}
      {showBottomGradient && <div className="prismo-gradient-bottom" />}

      {/* Noise */}
      <div className="prismo-noise" style={{ opacity: noiseOpacity }} />
    </div>
  );
}

/**
 * ArchitectureNode.tsx — Stage 5: Technical Architecture
 *
 * Visualises the Soulora "Engine Room":
 *
 *   [Data Sources] ──→ [AI Orchestration Layer] ──→ [Personalized Output]
 *
 * Animated with a circuit-board aesthetic:
 *   • Nodes materialise column-by-column
 *   • SVG edges draw themselves (strokeDashoffset)
 *   • Travelling "pulse" dots race along each edge on a loop
 *   • A compliance badge pulses beneath the orchestrator node
 *
 * Duration : 15s / 450 frames @ 30 fps
 *
 * Timeline
 * ──────────────────────────────────────────────────
 *   0s –  3s   frames   0– 89   BG + column headers appear
 *   3s –  5s   frames  90–149   Source nodes materialise
 *   5s –  7s   frames 150–209   Orchestrator node appears
 *   7s –  9s   frames 210–269   Output nodes appear
 *   9s – 12s   frames 270–359   Edges draw; pulse dots begin
 *  12s – 15s   frames 360–449   Compliance badge + tagline hold
 * ──────────────────────────────────────────────────
 */

import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import type { ArchitecturePhaseConfig, ArchNode, ArchEdge } from "../data/soulora-config";

/* ── Helpers ─────────────────────────────────────────────────────────────── */

const rgba = (hex: string, a: number) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${a})`;
};

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

const fadeIn = (frame: number, start: number, dur = 22) =>
  ease(clamp01((frame - start) / dur));

/* ── Layout constants ────────────────────────────────────────────────────── */

const COLS   = 3;
const COL_W  = 420;  // width allocated per column
const NODE_W = 200;  // node card width
const NODE_H = 88;   // node card height
const ROW_GAP = 120; // vertical gap between rows
const TOP_PAD = 180; // y-offset for first row

/* Horizontal centre-x of each column within the 1920px canvas */
const COL_X = [220, 960, 1700];

/** Centre-x of a node */
const nodeCX = (col: number) => COL_X[col];

/** Centre-y of a node given its row, accounting for the orchestrator being vertically centred */
const nodeCY = (node: ArchNode, totalSourceRows: number): number => {
  if (node.col === 1) {
    // centre vertically between first and last source row
    const topY    = TOP_PAD + NODE_H / 2;
    const bottomY = TOP_PAD + (totalSourceRows - 1) * ROW_GAP + NODE_H / 2;
    return (topY + bottomY) / 2;
  }
  return TOP_PAD + node.row * ROW_GAP + NODE_H / 2;
};

/* ── Edge geometry ───────────────────────────────────────────────────────── */

interface EdgeGeometry {
  x1: number; y1: number;
  x2: number; y2: number;
  /** Rough length for dasharray */
  len: number;
  /** SVG path — orthogonal with rounded midpoint turn */
  path: string;
}

function edgeGeo(
  from: ArchNode,
  to: ArchNode,
  srcRows: number,
): EdgeGeometry {
  const x1 = nodeCX(from.col) + NODE_W / 2;
  const y1 = nodeCY(from, srcRows);
  const x2 = nodeCX(to.col) - NODE_W / 2;
  const y2 = nodeCY(to, srcRows);
  const mx = (x1 + x2) / 2;
  const path = `M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy) * 1.25; // approximate curve length
  return { x1, y1, x2, y2, len, path };
}

/* ── Sub-components ──────────────────────────────────────────────────────── */

interface NodeCardProps {
  node: ArchNode;
  cx: number;
  cy: number;
  opacity: number;
  scale: number;
  frame: number;
}

const NodeCard: React.FC<NodeCardProps> = ({ node, cx, cy, opacity, scale, frame }) => {
  const isOrchestrator = node.col === 1;
  // Soft ambient pulse for orchestrator
  const pulse = isOrchestrator
    ? 0.55 + 0.45 * Math.abs(Math.sin(frame * 0.07))
    : 1;

  return (
    <div
      style={{
        position: "absolute",
        left: cx - NODE_W / 2,
        top:  cy - NODE_H / 2,
        width: NODE_W,
        height: NODE_H,
        opacity,
        transform: `scale(${scale})`,
        transformOrigin: "center center",
        background: isOrchestrator
          ? `linear-gradient(135deg, ${rgba(node.color, 0.22)} 0%, ${rgba(node.color, 0.1)} 100%)`
          : "rgba(255,255,255,0.04)",
        border: `1px solid ${rgba(node.color, isOrchestrator ? 0.55 * pulse : 0.32)}`,
        borderRadius: isOrchestrator ? 20 : 14,
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        boxShadow: `0 0 ${isOrchestrator ? 36 * pulse : 18}px ${rgba(node.color, isOrchestrator ? 0.22 * pulse : 0.12)}`,
        display: "flex",
        alignItems: "center",
        padding: "0 18px",
        gap: 14,
      }}
    >
      {/* Icon */}
      <div
        style={{
          fontSize: isOrchestrator ? 36 : 28,
          lineHeight: 1,
          filter: `drop-shadow(0 0 6px ${rgba(node.color, 0.55)})`,
          flexShrink: 0,
        }}
      >
        {node.icon}
      </div>

      {/* Text */}
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontFamily: '"DM Sans", system-ui, sans-serif',
            fontSize: isOrchestrator ? 15 : 13,
            fontWeight: 600,
            color: isOrchestrator ? rgba(node.color, 0.95) : "rgba(255,255,255,0.88)",
            lineHeight: 1.3,
            whiteSpace: "pre-line",
          }}
        >
          {node.label}
        </div>
        {node.sublabel && (
          <div
            style={{
              fontFamily: '"DM Sans", system-ui, sans-serif',
              fontSize: 10,
              color: rgba(node.color, 0.58),
              marginTop: 3,
              letterSpacing: "0.04em",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {node.sublabel}
          </div>
        )}
      </div>
    </div>
  );
};

/* ── Main composition ────────────────────────────────────────────────────── */

export interface ArchitectureNodeProps {
  config: ArchitecturePhaseConfig;
}

const ArchitectureNode: React.FC<ArchitectureNodeProps> = ({ config }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const { theme, nodes, edges } = config;

  // Source rows = number of col-0 nodes
  const srcRows = nodes.filter((n) => n.col === 0).length;

  // Compute node positions
  const nodePos = new Map<string, { cx: number; cy: number }>();
  nodes.forEach((n) => {
    nodePos.set(n.id, { cx: nodeCX(n.col), cy: nodeCY(n, srcRows) });
  });

  // Edge geometries
  const edgeGeos = new Map<string, EdgeGeometry>();
  edges.forEach((e) => {
    const from = nodes.find((n) => n.id === e.from)!;
    const to   = nodes.find((n) => n.id === e.to)!;
    edgeGeos.set(`${e.from}→${e.to}`, edgeGeo(from, to, srcRows));
  });

  /* ── Animation timings ─────────────────────────────────────────────── */

  // Background / headers
  const bgHue      = interpolate(frame, [0, 450], theme.bgHueRange, {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  const headerOp   = fadeIn(frame, 15);

  // Column header stagger
  const colHeaderOp = (col: number) => fadeIn(frame, 20 + col * 18);

  // Node appearance — col 0 at frame 90, col 1 at 150, col 2 at 210
  const nodeColStart: Record<number, number> = { 0: 90, 1: 150, 2: 210 };
  const nodeOp = (n: ArchNode) => {
    const base = nodeColStart[n.col] + n.row * 14;
    return fadeIn(frame, base, 28);
  };
  const nodeScale = (n: ArchNode) => {
    const base = nodeColStart[n.col] + n.row * 14;
    return 0.72 + 0.28 * ease(clamp01((frame - base) / 28));
  };

  // Edge draw — starts at frame 270; each edge offset by 10 frames
  const edgeDrawProg = (e: ArchEdge) => {
    const edgeStart = 270 + (e.delay ?? 0) * 0.6;
    return clamp01((frame - edgeStart) / 55);
  };

  // Pulse dot travel — loops every 90 frames after frame 290
  const pulseTPos = (e: ArchEdge) => {
    const loopStart = 290 + (e.delay ?? 0) * 0.5;
    if (frame < loopStart) return -1; // hidden
    return ((frame - loopStart) % 90) / 90;
  };

  // Compliance badge
  const badgeOp    = fadeIn(frame, 370, 30);
  const taglineOp  = fadeIn(frame, 390, 30);

  /* ── Commentary ─────────────────────────────────────────────────────── */
  const activeLine = config.commentary?.find(
    (l) => frame >= l.startFrame && frame < l.endFrame
  );
  const commentOp = activeLine
    ? Math.min(
        fadeIn(frame, activeLine.startFrame, 15),
        1 - clamp01((frame - (activeLine.endFrame - 15)) / 15),
      )
    : 0;
  const commentSlide = activeLine
    ? interpolate(frame, [activeLine.startFrame, activeLine.startFrame + 15], [8, 0], {
        extrapolateLeft: "clamp", extrapolateRight: "clamp",
      })
    : 0;

  /* ── Canvas height for SVG edge layer ─────────────────────────────── */
  const canvasH = height;

  return (
    <div
      style={{
        width, height,
        position: "relative",
        overflow: "hidden",
        background: `radial-gradient(ellipse at 50% 42%,
          hsl(${bgHue}, 30%, 11%) 0%,
          hsl(${bgHue}, 38%, 5%) 100%)`,
        fontFamily: '"DM Sans", system-ui, sans-serif',
      }}
    >

      {/* ── Ambient grid overlay (circuit-board texture) ─────────────── */}
      <svg
        style={{ position: "absolute", inset: 0, pointerEvents: "none", opacity: 0.04 }}
        width={width} height={height}
      >
        <defs>
          <pattern id="grid" width="48" height="48" patternUnits="userSpaceOnUse">
            <path d="M 48 0 L 0 0 0 48" fill="none" stroke="rgba(255,255,255,1)" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width={width} height={height} fill="url(#grid)" />
      </svg>

      {/* ── Ambient particles ────────────────────────────────────────── */}
      {[...Array(10)].map((_, i) => {
        const px    = 4 + i * 10;
        const py    = 6 + ((i * 37) % 85);
        const drift = Math.sin(frame / 48 + i * 1.1) * 14;
        const tw    = 0.03 + 0.025 * Math.abs(Math.sin(frame / 35 + i));
        return (
          <div key={i} style={{
            position: "absolute",
            left: `${px}%`, top: `${py}%`,
            width: 2 + (i % 3), height: 2 + (i % 3),
            borderRadius: "50%",
            background: i % 2 === 0 ? rgba(theme.primaryColor, tw) : rgba(theme.secondaryColor, tw),
            transform: `translateY(${drift}px)`,
            filter: "blur(0.5px)",
          }} />
        );
      })}

      {/* ── Section header ───────────────────────────────────────────── */}
      <div style={{
        position: "absolute", top: 42, left: 0, right: 0,
        textAlign: "center", opacity: headerOp, pointerEvents: "none",
      }}>
        <div style={{
          fontFamily: '"DM Sans", system-ui, sans-serif',
          fontSize: 11, fontWeight: 600, letterSpacing: "0.22em",
          textTransform: "uppercase" as const,
          color: rgba(theme.primaryColor, 0.72), marginBottom: 8,
        }}>
          Stage 5 · Technical Architecture
        </div>
        <div style={{
          fontFamily: '"Instrument Serif", Georgia, serif',
          fontSize: 42, lineHeight: 1.1,
          color: "rgba(255,255,255,0.92)", fontWeight: 400,
        }}>
          The Engine Room
        </div>
      </div>

      {/* ── Column headers ───────────────────────────────────────────── */}
      {config.columnLabels.map((label, col) => (
        <div key={col} style={{
          position: "absolute",
          top: 132,
          left: COL_X[col] - COL_W / 2,
          width: COL_W,
          textAlign: "center",
          opacity: colHeaderOp(col),
          pointerEvents: "none",
        }}>
          <div style={{
            display: "inline-block",
            fontFamily: '"DM Sans", system-ui, sans-serif',
            fontSize: 11, fontWeight: 600, letterSpacing: "0.16em",
            textTransform: "uppercase" as const,
            color: rgba(
              col === 0 ? "#4CAF50"
                : col === 1 ? theme.primaryColor
                : theme.accentColor,
              0.78,
            ),
            borderBottom: `1px solid ${rgba(
              col === 0 ? "#4CAF50"
                : col === 1 ? theme.primaryColor
                : theme.accentColor,
              0.28,
            )}`,
            paddingBottom: 4,
          }}>
            {label}
          </div>
        </div>
      ))}

      {/* ── SVG layer — edges + pulse dots ───────────────────────────── */}
      <svg
        style={{ position: "absolute", top: 0, left: 0, pointerEvents: "none" }}
        width={width} height={canvasH}
      >
        <defs>
          {/* Glowing filter for pulse dots */}
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>

          {/* Per-edge gradients */}
          {edges.map((e) => {
            const fromNode = nodes.find((n) => n.id === e.from)!;
            const toNode   = nodes.find((n) => n.id === e.to)!;
            const geo = edgeGeos.get(`${e.from}→${e.to}`)!;
            const gradId = `eg_${e.from}_${e.to}`;
            return (
              <linearGradient
                key={gradId} id={gradId}
                x1={geo.x1} y1={geo.y1} x2={geo.x2} y2={geo.y2}
                gradientUnits="userSpaceOnUse"
              >
                <stop offset="0%"   stopColor={fromNode.color} stopOpacity={0.55} />
                <stop offset="100%" stopColor={toNode.color}   stopOpacity={0.55} />
              </linearGradient>
            );
          })}
        </defs>

        {edges.map((e) => {
          const geo  = edgeGeos.get(`${e.from}→${e.to}`)!;
          const prog = edgeDrawProg(e);
          const dashLen = geo.len;
          const dashOff = dashLen * (1 - prog);

          // Pulse dot position along the path
          const t = pulseTPos(e);

          // Cubic bezier interpolation at parameter t
          let dotX = -9999, dotY = -9999;
          if (t >= 0) {
            // From edgeGeo: path = `M x1 y1 C mx y1, mx y2, x2 y2`
            const { x1, y1, x2, y2 } = geo;
            const mx = (x1 + x2) / 2;
            const p0x = x1, p0y = y1;
            const p1x = mx, p1y = y1;
            const p2x = mx, p2y = y2;
            const p3x = x2, p3y = y2;
            const u = 1 - t;
            dotX = u*u*u*p0x + 3*u*u*t*p1x + 3*u*t*t*p2x + t*t*t*p3x;
            dotY = u*u*u*p0y + 3*u*u*t*p1y + 3*u*t*t*p2y + t*t*t*p3y;
          }

          const fromNode = nodes.find((n) => n.id === e.from)!;
          const toNode   = nodes.find((n) => n.id === e.to)!;

          // Pulse dot colour blends between from/to node colours
          const dotColor = t < 0.5 ? fromNode.color : toNode.color;

          return (
            <g key={`${e.from}→${e.to}`}>
              {/* Track line (faint always-visible) */}
              <path
                d={geo.path}
                fill="none"
                stroke="rgba(255,255,255,0.04)"
                strokeWidth={1.5}
              />
              {/* Animated draw line */}
              {prog > 0 && (
                <path
                  d={geo.path}
                  fill="none"
                  stroke={`url(#eg_${e.from}_${e.to})`}
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeDasharray={dashLen}
                  strokeDashoffset={dashOff}
                  style={{ filter: `drop-shadow(0 0 4px ${rgba(fromNode.color, 0.45)})` }}
                />
              )}
              {/* Travelling pulse dot */}
              {t >= 0 && prog >= 0.98 && (
                <g filter="url(#glow)">
                  <circle
                    cx={dotX} cy={dotY}
                    r={5}
                    fill={dotColor}
                    opacity={0.9}
                  />
                  <circle
                    cx={dotX} cy={dotY}
                    r={2.5}
                    fill="white"
                    opacity={0.8}
                  />
                </g>
              )}
            </g>
          );
        })}
      </svg>

      {/* ── Node cards ───────────────────────────────────────────────── */}
      {nodes.map((node) => {
        const pos = nodePos.get(node.id)!;
        return (
          <NodeCard
            key={node.id}
            node={node}
            cx={pos.cx}
            cy={pos.cy}
            opacity={nodeOp(node)}
            scale={nodeScale(node)}
            frame={frame}
          />
        );
      })}

      {/* ── Compliance badge ─────────────────────────────────────────── */}
      {config.complianceBadge && (
        <div style={{
          position: "absolute",
          top: nodeCY(nodes.find((n) => n.id === "orchestrator")!, srcRows) + NODE_H / 2 + 18,
          left: COL_X[1] - 220,
          width: 440,
          textAlign: "center",
          opacity: badgeOp,
          pointerEvents: "none",
        }}>
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            background: rgba(theme.primaryColor, 0.07),
            border: `1px solid ${rgba(theme.primaryColor, 0.28)}`,
            borderRadius: 20,
            padding: "6px 18px",
            fontFamily: '"DM Sans", system-ui, sans-serif',
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: "0.1em",
            color: rgba(theme.primaryColor, 0.8),
            textTransform: "uppercase" as const,
          }}>
            🔒 {config.complianceBadge}
          </div>
        </div>
      )}

      {/* ── Tagline ───────────────────────────────────────────────────── */}
      <div style={{
        position: "absolute",
        bottom: 44, left: 0, right: 0,
        display: "flex", justifyContent: "center",
        opacity: taglineOp, pointerEvents: "none",
      }}>
        <div style={{
          fontFamily: '"Instrument Serif", Georgia, serif',
          fontSize: 18, fontStyle: "italic",
          color: rgba(theme.primaryColor, 0.45),
          letterSpacing: "0.02em",
        }}>
          {config.tagline}
        </div>
      </div>

      {/* ── Commentary overlay ───────────────────────────────────────── */}
      {activeLine && (
        <div style={{
          position: "absolute",
          bottom: 84, left: 0, right: 0,
          display: "flex", justifyContent: "center",
          pointerEvents: "none", zIndex: 10,
        }}>
          <div style={{
            opacity: commentOp,
            transform: `translateY(${commentSlide}px)`,
            background: "rgba(0,0,0,0.48)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            borderRadius: 12,
            padding: "13px 36px",
            maxWidth: 960,
            textAlign: "center" as const,
            border: "1px solid rgba(255,255,255,0.07)",
          }}>
            <div style={{
              fontFamily: '"DM Sans", system-ui, sans-serif',
              fontSize: 17, fontWeight: 400, lineHeight: 1.55,
              color: "rgba(255,255,255,0.85)", letterSpacing: "0.01em",
            }}>
              {activeLine.text}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ArchitectureNode;

import React from "react";
import {
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  Sequence,
} from "remotion";
import type { VisionPhaseConfig, CommentaryLine } from "../data/soulora-config";

/* ── Utilities ──────────────────────────────────────────────────────────── */

const hexToRgba = (hex: string, alpha: number): string => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
};

/* ══════════════════════════════════════════════════════════════════════════
 *  VISION TIMING CONSTANTS (15s @ 30fps = 450 frames)
 *
 *  Intro phase   :  0s– 3s  → frames   0– 89
 *  Draw phase    :  3s–10s  → frames  90–299
 *  Reveal phase  : 10s–15s  → frames 300–449
 * ══════════════════════════════════════════════════════════════════════════ */

const FPS = 30;

const PHASE = {
  INTRO_START:  0,
  INTRO_END:    3 * FPS,   //  90
  DRAW_START:   3 * FPS,   //  90
  DRAW_END:     10 * FPS,  // 300
  REVEAL_START: 10 * FPS,  // 300
  REVEAL_END:   15 * FPS,  // 450
  TOTAL:        15 * FPS,  // 450
} as const;

/* ── Chart layout constants ──────────────────────────────────────────────── */

const SVG_W     = 960;
const SVG_H     = 360;
const PAD_L     = 72;
const PAD_R     = 52;
const PAD_T     = 48;
const PAD_B     = 64;
const PLOT_W    = SVG_W - PAD_L - PAD_R; // 836
const PLOT_H    = SVG_H - PAD_T - PAD_B; // 248
const Y_MIN     = 50;
const Y_MAX     = 100;
const PLOT_BTM  = PAD_T + PLOT_H;        // 296

const GRID_SCORES = [60, 70, 80, 90, 100];
const DASH_LEN    = 2400; // safe over-estimate for strokeDasharray

/* ── Chart coordinate helpers ────────────────────────────────────────────── */

const scoreToY = (score: number): number =>
  PAD_T + PLOT_H * (1 - (score - Y_MIN) / (Y_MAX - Y_MIN));

const indexToX = (i: number, total: number): number =>
  PAD_L + (PLOT_W / (total - 1)) * i;

/** Smooth cubic bezier through an array of {x,y} points */
function smoothLinePath(pts: { x: number; y: number }[]): string {
  if (pts.length < 2) return "";
  let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
  for (let i = 1; i < pts.length; i++) {
    const p0 = pts[i - 1];
    const p1 = pts[i];
    const cpx = ((p0.x + p1.x) / 2).toFixed(1);
    d += ` C ${cpx} ${p0.y.toFixed(1)}, ${cpx} ${p1.y.toFixed(1)}, ${p1.x.toFixed(1)} ${p1.y.toFixed(1)}`;
  }
  return d;
}

/** Area fill path — smooth line closed to the bottom of the plot */
function areaFillPath(pts: { x: number; y: number }[]): string {
  if (pts.length < 2) return "";
  const line = smoothLinePath(pts);
  const last = pts[pts.length - 1];
  const first = pts[0];
  return `${line} L ${last.x.toFixed(1)} ${PLOT_BTM} L ${first.x.toFixed(1)} ${PLOT_BTM} Z`;
}

/* ── Shared: ChartSkeleton ───────────────────────────────────────────────── */
// Grid lines + axis + week labels — used across all 3 phases

interface ChartSkeletonProps {
  pts: { x: number; y: number; score: number; label: string }[];
  opacity?: number;
}

const ChartSkeleton: React.FC<ChartSkeletonProps> = ({ pts, opacity = 1 }) => (
  <g opacity={opacity}>
    {/* Horizontal grid lines */}
    {GRID_SCORES.map((score) => {
      const y = scoreToY(score);
      return (
        <g key={score}>
          <line
            x1={PAD_L} y1={y} x2={PAD_L + PLOT_W} y2={y}
            stroke="rgba(255,255,255,0.06)" strokeWidth={1}
          />
          <text
            x={PAD_L - 10} y={y + 4}
            textAnchor="end"
            fill="rgba(255,255,255,0.22)"
            fontSize={11}
            fontFamily='"DM Sans", system-ui, sans-serif'
          >
            {score}
          </text>
        </g>
      );
    })}

    {/* X axis baseline */}
    <line
      x1={PAD_L} y1={PLOT_BTM} x2={PAD_L + PLOT_W} y2={PLOT_BTM}
      stroke="rgba(255,255,255,0.1)" strokeWidth={1}
    />

    {/* Week labels */}
    {pts.map((pt, i) => (
      <text
        key={i}
        x={pt.x} y={PLOT_BTM + 22}
        textAnchor="middle"
        fill="rgba(255,255,255,0.3)"
        fontSize={11}
        fontFamily='"DM Sans", system-ui, sans-serif'
      >
        {pt.label}
      </text>
    ))}
  </g>
);

/* ══════════════════════════════════════════════════════════════════════════
 *  Phase 1: Intro (frames 0–89)
 *  Title + subtitle fade in; chart skeleton draws in.
 * ══════════════════════════════════════════════════════════════════════════ */

const TitleIntroPhase: React.FC<{ config: VisionPhaseConfig }> = ({ config }) => {
  const frame = useCurrentFrame();
  const { theme } = config;
  const gold = theme.primaryColor;

  const pts = config.dataPoints.map((dp, i) => ({
    x: indexToX(i, config.dataPoints.length),
    y: scoreToY(dp.score),
    score: dp.score,
    label: dp.label,
  }));

  const titleOpacity = interpolate(frame, [12, 38], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  const titleY = interpolate(frame, [12, 38], [22, 0], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  const subtitleOpacity = interpolate(frame, [30, 52], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  const skeletonOpacity = interpolate(frame, [48, 72], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        position: "absolute",
        top: 0, left: 0,
        width: "100%", height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Title block */}
      <div
        style={{
          opacity: titleOpacity,
          transform: `translateY(${titleY}px)`,
          textAlign: "center",
          marginBottom: 12,
        }}
      >
        <div
          style={{
            fontFamily: '"DM Sans", system-ui, sans-serif',
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: "0.22em",
            textTransform: "uppercase" as const,
            color: hexToRgba(gold, 0.75),
            marginBottom: 14,
          }}
        >
          {config.indexLabel}
        </div>
        <div
          style={{
            fontFamily: '"Instrument Serif", Georgia, serif',
            fontSize: 54,
            lineHeight: 1.1,
            color: "rgba(255,255,255,0.95)",
            fontWeight: 400,
          }}
        >
          Your Growth Trajectory
        </div>
      </div>

      {/* Subtitle */}
      <div
        style={{
          opacity: subtitleOpacity,
          fontFamily: '"DM Sans", system-ui, sans-serif',
          fontSize: 14,
          color: "rgba(255,255,255,0.38)",
          letterSpacing: "0.06em",
          marginBottom: 48,
        }}
      >
        28-day performance overview
      </div>

      {/* Chart skeleton */}
      <svg width={SVG_W} height={SVG_H} viewBox={`0 0 ${SVG_W} ${SVG_H}`}>
        <ChartSkeleton pts={pts} opacity={skeletonOpacity} />
      </svg>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════════════════
 *  Phase 2: VisionTrend Draw (Sequence frames 0–209, global 90–299)
 *
 *  • Line draws itself via strokeDashoffset over first 150 frames
 *  • Gold area fill grows left-to-right via clipRect
 *  • Week dots pop in as the line passes each x position
 *  • Score counter ticks from 60 → 92 in top-right corner
 *  • Final dot pulses gold once line finishes
 * ══════════════════════════════════════════════════════════════════════════ */

const VisionTrendPhase: React.FC<{ config: VisionPhaseConfig }> = ({ config }) => {
  const frame = useCurrentFrame(); // 0–209 within Sequence
  const { theme } = config;
  const gold  = theme.primaryColor;
  const blue  = theme.secondaryColor;

  const pts = config.dataPoints.map((dp, i) => ({
    x: indexToX(i, config.dataPoints.length),
    y: scoreToY(dp.score),
    score: dp.score,
    label: dp.label,
  }));

  const linePath  = smoothLinePath(pts);
  const fillPath  = areaFillPath(pts);

  /* Line draws over first 150 frames */
  const drawProg   = interpolate(frame, [0, 150], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  const dashOffset = DASH_LEN * (1 - drawProg);

  /* Area fill clip grows left-to-right */
  const areaClipW  = PLOT_W * drawProg;

  /* Score counter */
  const minScore = config.dataPoints[0].score;
  const maxScore = config.dataPoints[config.dataPoints.length - 1].score;
  const displayScore = Math.round(
    interpolate(frame, [0, 150], [minScore, maxScore], {
      extrapolateLeft: "clamp", extrapolateRight: "clamp",
    })
  );

  /* Final dot pulse starts at frame 158 */
  const finalPulse =
    frame > 158 ? 0.55 + 0.45 * Math.abs(Math.sin((frame - 158) * 0.11)) : 0;

  /* Counter fade-in */
  const counterOpacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        position: "absolute",
        top: 0, left: 0,
        width: "100%", height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Score counter — top right */}
      <div
        style={{
          position: "absolute",
          top: 56,
          right: 88,
          textAlign: "right",
          opacity: counterOpacity,
        }}
      >
        <div
          style={{
            fontFamily: '"DM Sans", system-ui, sans-serif',
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "0.2em",
            textTransform: "uppercase" as const,
            color: hexToRgba(gold, 0.6),
            marginBottom: 4,
          }}
        >
          {config.indexLabel}
        </div>
        <div
          style={{
            fontFamily: '"Instrument Serif", Georgia, serif',
            fontSize: 80,
            lineHeight: 1,
            color: gold,
            filter: `drop-shadow(0 0 ${18 * finalPulse}px ${hexToRgba(gold, 0.55 * finalPulse)})`,
          }}
        >
          {displayScore}
        </div>
        <div
          style={{
            fontFamily: '"DM Sans", system-ui, sans-serif',
            fontSize: 13,
            color: "rgba(255,255,255,0.32)",
            marginTop: 4,
          }}
        >
          / 100
        </div>
      </div>

      {/* Chart */}
      <svg
        width={SVG_W}
        height={SVG_H}
        viewBox={`0 0 ${SVG_W} ${SVG_H}`}
        style={{ overflow: "visible" }}
      >
        <defs>
          <linearGradient id="vt_lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stopColor={blue} />
            <stop offset="100%" stopColor={gold} />
          </linearGradient>
          <linearGradient id="vt_areaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%"   stopColor={gold} stopOpacity={0.3} />
            <stop offset="100%" stopColor={gold} stopOpacity={0.02} />
          </linearGradient>
          <clipPath id="vt_drawClip">
            <rect x={PAD_L} y={0} width={areaClipW} height={SVG_H} />
          </clipPath>
        </defs>

        <ChartSkeleton pts={pts} />

        {/* Area fill */}
        <path
          d={fillPath}
          fill="url(#vt_areaGrad)"
          clipPath="url(#vt_drawClip)"
        />

        {/* Trend line */}
        <path
          d={linePath}
          fill="none"
          stroke="url(#vt_lineGrad)"
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={DASH_LEN}
          strokeDashoffset={dashOffset}
          style={{ filter: `drop-shadow(0 0 7px ${hexToRgba(gold, 0.5)})` }}
        />

        {/* Week dots */}
        {pts.map((pt, i) => {
          /* Dot appears when the line front reaches this point's x */
          const passFrame = 150 * (i / (pts.length - 1));
          const dotOpacity = interpolate(frame, [passFrame - 4, passFrame + 12], [0, 1], {
            extrapolateLeft: "clamp", extrapolateRight: "clamp",
          });
          const dotScale = interpolate(frame, [passFrame - 4, passFrame + 14], [0.4, 1], {
            extrapolateLeft: "clamp", extrapolateRight: "clamp",
          });
          const isLast = i === pts.length - 1;
          const r = isLast ? 8 : 5;

          return (
            <g
              key={i}
              opacity={dotOpacity}
              transform={`translate(${pt.x}, ${pt.y}) scale(${dotScale}) translate(${-pt.x}, ${-pt.y})`}
            >
              {/* Outer glow ring for final dot */}
              {isLast && finalPulse > 0 && (
                <circle
                  cx={pt.x} cy={pt.y}
                  r={r * 2.8}
                  fill={gold}
                  opacity={0.12 * finalPulse}
                />
              )}
              {/* Dot fill */}
              <circle
                cx={pt.x} cy={pt.y}
                r={r}
                fill={isLast ? gold : hexToRgba(gold, 0.72)}
                style={
                  isLast
                    ? { filter: `drop-shadow(0 0 10px ${hexToRgba(gold, 0.7)})` }
                    : {}
                }
              />
              {/* Dark inner circle */}
              <circle
                cx={pt.x} cy={pt.y}
                r={r - 3}
                fill="hsl(228, 40%, 8%)"
              />
              {/* Score label */}
              <text
                x={pt.x} y={pt.y - 18}
                textAnchor="middle"
                fill={isLast ? gold : "rgba(255,255,255,0.52)"}
                fontSize={isLast ? 14 : 11}
                fontWeight={isLast ? 700 : 400}
                fontFamily='"DM Sans", system-ui, sans-serif'
              >
                {pt.score}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════════════════
 *  Phase 3: Strategy Reveal (Sequence frames 0–149, global 300–449)
 *
 *  Chart shrinks upward; 3 strategy cards stagger in below; tagline fades.
 * ══════════════════════════════════════════════════════════════════════════ */

const StrategyRevealPhase: React.FC<{ config: VisionPhaseConfig }> = ({ config }) => {
  const frame = useCurrentFrame(); // 0–149 within Sequence
  const { theme } = config;
  const gold = theme.primaryColor;
  const blue = theme.secondaryColor;

  const pts = config.dataPoints.map((dp, i) => ({
    x: indexToX(i, config.dataPoints.length),
    y: scoreToY(dp.score),
    score: dp.score,
    label: dp.label,
  }));

  const linePath = smoothLinePath(pts);
  const fillPath = areaFillPath(pts);

  /* Chart scales down and rises */
  const chartScale = interpolate(frame, [0, 45], [1, 0.68], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  const chartY = interpolate(frame, [0, 45], [0, -68], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });

  /* Cards stagger: each card offsets by 22 frames */
  const cardFade = (i: number) =>
    interpolate(frame - 30 - i * 22, [0, 28], [0, 1], {
      extrapolateLeft: "clamp", extrapolateRight: "clamp",
    });
  const cardSlide = (i: number) =>
    interpolate(frame - 30 - i * 22, [0, 28], [36, 0], {
      extrapolateLeft: "clamp", extrapolateRight: "clamp",
    });

  /* Tagline */
  const taglineOpacity = interpolate(frame, [90, 115], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        position: "absolute",
        top: 0, left: 0,
        width: "100%", height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Shrunken chart */}
      <div
        style={{
          transform: `translateY(${chartY}px) scale(${chartScale})`,
          transformOrigin: "top center",
        }}
      >
        <svg
          width={SVG_W}
          height={SVG_H}
          viewBox={`0 0 ${SVG_W} ${SVG_H}`}
          style={{ overflow: "visible" }}
        >
          <defs>
            <linearGradient id="sr_lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%"   stopColor={blue} />
              <stop offset="100%" stopColor={gold} />
            </linearGradient>
            <linearGradient id="sr_areaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%"   stopColor={gold} stopOpacity={0.28} />
              <stop offset="100%" stopColor={gold} stopOpacity={0.02} />
            </linearGradient>
          </defs>

          <ChartSkeleton pts={pts} opacity={0.7} />
          <path d={fillPath} fill="url(#sr_areaGrad)" />
          <path
            d={linePath}
            fill="none"
            stroke="url(#sr_lineGrad)"
            strokeWidth={3}
            strokeLinecap="round"
            style={{ filter: `drop-shadow(0 0 7px ${hexToRgba(gold, 0.45)})` }}
          />

          {/* Dots */}
          {pts.map((pt, i) => {
            const isLast = i === pts.length - 1;
            const r = isLast ? 8 : 5;
            const pulse = isLast
              ? 0.55 + 0.45 * Math.abs(Math.sin(frame * 0.1))
              : 0;
            return (
              <g key={i}>
                {isLast && (
                  <circle cx={pt.x} cy={pt.y} r={r * 2.5} fill={gold} opacity={0.12 * pulse} />
                )}
                <circle
                  cx={pt.x} cy={pt.y}
                  r={r}
                  fill={isLast ? gold : hexToRgba(gold, 0.65)}
                  style={isLast ? { filter: `drop-shadow(0 0 9px ${hexToRgba(gold, 0.65)})` } : {}}
                />
                <circle cx={pt.x} cy={pt.y} r={r - 3} fill="hsl(228, 40%, 8%)" />
                <text
                  x={pt.x} y={pt.y - 16}
                  textAnchor="middle"
                  fill={isLast ? gold : "rgba(255,255,255,0.45)"}
                  fontSize={isLast ? 13 : 10}
                  fontWeight={isLast ? 700 : 400}
                  fontFamily='"DM Sans", system-ui, sans-serif'
                >
                  {pt.score}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Strategy cards */}
      <div
        style={{
          display: "flex",
          gap: 20,
          marginTop: 12,
        }}
      >
        {config.strategyCards.map((card, i) => (
          <div
            key={i}
            style={{
              opacity: cardFade(i),
              transform: `translateY(${cardSlide(i)}px)`,
              background: hexToRgba(gold, 0.05),
              border: `1px solid ${hexToRgba(gold, 0.2)}`,
              borderRadius: 18,
              padding: "26px 28px",
              width: 268,
              backdropFilter: "blur(14px)",
              WebkitBackdropFilter: "blur(14px)",
              boxShadow: `0 8px 40px rgba(0,0,0,0.35), inset 0 1px 0 ${hexToRgba(gold, 0.08)}`,
            }}
          >
            <div style={{ fontSize: 34, lineHeight: 1, marginBottom: 14 }}>
              {card.icon}
            </div>
            <div
              style={{
                fontFamily: '"DM Sans", system-ui, sans-serif',
                fontSize: 14,
                fontWeight: 600,
                color: hexToRgba(gold, 0.92),
                marginBottom: 10,
                letterSpacing: "0.01em",
              }}
            >
              {card.title}
            </div>
            <div
              style={{
                fontFamily: '"DM Sans", system-ui, sans-serif',
                fontSize: 13,
                color: "rgba(255,255,255,0.52)",
                lineHeight: 1.55,
              }}
            >
              {card.body}
            </div>
          </div>
        ))}
      </div>

      {/* Tagline */}
      <div
        style={{
          marginTop: 36,
          opacity: taglineOpacity,
          fontFamily: '"Instrument Serif", Georgia, serif',
          fontSize: 20,
          fontStyle: "italic",
          color: hexToRgba(gold, 0.52),
          letterSpacing: "0.02em",
        }}
      >
        {config.tagline}
      </div>
    </div>
  );
};

/* ── Commentary Overlay ─────────────────────────────────────────────────── */

const FADE_FRAMES = 15;

const CommentaryOverlay: React.FC<{ lines: CommentaryLine[]; frame: number }> = ({
  lines,
  frame,
}) => {
  const activeLine = lines.find(
    (line) => frame >= line.startFrame && frame < line.endFrame
  );
  if (!activeLine) return null;

  const fadeIn = interpolate(
    frame,
    [activeLine.startFrame, activeLine.startFrame + FADE_FRAMES],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  const fadeOut = interpolate(
    frame,
    [activeLine.endFrame - FADE_FRAMES, activeLine.endFrame],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  const opacity    = Math.min(fadeIn, fadeOut);
  const translateY = interpolate(
    frame,
    [activeLine.startFrame, activeLine.startFrame + FADE_FRAMES],
    [8, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  return (
    <div
      style={{
        position: "absolute",
        bottom: 48,
        left: 0, right: 0,
        display: "flex",
        justifyContent: "center",
        pointerEvents: "none",
        zIndex: 10,
      }}
    >
      <div
        style={{
          opacity,
          transform: `translateY(${translateY}px)`,
          background: "rgba(0,0,0,0.45)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          borderRadius: 12,
          padding: "14px 36px",
          maxWidth: 900,
          textAlign: "center" as const,
          border: "1px solid rgba(255,255,255,0.07)",
        }}
      >
        <div
          style={{
            fontFamily: '"DM Sans", system-ui, sans-serif',
            fontSize: 17,
            fontWeight: 400,
            lineHeight: 1.5,
            color: "rgba(255,255,255,0.85)",
            letterSpacing: "0.01em",
          }}
        >
          {activeLine.text}
        </div>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════════════════
 *  VisionPhase — Stage 3 Composition (15s / 450 frames)
 *
 *  Background shifts from deep indigo (228°) → deep cobalt (240°),
 *  signalling strategic premium growth versus the green of Stage 1.
 * ══════════════════════════════════════════════════════════════════════════ */

interface VisionPhaseProps {
  config: VisionPhaseConfig;
}

const VisionPhase: React.FC<VisionPhaseProps> = ({ config }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const { theme } = config;
  const gold = theme.primaryColor;

  const bgHue = interpolate(
    frame,
    [0, PHASE.TOTAL],
    [theme.bgHueRange[0], theme.bgHueRange[1]],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  return (
    <div
      style={{
        width,
        height,
        background: `radial-gradient(ellipse at 50% 35%, hsl(${bgHue}, 32%, 13%) 0%, hsl(${bgHue}, 40%, 5%) 100%)`,
        position: "relative",
        overflow: "hidden",
        fontFamily: '"DM Sans", system-ui, sans-serif',
      }}
    >
      {/* Ambient gold shimmer particles */}
      {[...Array(8)].map((_, i) => {
        const x     = 8 + i * 12;
        const y     = 10 + ((i * 43) % 80);
        const drift = Math.sin(frame / 55 + i * 1.1) * 14;
        const twinkle = 0.04 + 0.04 * Math.abs(Math.sin(frame / 40 + i * 0.9));
        return (
          <div
            key={`p-${i}`}
            style={{
              position: "absolute",
              left: `${x}%`,
              top: `${y}%`,
              width: 2 + (i % 3),
              height: 2 + (i % 3),
              borderRadius: "50%",
              background:
                i % 2 === 0
                  ? hexToRgba(gold, twinkle)
                  : hexToRgba(theme.secondaryColor, twinkle * 0.7),
              transform: `translateY(${drift}px)`,
              filter: "blur(0.5px)",
            }}
          />
        );
      })}

      {/* Soft gold vignette top-right — premium brand cue */}
      <div
        style={{
          position: "absolute",
          top: -120,
          right: -120,
          width: 500,
          height: 500,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${hexToRgba(gold, 0.06)} 0%, transparent 70%)`,
          filter: "blur(40px)",
          pointerEvents: "none",
        }}
      />

      {/* ── Phase 1: INTRO (0s–3s / 0–89) ──────────────────────────── */}
      <Sequence
        from={PHASE.INTRO_START}
        durationInFrames={PHASE.INTRO_END - PHASE.INTRO_START}
      >
        <TitleIntroPhase config={config} />
      </Sequence>

      {/* ── Phase 2: VISION TREND DRAW (3s–10s / 90–299) ────────────── */}
      <Sequence
        from={PHASE.DRAW_START}
        durationInFrames={PHASE.DRAW_END - PHASE.DRAW_START}
      >
        <VisionTrendPhase config={config} />
      </Sequence>

      {/* ── Phase 3: STRATEGY REVEAL (10s–15s / 300–449) ────────────── */}
      <Sequence
        from={PHASE.REVEAL_START}
        durationInFrames={PHASE.REVEAL_END - PHASE.REVEAL_START}
      >
        <StrategyRevealPhase config={config} />
      </Sequence>

      {/* Commentary overlay */}
      {config.commentary && config.commentary.length > 0 && (
        <CommentaryOverlay lines={config.commentary} frame={frame} />
      )}
    </div>
  );
};

export default VisionPhase;

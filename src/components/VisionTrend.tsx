/**
 * VisionTrend.tsx — Stage 3: Product Vision & Strategy
 *
 * A dedicated Remotion composition built around a single hero visual:
 * a 2D animated line graph of the "Vitality Index" climbing from 60 → 92
 * over 4 weeks.
 *
 * Duration : 15s / 450 frames @ 30fps
 *
 * Timeline
 * ─────────────────────────────────────────────────────
 *   0s – 3s   frames   0–  89   Grid + title appear
 *   3s – 9s   frames  90– 269   Line draws, dots pop, counter ticks
 *   9s –12s   frames 270– 359   Score holds; strategy cards slide in
 *  12s –15s   frames 360– 449   Tagline + soft hold
 * ─────────────────────────────────────────────────────
 */

import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import type { VisionPhaseConfig, CommentaryLine } from "../data/soulora-config";

/* ── Helpers ────────────────────────────────────────────────────────────── */

const hex = (color: string, a: number) => {
  const r = parseInt(color.slice(1, 3), 16);
  const g = parseInt(color.slice(3, 5), 16);
  const b = parseInt(color.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${a})`;
};

const clamp = (v: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, v));

const lerp01 = (frame: number, start: number, end: number) =>
  clamp((frame - start) / (end - start), 0, 1);

/* ── Chart geometry ─────────────────────────────────────────────────────── */

const CW = 1080; // chart SVG canvas width
const CH = 440;  // chart SVG canvas height

const PL = 80;   // padding left  (room for Y-axis labels)
const PR = 60;   // padding right
const PT = 40;   // padding top
const PB = 72;   // padding bottom (room for X-axis labels)

const PW = CW - PL - PR; // 940  — actual plot width
const PH = CH - PT - PB; // 328  — actual plot height

const Y_LO = 50;          // score at bottom of Y axis
const Y_HI = 100;         // score at top  of Y axis
const GRID = [60, 70, 80, 90, 100];
const BOT  = PT + PH;     // y-pixel of the x-axis baseline

/* coordinate mappers */
const sx = (i: number, n: number) => PL + (PW / (n - 1)) * i;
const sy = (score: number) => PT + PH * (1 - (score - Y_LO) / (Y_HI - Y_LO));

/* Build smooth cubic-bezier SVG path through points */
function linePath(pts: { x: number; y: number }[]): string {
  if (pts.length < 2) return "";
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 1; i < pts.length; i++) {
    const p0 = pts[i - 1];
    const p1 = pts[i];
    const cx = (p0.x + p1.x) / 2;
    d += ` C ${cx} ${p0.y}, ${cx} ${p1.y}, ${p1.x} ${p1.y}`;
  }
  return d;
}

/* Area fill — same path closed to the baseline */
function areaPath(pts: { x: number; y: number }[]): string {
  if (pts.length < 2) return "";
  const line = linePath(pts);
  const last = pts[pts.length - 1];
  const first = pts[0];
  return `${line} L ${last.x} ${BOT} L ${first.x} ${BOT} Z`;
}

/* Approximate total SVG path length for dash animation */
function approxLength(pts: { x: number; y: number }[]): number {
  let len = 0;
  for (let i = 1; i < pts.length; i++) {
    const dx = pts[i].x - pts[i - 1].x;
    const dy = pts[i].y - pts[i - 1].y;
    len += Math.sqrt(dx * dx + dy * dy);
  }
  return Math.ceil(len) + 20; // small buffer
}

/* ══════════════════════════════════════════════════════════════════════════
 *  VisionTrend — top-level Remotion composition
 * ══════════════════════════════════════════════════════════════════════════ */

export interface VisionTrendProps {
  config: VisionPhaseConfig;
}

const VisionTrend: React.FC<VisionTrendProps> = ({ config }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const { theme } = config;
  const gold = theme.primaryColor;
  const blue = theme.secondaryColor;

  /* ── Pre-compute chart points ────────────────────────────────────────── */
  const pts = config.dataPoints.map((dp, i) => ({
    x: sx(i, config.dataPoints.length),
    y: sy(dp.score),
    score: dp.score,
    label: dp.label,
  }));

  const pathStr  = linePath(pts);
  const fillStr  = areaPath(pts);
  const pathLen  = approxLength(pts);

  /* ── Timeline ranges ─────────────────────────────────────────────────── */
  //  0– 89  grid & title in
  // 90–269  line draws (180 frames)
  // 270–359 cards slide in
  // 360–449 tagline hold

  /* Background hue drift */
  const bgHue = interpolate(frame, [0, 450], theme.bgHueRange, {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });

  /* Grid + title opacity */
  const gridOpacity    = lerp01(frame, 10, 45);
  const titleOpacity   = lerp01(frame, 22, 55);
  const titleSlide     = interpolate(frame, [22, 55], [18, 0], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  const subtitleOpacity = lerp01(frame, 40, 68);

  /* Line draw — strokeDashoffset over frames 90–260 */
  const drawProg    = lerp01(frame, 90, 260);
  const dashOffset  = pathLen * (1 - drawProg);

  /* Area fill clip rect grows left-to-right matching the line front */
  const areaClipX2  = PL + PW * drawProg;

  /* Animated score counter: 60 → 92 while line draws */
  const minScore  = config.dataPoints[0].score;
  const maxScore  = config.dataPoints[config.dataPoints.length - 1].score;
  const liveScore = Math.round(
    interpolate(frame, [90, 260], [minScore, maxScore], {
      extrapolateLeft: "clamp", extrapolateRight: "clamp",
    })
  );
  const counterOpacity = lerp01(frame, 88, 105);

  /* Final dot ambient pulse after line completes */
  const pulseMag  = frame >= 262
    ? 0.5 + 0.5 * Math.abs(Math.sin((frame - 262) * 0.09))
    : 0;

  /* Strategy cards: stagger from frame 270 */
  const cardVisible = (i: number) => lerp01(frame, 280 + i * 24, 310 + i * 24);
  const cardSlide   = (i: number) =>
    interpolate(frame, [280 + i * 24, 310 + i * 24], [40, 0], {
      extrapolateLeft: "clamp", extrapolateRight: "clamp",
    });

  /* Tagline */
  const taglineOpacity = lerp01(frame, 365, 395);

  /* ── Commentary helpers ──────────────────────────────────────────────── */
  const activeLine = config.commentary?.find(
    (l) => frame >= l.startFrame && frame < l.endFrame
  );
  const commentaryOpacity = activeLine
    ? Math.min(
        lerp01(frame, activeLine.startFrame, activeLine.startFrame + 15),
        1 - lerp01(frame, activeLine.endFrame - 15, activeLine.endFrame)
      )
    : 0;
  const commentarySlide = activeLine
    ? interpolate(frame, [activeLine.startFrame, activeLine.startFrame + 15], [8, 0], {
        extrapolateLeft: "clamp", extrapolateRight: "clamp",
      })
    : 0;

  /* ── Render ──────────────────────────────────────────────────────────── */
  return (
    <div
      style={{
        width,
        height,
        position: "relative",
        overflow: "hidden",
        background: `radial-gradient(ellipse at 48% 38%,
          hsl(${bgHue}, 34%, 13%) 0%,
          hsl(${bgHue}, 42%, 5%) 100%)`,
        fontFamily: '"DM Sans", system-ui, sans-serif',
      }}
    >
      {/* ── Premium gold vignette — top right ──────────────────────── */}
      <div
        style={{
          position: "absolute",
          top: -100, right: -100,
          width: 520, height: 520,
          borderRadius: "50%",
          background: `radial-gradient(circle,
            ${hex(gold, 0.07)} 0%, transparent 68%)`,
          filter: "blur(48px)",
          pointerEvents: "none",
        }}
      />

      {/* ── Ambient shimmer particles ───────────────────────────────── */}
      {[...Array(8)].map((_, i) => {
        const px    = 6 + i * 13;
        const py    = 8 + ((i * 41) % 78);
        const drift = Math.sin(frame / 52 + i * 1.2) * 16;
        const tw    = 0.035 + 0.03 * Math.abs(Math.sin(frame / 38 + i));
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `${px}%`, top: `${py}%`,
              width: 2 + (i % 3), height: 2 + (i % 3),
              borderRadius: "50%",
              background: i % 2 === 0 ? hex(gold, tw) : hex(blue, tw * 0.75),
              transform: `translateY(${drift}px)`,
              filter: "blur(0.5px)",
            }}
          />
        );
      })}

      {/* ══════════════════════════════════════════════════════════════
       *  TITLE BLOCK — top centre
       * ══════════════════════════════════════════════════════════════ */}
      <div
        style={{
          position: "absolute",
          top: 56, left: 0, right: 0,
          display: "flex",
          flexDirection: "column" as const,
          alignItems: "center",
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            opacity: titleOpacity,
            transform: `translateY(${titleSlide}px)`,
            textAlign: "center" as const,
          }}
        >
          <div
            style={{
              fontFamily: '"DM Sans", system-ui, sans-serif',
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.22em",
              textTransform: "uppercase" as const,
              color: hex(gold, 0.72),
              marginBottom: 10,
            }}
          >
            {config.indexLabel} · 4-Week View
          </div>
          <div
            style={{
              fontFamily: '"Instrument Serif", Georgia, serif',
              fontSize: 46,
              lineHeight: 1.1,
              color: "rgba(255,255,255,0.92)",
              fontWeight: 400,
            }}
          >
            Your Growth Trajectory
          </div>
        </div>
        <div
          style={{
            opacity: subtitleOpacity,
            fontFamily: '"DM Sans", system-ui, sans-serif',
            fontSize: 13,
            color: "rgba(255,255,255,0.34)",
            letterSpacing: "0.07em",
            marginTop: 8,
          }}
        >
          Powered by Soulora Intelligence
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════
       *  SCORE COUNTER — top right corner
       * ══════════════════════════════════════════════════════════════ */}
      <div
        style={{
          position: "absolute",
          top: 48, right: 96,
          textAlign: "right" as const,
          opacity: counterOpacity,
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            fontFamily: '"DM Sans", system-ui, sans-serif',
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: "0.2em",
            textTransform: "uppercase" as const,
            color: hex(gold, 0.58),
            marginBottom: 2,
          }}
        >
          {config.indexLabel}
        </div>
        <div
          style={{
            fontFamily: '"Instrument Serif", Georgia, serif',
            fontSize: 88,
            lineHeight: 1,
            color: gold,
            filter: pulseMag > 0
              ? `drop-shadow(0 0 ${22 * pulseMag}px ${hex(gold, 0.5 * pulseMag)})`
              : "none",
          }}
        >
          {liveScore}
        </div>
        <div
          style={{
            fontFamily: '"DM Sans", system-ui, sans-serif',
            fontSize: 13,
            color: "rgba(255,255,255,0.28)",
            marginTop: 2,
          }}
        >
          / 100
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════
       *  2D LINE GRAPH (hero element)
       * ══════════════════════════════════════════════════════════════ */}
      <div
        style={{
          position: "absolute",
          top: 168,
          left: "50%",
          transform: "translateX(-50%)",
        }}
      >
        <svg
          width={CW}
          height={CH}
          viewBox={`0 0 ${CW} ${CH}`}
          style={{ overflow: "visible" }}
        >
          <defs>
            {/* Line gradient: blue (start) → gold (end) */}
            <linearGradient id="vt_line" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%"   stopColor={blue} />
              <stop offset="55%"  stopColor={hex(gold, 0.9)} />
              <stop offset="100%" stopColor={gold} />
            </linearGradient>

            {/* Area fill: gold → transparent */}
            <linearGradient id="vt_area" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%"   stopColor={gold} stopOpacity={0.28} />
              <stop offset="75%"  stopColor={gold} stopOpacity={0.06} />
              <stop offset="100%" stopColor={gold} stopOpacity={0} />
            </linearGradient>

            {/* Clip rect that expands left-to-right as line draws */}
            <clipPath id="vt_clip">
              <rect x={PL} y={0} width={Math.max(0, areaClipX2 - PL)} height={CH} />
            </clipPath>
          </defs>

          {/* ── Y-axis grid lines ─────────────────────────────────── */}
          <g opacity={gridOpacity}>
            {GRID.map((score) => {
              const gy = sy(score);
              return (
                <g key={score}>
                  <line
                    x1={PL} y1={gy} x2={PL + PW} y2={gy}
                    stroke="rgba(255,255,255,0.055)"
                    strokeWidth={1}
                    strokeDasharray="4 6"
                  />
                  <text
                    x={PL - 12} y={gy + 4}
                    textAnchor="end"
                    fill="rgba(255,255,255,0.25)"
                    fontSize={12}
                    fontFamily='"DM Sans", system-ui, sans-serif'
                  >
                    {score}
                  </text>
                </g>
              );
            })}

            {/* X-axis baseline */}
            <line
              x1={PL} y1={BOT} x2={PL + PW} y2={BOT}
              stroke="rgba(255,255,255,0.1)"
              strokeWidth={1}
            />

            {/* Vertical tick marks + X labels */}
            {pts.map((pt, i) => (
              <g key={i}>
                <line
                  x1={pt.x} y1={BOT} x2={pt.x} y2={BOT + 7}
                  stroke="rgba(255,255,255,0.18)"
                  strokeWidth={1}
                />
                <text
                  x={pt.x} y={BOT + 24}
                  textAnchor="middle"
                  fill="rgba(255,255,255,0.32)"
                  fontSize={12}
                  fontFamily='"DM Sans", system-ui, sans-serif'
                >
                  {pt.label}
                </text>
              </g>
            ))}
          </g>

          {/* ── Area fill (clipped) ───────────────────────────────── */}
          <path
            d={fillStr}
            fill="url(#vt_area)"
            clipPath="url(#vt_clip)"
          />

          {/* ── Animated trend line ───────────────────────────────── */}
          <path
            d={pathStr}
            fill="none"
            stroke="url(#vt_line)"
            strokeWidth={3.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray={pathLen}
            strokeDashoffset={dashOffset}
            style={{
              filter: `drop-shadow(0 0 8px ${hex(gold, 0.48)})`,
            }}
          />

          {/* ── Data point dots ───────────────────────────────────── */}
          {pts.map((pt, i) => {
            // Dot appears when the line front passes its x position
            const dotStart = 90 + 170 * (i / (pts.length - 1));
            const dotProg  = lerp01(frame, dotStart, dotStart + 16);
            const dotScale = dotProg;
            const isLast   = i === pts.length - 1;
            const R        = isLast ? 9 : 6;
            const pulse    = isLast && pulseMag > 0 ? pulseMag : 0;

            return (
              <g
                key={i}
                transform={`translate(${pt.x},${pt.y})`}
                opacity={dotProg}
                style={{ transformOrigin: `${pt.x}px ${pt.y}px` }}
              >
                {/* Outer glow ring (final dot only) */}
                {isLast && pulse > 0 && (
                  <circle
                    r={R * 3.2}
                    fill={gold}
                    opacity={0.1 * pulse}
                  />
                )}
                {/* Scaled-in dot */}
                <g transform={`scale(${dotScale})`}>
                  {/* Coloured fill */}
                  <circle
                    r={R}
                    fill={isLast ? gold : hex(gold, 0.7)}
                    style={
                      isLast
                        ? { filter: `drop-shadow(0 0 10px ${hex(gold, 0.7 * (0.5 + 0.5 * pulse))})` }
                        : {}
                    }
                  />
                  {/* Dark inner pip */}
                  <circle r={R - 3.5} fill="hsl(228,42%,8%)" />
                </g>

                {/* Score label above dot */}
                {dotProg > 0.1 && (
                  <text
                    y={-(R + 12)}
                    textAnchor="middle"
                    fill={isLast ? gold : "rgba(255,255,255,0.52)"}
                    fontSize={isLast ? 15 : 12}
                    fontWeight={isLast ? 700 : 400}
                    fontFamily='"DM Sans", system-ui, sans-serif'
                    opacity={dotProg}
                    style={
                      isLast && pulse > 0
                        ? { filter: `drop-shadow(0 0 6px ${hex(gold, 0.55 * pulse)})` }
                        : {}
                    }
                  >
                    {pt.score}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* ══════════════════════════════════════════════════════════════
       *  STRATEGY CARDS — stagger in from frame 270
       * ══════════════════════════════════════════════════════════════ */}
      <div
        style={{
          position: "absolute",
          bottom: 96,
          left: 0, right: 0,
          display: "flex",
          justifyContent: "center",
          gap: 22,
          pointerEvents: "none",
        }}
      >
        {config.strategyCards.map((card, i) => (
          <div
            key={i}
            style={{
              opacity: cardVisible(i),
              transform: `translateY(${cardSlide(i)}px)`,
              background: hex(gold, 0.055),
              border: `1px solid ${hex(gold, 0.22)}`,
              borderRadius: 18,
              padding: "24px 26px",
              width: 300,
              backdropFilter: "blur(14px)",
              WebkitBackdropFilter: "blur(14px)",
              boxShadow: `0 10px 48px rgba(0,0,0,0.38),
                          inset 0 1px 0 ${hex(gold, 0.09)}`,
            }}
          >
            <div style={{ fontSize: 32, lineHeight: 1, marginBottom: 12 }}>
              {card.icon}
            </div>
            <div
              style={{
                fontFamily: '"DM Sans", system-ui, sans-serif',
                fontSize: 14,
                fontWeight: 600,
                color: hex(gold, 0.9),
                marginBottom: 9,
                letterSpacing: "0.01em",
              }}
            >
              {card.title}
            </div>
            <div
              style={{
                fontFamily: '"DM Sans", system-ui, sans-serif',
                fontSize: 12.5,
                color: "rgba(255,255,255,0.5)",
                lineHeight: 1.6,
              }}
            >
              {card.body}
            </div>
          </div>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════════════
       *  TAGLINE
       * ══════════════════════════════════════════════════════════════ */}
      <div
        style={{
          position: "absolute",
          bottom: 44,
          left: 0, right: 0,
          display: "flex",
          justifyContent: "center",
          opacity: taglineOpacity,
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            fontFamily: '"Instrument Serif", Georgia, serif',
            fontSize: 18,
            fontStyle: "italic",
            color: hex(gold, 0.45),
            letterSpacing: "0.02em",
          }}
        >
          {config.tagline}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════
       *  COMMENTARY OVERLAY
       * ══════════════════════════════════════════════════════════════ */}
      {activeLine && (
        <div
          style={{
            position: "absolute",
            bottom: frame >= 270 ? 330 : 48, // hop above cards when they appear
            left: 0, right: 0,
            display: "flex",
            justifyContent: "center",
            pointerEvents: "none",
            zIndex: 10,
            transition: "bottom 0.3s ease",
          }}
        >
          <div
            style={{
              opacity: commentaryOpacity,
              transform: `translateY(${commentarySlide}px)`,
              background: "rgba(0,0,0,0.48)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              borderRadius: 12,
              padding: "13px 34px",
              maxWidth: 940,
              textAlign: "center" as const,
              border: "1px solid rgba(255,255,255,0.07)",
            }}
          >
            <div
              style={{
                fontFamily: '"DM Sans", system-ui, sans-serif',
                fontSize: 17,
                fontWeight: 400,
                lineHeight: 1.55,
                color: "rgba(255,255,255,0.85)",
                letterSpacing: "0.01em",
              }}
            >
              {activeLine.text}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VisionTrend;

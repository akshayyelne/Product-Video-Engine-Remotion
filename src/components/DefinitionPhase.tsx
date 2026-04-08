import React from "react";
import {
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  Sequence,
} from "remotion";
import type { DefinitionPhaseConfig, CommentaryLine } from "../data/soulora-config";

/* ── Utilities ──────────────────────────────────────────────────────────── */

const hexToRgba = (hex: string, alpha: number): string => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
};

/* ══════════════════════════════════════════════════════════════════════════
 *  DEFINITION TIMING CONSTANTS (12s @ 30fps = 360 frames)
 *
 *  Zoom phase    : 0s–3s   → frames   0–89
 *  Reveal phase  : 3s–7s   → frames  90–209
 *  Insight phase : 7s–12s  → frames 210–359
 * ══════════════════════════════════════════════════════════════════════════ */

const FPS = 30;

const PHASE = {
  ZOOM_START:     0,
  ZOOM_END:       3 * FPS,   //  90
  REVEAL_START:   3 * FPS,   //  90
  REVEAL_END:     7 * FPS,   // 210
  INSIGHT_START:  7 * FPS,   // 210
  INSIGHT_END:    12 * FPS,  // 360
  TOTAL:          12 * FPS,  // 360
} as const;

/* ── Shared: StaticGauge ────────────────────────────────────────────────── */
// Renders the wellness gauge at a fixed score (no fill animation).
// The highlighted metric pill pulses in the accent colour.

interface StaticGaugeProps {
  config: DefinitionPhaseConfig;
  highlightIntensity?: number; // 0–1
  highlightPulse?: number;     // 0–1 oscillating value from the caller
}

const StaticGauge: React.FC<StaticGaugeProps> = ({
  config,
  highlightIntensity = 0,
  highlightPulse = 0,
}) => {
  const { theme, gauge } = config;
  const accent = theme.accentColor;

  const cx = 200, cy = 200, radius = 155, sw = 18;
  const circ = 2 * Math.PI * radius;
  const arcLen = circ * 0.75;
  const filledLen = arcLen * (gauge.targetScore / 100);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      {/* Label */}
      <div
        style={{
          fontFamily: '"DM Sans", system-ui, sans-serif',
          fontSize: 13,
          fontWeight: 500,
          letterSpacing: "0.1em",
          textTransform: "uppercase" as const,
          color: hexToRgba(theme.primaryColor, 0.7),
          marginBottom: 20,
        }}
      >
        {gauge.label}
      </div>

      {/* SVG arc */}
      <div style={{ position: "relative", width: 400, height: 400 }}>
        <svg width="400" height="400" viewBox="0 0 400 400">
          <defs>
            <linearGradient id="defGaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%"   stopColor={theme.primaryColor} />
              <stop offset="100%" stopColor={theme.secondaryColor} />
            </linearGradient>
          </defs>

          {/* Track */}
          <circle
            cx={cx} cy={cy} r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={sw}
            strokeDasharray={`${arcLen} ${circ}`}
            strokeLinecap="round"
            transform={`rotate(135, ${cx}, ${cy})`}
          />

          {/* Filled arc */}
          <circle
            cx={cx} cy={cy} r={radius}
            fill="none"
            stroke="url(#defGaugeGrad)"
            strokeWidth={sw}
            strokeDasharray={`${filledLen} ${circ}`}
            strokeLinecap="round"
            transform={`rotate(135, ${cx}, ${cy})`}
            style={{
              filter: `drop-shadow(0 0 10px ${hexToRgba(theme.primaryColor, 0.55)})`,
            }}
          />
        </svg>

        {/* Score */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -54%)",
            textAlign: "center" as const,
          }}
        >
          <div
            style={{
              fontFamily: '"Instrument Serif", Georgia, serif',
              fontSize: 86,
              lineHeight: 1,
              color: "rgba(255,255,255,0.95)",
              fontWeight: 400,
            }}
          >
            {gauge.targetScore}
          </div>
          <div
            style={{
              fontFamily: '"DM Sans", system-ui, sans-serif',
              fontSize: 14,
              color: "rgba(255,255,255,0.38)",
              letterSpacing: "0.06em",
              marginTop: 4,
            }}
          >
            / 100
          </div>
        </div>
      </div>

      {/* Metric pills */}
      <div style={{ display: "flex", gap: 16, marginTop: -24 }}>
        {gauge.metrics.map((metric, i) => {
          const isHL =
            metric.label.toLowerCase() === gauge.highlightMetric.toLowerCase();
          const glow   = isHL ? highlightIntensity : 0;
          const pulse  = isHL ? highlightPulse     : 0;

          return (
            <div
              key={i}
              style={{
                background: isHL
                  ? hexToRgba(accent, 0.08 + 0.08 * glow)
                  : "rgba(255,255,255,0.05)",
                border: `1px solid ${
                  isHL
                    ? hexToRgba(accent, 0.55 * glow * (0.6 + 0.4 * pulse))
                    : "rgba(255,255,255,0.08)"
                }`,
                borderRadius: 12,
                padding: "10px 22px",
                textAlign: "center" as const,
                backdropFilter: "blur(8px)",
                WebkitBackdropFilter: "blur(8px)",
                boxShadow: isHL
                  ? `0 0 ${22 * glow}px ${hexToRgba(accent, 0.28 * glow)}`
                  : "none",
              }}
            >
              <div
                style={{
                  fontFamily: '"Instrument Serif", Georgia, serif',
                  fontSize: 22,
                  color: isHL
                    ? hexToRgba(accent, 0.55 + 0.45 * glow)
                    : "rgba(255,255,255,0.9)",
                }}
              >
                {metric.value}
              </div>
              <div
                style={{
                  fontFamily: '"DM Sans", system-ui, sans-serif',
                  fontSize: 11,
                  color: isHL
                    ? hexToRgba(accent, 0.45 + 0.55 * glow)
                    : "rgba(255,255,255,0.38)",
                  letterSpacing: "0.05em",
                  textTransform: "uppercase" as const,
                  marginTop: 3,
                }}
              >
                {metric.label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════════════════
 *  Phase 1: Zoom (frames 0–89)
 *  The wellness gauge zooms in from 1× to 1.5×.
 *  The "Sleep" metric begins to pulse amber at frame 45.
 * ══════════════════════════════════════════════════════════════════════════ */

const ZoomPhase: React.FC<{ config: DefinitionPhaseConfig }> = ({ config }) => {
  const frame = useCurrentFrame();

  const fadeIn = interpolate(frame, [0, 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const scale = interpolate(frame, [0, 70], [1.0, 1.5], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const sleepGlow = interpolate(frame - 45, [0, 25], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const pulse = sleepGlow > 0 ? 0.6 + 0.4 * Math.abs(Math.sin(frame * 0.12)) : 0;

  return (
    <div
      style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: `translate(-50%, -50%) scale(${scale})`,
        transformOrigin: "center center",
        opacity: fadeIn,
      }}
    >
      <StaticGauge
        config={config}
        highlightIntensity={sleepGlow}
        highlightPulse={pulse}
      />
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════════════════
 *  Phase 2: Correlation Reveal (Sequence frames 0–119, global 90–209)
 *  The gauge fades to background; a cause → effect correlation panel
 *  slides in with an animated drawing arrow.
 * ══════════════════════════════════════════════════════════════════════════ */

const CorrelationRevealPhase: React.FC<{ config: DefinitionPhaseConfig }> = ({
  config,
}) => {
  const frame = useCurrentFrame(); // 0–119 within Sequence
  const { theme, insight } = config;
  const accent = theme.accentColor;

  // Background gauge scales back and fades
  const bgScale   = interpolate(frame, [0, 40], [1.5, 0.85], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const bgOpacity = interpolate(frame, [0, 30], [0.55, 0.12], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Correlation panel slides up
  const panelY       = interpolate(frame, [20, 55], [80, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const panelOpacity = interpolate(frame, [20, 50], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Cause card slides in from left
  const causeX       = interpolate(frame, [35, 65], [-50, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const causeOpacity = interpolate(frame, [35, 60], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Arrow draws left-to-right (strokeDashoffset trick)
  const arrowProgress = interpolate(frame, [65, 95], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const LINE_LEN = 134; // px

  // Effect card slides in from right
  const effectX       = interpolate(frame, [90, 115], [50, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const effectOpacity = interpolate(frame, [90, 115], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }}>
      {/* Faded gauge in background */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: `translate(-50%, -50%) scale(${bgScale})`,
          opacity: bgOpacity,
        }}
      >
        <StaticGauge config={config} highlightIntensity={1} highlightPulse={0.8} />
      </div>

      {/* Correlation panel */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: `translate(-50%, calc(-50% + ${panelY}px))`,
          opacity: panelOpacity,
          display: "flex",
          flexDirection: "column" as const,
          alignItems: "center",
        }}
      >
        {/* Header label */}
        <div
          style={{
            fontFamily: '"DM Sans", system-ui, sans-serif',
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "0.18em",
            textTransform: "uppercase" as const,
            color: hexToRgba(accent, 0.8),
            marginBottom: 28,
          }}
        >
          PATTERN DETECTED
        </div>

        {/* Cause  ──────arrow──────  Effect */}
        <div style={{ display: "flex", alignItems: "center" }}>
          {/* Cause card */}
          <div
            style={{
              transform: `translateX(${causeX}px)`,
              opacity: causeOpacity,
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 16,
              padding: "24px 32px",
              textAlign: "center" as const,
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              minWidth: 200,
            }}
          >
            <div style={{ fontSize: 48, lineHeight: 1, marginBottom: 12 }}>
              {insight.causeIcon}
            </div>
            <div
              style={{
                fontFamily: '"DM Sans", system-ui, sans-serif',
                fontSize: 16,
                fontWeight: 500,
                color: "rgba(255,255,255,0.9)",
              }}
            >
              {insight.causeLabel}
            </div>
            {insight.causeTime && (
              <div
                style={{
                  fontFamily: '"DM Sans", system-ui, sans-serif',
                  fontSize: 13,
                  color: hexToRgba(accent, 0.85),
                  marginTop: 4,
                }}
              >
                {insight.causeTime}
              </div>
            )}
          </div>

          {/* Drawing arrow */}
          <div style={{ padding: "0 20px", display: "flex", alignItems: "center" }}>
            <svg width="160" height="40" viewBox="0 0 160 40">
              <line
                x1="8"
                y1="20"
                x2="144"
                y2="20"
                stroke={accent}
                strokeWidth="2"
                strokeLinecap="round"
                strokeDasharray={`${LINE_LEN}`}
                strokeDashoffset={LINE_LEN * (1 - arrowProgress)}
                opacity={0.75}
              />
              {arrowProgress > 0.85 && (
                <polygon
                  points="144,14 158,20 144,26"
                  fill={accent}
                  opacity={Math.min(1, (arrowProgress - 0.85) * 6.67)}
                />
              )}
            </svg>
          </div>

          {/* Effect card */}
          <div
            style={{
              transform: `translateX(${effectX}px)`,
              opacity: effectOpacity,
              background: hexToRgba(accent, 0.08),
              border: `1px solid ${hexToRgba(accent, 0.35)}`,
              borderRadius: 16,
              padding: "24px 32px",
              textAlign: "center" as const,
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              minWidth: 200,
              boxShadow: `0 0 32px ${hexToRgba(accent, 0.14)}`,
            }}
          >
            <div style={{ fontSize: 48, lineHeight: 1, marginBottom: 12 }}>
              {insight.effectIcon}
            </div>
            <div
              style={{
                fontFamily: '"DM Sans", system-ui, sans-serif',
                fontSize: 16,
                fontWeight: 500,
                color: "rgba(255,255,255,0.9)",
              }}
            >
              {insight.effectLabel}
            </div>
            <div
              style={{
                fontFamily: '"Instrument Serif", Georgia, serif',
                fontSize: 28,
                fontStyle: "italic",
                color: accent,
                marginTop: 6,
              }}
            >
              {insight.effectDelta}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════════════════
 *  Phase 3: Insight Card (Sequence frames 0–149, global 210–359)
 *  A centred card presents the full correlation with staggered reveals
 *  and a continuous amber pulse on the effect metric.
 * ══════════════════════════════════════════════════════════════════════════ */

const InsightCardPhase: React.FC<{ config: DefinitionPhaseConfig }> = ({ config }) => {
  const frame = useCurrentFrame(); // 0–149 within Sequence
  const { theme, insight } = config;
  const accent = theme.accentColor;

  // Card scales and fades in
  const cardScale   = interpolate(frame, [0, 40], [0.88, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const cardOpacity = interpolate(frame, [0, 30], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Staggered element reveals
  const headerOpacity = interpolate(frame - 20, [0, 22], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const causeOpacity  = interpolate(frame - 35, [0, 22], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const arrowOpacity  = interpolate(frame - 52, [0, 18], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const effectOpacity = interpolate(frame - 62, [0, 22], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Ongoing pulse on the effect metric
  const pulse = 0.6 + 0.4 * Math.abs(Math.sin(frame * 0.1));

  return (
    <div
      style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: `translate(-50%, -50%) scale(${cardScale})`,
        opacity: cardOpacity,
      }}
    >
      {/* Outer glow halo */}
      <div
        style={{
          position: "absolute",
          inset: -48,
          borderRadius: 48,
          background: `radial-gradient(ellipse at 50% 50%, ${hexToRgba(accent, 0.06 * pulse)} 0%, transparent 70%)`,
          filter: "blur(24px)",
        }}
      />

      {/* Card */}
      <div
        style={{
          position: "relative",
          background: "rgba(10,12,18,0.88)",
          border: "1px solid rgba(255,255,255,0.09)",
          borderRadius: 24,
          padding: "48px 72px",
          backdropFilter: "blur(28px)",
          WebkitBackdropFilter: "blur(28px)",
          textAlign: "center" as const,
          minWidth: 680,
          boxShadow:
            "0 32px 80px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.04)",
        }}
      >
        {/* Header */}
        <div
          style={{
            opacity: headerOpacity,
            fontFamily: '"DM Sans", system-ui, sans-serif',
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "0.22em",
            textTransform: "uppercase" as const,
            color: hexToRgba(accent, 0.8),
            marginBottom: 40,
          }}
        >
          PATTERN IDENTIFIED
        </div>

        {/* Cause ── arrow ── Effect row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 32,
          }}
        >
          {/* Cause */}
          <div style={{ opacity: causeOpacity, textAlign: "center" as const }}>
            <div style={{ fontSize: 56, lineHeight: 1, marginBottom: 14 }}>
              {insight.causeIcon}
            </div>
            <div
              style={{
                fontFamily: '"DM Sans", system-ui, sans-serif',
                fontSize: 15,
                fontWeight: 500,
                color: "rgba(255,255,255,0.78)",
                lineHeight: 1.35,
              }}
            >
              {insight.causeLabel}
              {insight.causeTime && (
                <>
                  <br />
                  <span
                    style={{
                      color: hexToRgba(accent, 0.9),
                      fontWeight: 400,
                    }}
                  >
                    {insight.causeTime}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Arrow */}
          <div style={{ opacity: arrowOpacity }}>
            <svg width="80" height="24" viewBox="0 0 80 24">
              <line
                x1="4"
                y1="12"
                x2="64"
                y2="12"
                stroke={accent}
                strokeWidth="2"
                strokeLinecap="round"
                opacity={0.6}
              />
              <polygon points="64,6 76,12 64,18" fill={accent} opacity={0.6} />
            </svg>
          </div>

          {/* Effect */}
          <div
            style={{
              opacity: effectOpacity,
              textAlign: "center" as const,
              background: hexToRgba(accent, 0.06 + 0.04 * pulse),
              border: `1px solid ${hexToRgba(accent, 0.3 + 0.2 * pulse)}`,
              borderRadius: 16,
              padding: "22px 32px",
              boxShadow: `0 0 ${36 * pulse}px ${hexToRgba(accent, 0.13)}`,
            }}
          >
            <div style={{ fontSize: 56, lineHeight: 1, marginBottom: 14 }}>
              {insight.effectIcon}
            </div>
            <div
              style={{
                fontFamily: '"DM Sans", system-ui, sans-serif',
                fontSize: 15,
                fontWeight: 500,
                color: "rgba(255,255,255,0.78)",
              }}
            >
              {insight.effectLabel}
            </div>
            <div
              style={{
                fontFamily: '"Instrument Serif", Georgia, serif',
                fontSize: 38,
                fontStyle: "italic",
                color: accent,
                marginTop: 8,
                filter: `drop-shadow(0 0 8px ${hexToRgba(accent, 0.4 * pulse)})`,
              }}
            >
              {insight.effectDelta}
            </div>
          </div>
        </div>
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
  const opacity   = Math.min(fadeIn, fadeOut);
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
        left: 0,
        right: 0,
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
          padding: "14px 32px",
          maxWidth: 860,
          textAlign: "center" as const,
          border: "1px solid rgba(255,255,255,0.08)",
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
 *  DefinitionPhase — Stage 2 Composition (12s / 360 frames)
 *
 *  Phase 1 (0s–3s):  InsightHighlight — zooms into the Stage 1 gauge,
 *                    spotlights the Sleep metric in amber.
 *  Phase 2 (3s–7s):  CorrelationReveal — draws the Caffeine → Sleep
 *                    connection with an animated arrow.
 *  Phase 3 (7s–12s): InsightCard — centred card summarising the pattern.
 * ══════════════════════════════════════════════════════════════════════════ */

interface DefinitionPhaseProps {
  config: DefinitionPhaseConfig;
}

const DefinitionPhase: React.FC<DefinitionPhaseProps> = ({ config }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const { theme } = config;

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
        background: `radial-gradient(ellipse at 50% 40%, hsl(${bgHue}, 18%, 12%) 0%, hsl(${bgHue}, 22%, 6%) 100%)`,
        position: "relative",
        overflow: "hidden",
        fontFamily: '"DM Sans", system-ui, sans-serif',
      }}
    >
      {/* Ambient drifting particles */}
      {[...Array(6)].map((_, i) => {
        const x     = 15 + i * 16;
        const y     = 20 + ((i * 37) % 60);
        const drift = Math.sin(frame / 60 + i) * 12;
        return (
          <div
            key={`particle-${i}`}
            style={{
              position: "absolute",
              left: `${x}%`,
              top: `${y}%`,
              width: 3 + (i % 3) * 2,
              height: 3 + (i % 3) * 2,
              borderRadius: "50%",
              background:
                i % 2 === 0
                  ? hexToRgba(theme.primaryColor, 0.12)
                  : hexToRgba(theme.secondaryColor, 0.1),
              transform: `translateY(${drift}px)`,
              filter: "blur(1px)",
            }}
          />
        );
      })}

      {/* ── Phase 1: ZOOM (0s–3s / frames 0–89) ────────────────────── */}
      <Sequence from={PHASE.ZOOM_START} durationInFrames={PHASE.ZOOM_END - PHASE.ZOOM_START}>
        <ZoomPhase config={config} />
      </Sequence>

      {/* ── Phase 2: CORRELATION REVEAL (3s–7s / frames 90–209) ─────── */}
      <Sequence
        from={PHASE.REVEAL_START}
        durationInFrames={PHASE.REVEAL_END - PHASE.REVEAL_START}
      >
        <CorrelationRevealPhase config={config} />
      </Sequence>

      {/* ── Phase 3: INSIGHT CARD (7s–12s / frames 210–359) ─────────── */}
      <Sequence
        from={PHASE.INSIGHT_START}
        durationInFrames={PHASE.INSIGHT_END - PHASE.INSIGHT_START}
      >
        <InsightCardPhase config={config} />
      </Sequence>

      {/* Commentary overlay — narrative script */}
      {config.commentary && config.commentary.length > 0 && (
        <CommentaryOverlay lines={config.commentary} frame={frame} />
      )}
    </div>
  );
};

export default DefinitionPhase;

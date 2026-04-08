import React from "react";
import {
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  Sequence,
} from "remotion";
import type { DiscoveryPhaseConfig, CommentaryLine } from "../data/soulora-config";

/* ── Utilities ──────────────────────────────────────────────────────── */

const hexToRgba = (hex: string, alpha: number): string => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
};

const easeInOut = (t: number): number =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

/* ══════════════════════════════════════════════════════════════════════
 *  DISCOVERY TIMING CONSTANTS (12s @ 30fps = 360 frames)
 *
 *  Noise phase   : 0s–4s   → frames 0–119
 *  Collapse phase: 4s–8s   → frames 120–239
 *  Vision phase  : 8s–12s  → frames 240–359
 * ══════════════════════════════════════════════════════════════════════ */

const FPS = 30;

const PHASE = {
  NOISE_START:    0,
  NOISE_END:      4 * FPS,   // 120
  COLLAPSE_START: 4 * FPS,   // 120
  COLLAPSE_END:   8 * FPS,   // 240
  VISION_START:   8 * FPS,   // 240
  VISION_END:     12 * FPS,  // 360
  TOTAL:          12 * FPS,  // 360
} as const;

/* ── Scattered data icons — 3×3 grid with intentional offsets ────────── */

const DATA_ICONS = [
  { icon: "⌚", label: "Watch",   sx: -340, sy: -200, seed: 0 },
  { icon: "📱", label: "Phone",   sx:    0, sy: -260, seed: 1 },
  { icon: "📔", label: "Journal", sx:  340, sy: -180, seed: 2 },
  { icon: "📔", label: "Journal", sx: -380, sy:   20, seed: 3 },
  { icon: "⌚", label: "Watch",   sx:  -40, sy:  -20, seed: 4 },
  { icon: "📱", label: "Phone",   sx:  360, sy:   30, seed: 5 },
  { icon: "📱", label: "Phone",   sx: -320, sy:  210, seed: 6 },
  { icon: "📔", label: "Journal", sx:   10, sy:  240, seed: 7 },
  { icon: "⌚", label: "Watch",   sx:  330, sy:  220, seed: 8 },
] as const;

/* ══════════════════════════════════════════════════════════════════════
 *  Phase 1: Data Noise (0s–4s)
 *  9 scattered icons drift with subtle noise, stagger-fade in
 * ══════════════════════════════════════════════════════════════════════ */

const DataNoisePhase: React.FC<{ theme: DiscoveryPhaseConfig["theme"] }> = ({ theme }) => {
  const frame = useCurrentFrame();

  const containerOpacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        opacity: containerOpacity,
      }}
    >
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
        }}
      >
        {DATA_ICONS.map((item, i) => {
          const drift  = Math.sin(frame / 40 + item.seed * 1.3) * 8;
          const driftX = Math.cos(frame / 50 + item.seed * 0.9) * 6;
          const rotate = Math.sin(frame / 60 + item.seed * 2.1) * 4;

          const iconOpacity = interpolate(frame, [i * 5, i * 5 + 15], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });

          return (
            <div
              key={i}
              style={{
                position: "absolute",
                transform: `translate(calc(-50% + ${item.sx + driftX}px), calc(-50% + ${item.sy + drift}px)) rotate(${rotate}deg)`,
                opacity: iconOpacity,
                textAlign: "center",
              }}
            >
              <div
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: 20,
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  backdropFilter: "blur(8px)",
                  WebkitBackdropFilter: "blur(8px)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: `0 4px 20px ${hexToRgba(theme.primaryColor, 0.12)}`,
                }}
              >
                <span style={{ fontSize: 36 }}>{item.icon}</span>
              </div>
              <div
                style={{
                  marginTop: 6,
                  fontFamily: '"DM Sans", system-ui, sans-serif',
                  fontSize: 11,
                  color: "rgba(255,255,255,0.35)",
                  letterSpacing: "0.06em",
                  textTransform: "uppercase" as const,
                }}
              >
                {item.label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════════════
 *  Phase 2: Collapse (4s–8s)
 *  Icons ease-in-out toward center, fade + scale down, energy burst
 * ══════════════════════════════════════════════════════════════════════ */

const CollapsePhase: React.FC<{ theme: DiscoveryPhaseConfig["theme"] }> = ({ theme }) => {
  const frame = useCurrentFrame();

  const rawProgress = frame / (PHASE.COLLAPSE_END - PHASE.COLLAPSE_START);
  const progress = easeInOut(Math.min(1, rawProgress));

  const burstSize   = interpolate(progress, [0.4, 0.75, 1.0], [0, 160, 60]);
  const burstOpacity = interpolate(progress, [0.4, 0.7, 1.0], [0, 0.9, 0]);

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
        }}
      >
        {DATA_ICONS.map((item, i) => {
          const currentX = item.sx * (1 - progress);
          const currentY = item.sy * (1 - progress);
          const iconOpacity = interpolate(progress, [0.55, 1.0], [1, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          const scale = interpolate(progress, [0, 1], [1, 0.25], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          const blur = interpolate(progress, [0.5, 1.0], [0, 10], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });

          return (
            <div
              key={i}
              style={{
                position: "absolute",
                transform: `translate(calc(-50% + ${currentX}px), calc(-50% + ${currentY}px)) scale(${scale})`,
                opacity: iconOpacity,
                filter: `blur(${blur}px)`,
                textAlign: "center",
              }}
            >
              <div
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: 20,
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: `0 4px 20px ${hexToRgba(theme.primaryColor, 0.2)}`,
                }}
              >
                <span style={{ fontSize: 36 }}>{item.icon}</span>
              </div>
            </div>
          );
        })}

        {/* Energy burst as icons converge */}
        {progress > 0.4 && (
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              width: burstSize,
              height: burstSize,
              transform: "translate(-50%, -50%)",
              borderRadius: "50%",
              background: `radial-gradient(circle, ${hexToRgba(theme.primaryColor, 0.6)} 0%, ${hexToRgba(theme.secondaryColor, 0.25)} 55%, transparent 100%)`,
              filter: "blur(14px)",
              opacity: burstOpacity,
            }}
          />
        )}
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════════════
 *  Phase 3: Vision Reveal (8s–12s)
 *  SVG arc gauge fills to targetScore, metrics stagger in, tagline fades
 * ══════════════════════════════════════════════════════════════════════ */

const WellnessGauge: React.FC<{ config: DiscoveryPhaseConfig }> = ({ config }) => {
  const frame = useCurrentFrame();
  const { theme, gauge } = config;

  const containerOpacity = interpolate(frame, [0, 25], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Gauge fills over first 70 active frames
  const gaugeProgress = interpolate(frame, [10, 80], [0, gauge.targetScore / 100], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const displayScore = Math.round(gaugeProgress * gauge.targetScore);

  // SVG arc: 270° gauge (gap at bottom)
  const cx = 200;
  const cy = 200;
  const radius = 155;
  const strokeWidth = 18;
  const circumference = 2 * Math.PI * radius;
  const arcLength = circumference * 0.75; // 270° = 75% of circle
  const filledLength = arcLength * gaugeProgress;

  const taglineOpacity = interpolate(frame, [90, 110], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        display: "flex",
        flexDirection: "column" as const,
        alignItems: "center",
        opacity: containerOpacity,
      }}
    >
      {/* Section label */}
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

      {/* SVG Gauge */}
      <div style={{ position: "relative", width: 400, height: 400 }}>
        <svg width="400" height="400" viewBox="0 0 400 400">
          <defs>
            <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%"   stopColor={theme.primaryColor} />
              <stop offset="100%" stopColor={theme.secondaryColor} />
            </linearGradient>
          </defs>

          {/* Background track (270° arc) */}
          <circle
            cx={cx}
            cy={cy}
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={strokeWidth}
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeLinecap="round"
            transform={`rotate(135, ${cx}, ${cy})`}
          />

          {/* Filled arc */}
          {filledLength > 1 && (
            <circle
              cx={cx}
              cy={cy}
              r={radius}
              fill="none"
              stroke="url(#gaugeGrad)"
              strokeWidth={strokeWidth}
              strokeDasharray={`${filledLength} ${circumference}`}
              strokeLinecap="round"
              transform={`rotate(135, ${cx}, ${cy})`}
              style={{
                filter: `drop-shadow(0 0 10px ${hexToRgba(theme.primaryColor, 0.55)})`,
              }}
            />
          )}
        </svg>

        {/* Score centred inside gauge */}
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
            {displayScore}
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

      {/* Metric pills — stagger-fade in */}
      <div
        style={{
          display: "flex",
          gap: 16,
          marginTop: -24,
        }}
      >
        {gauge.metrics.map((metric, i) => {
          const pillOpacity = interpolate(frame - i * 12, [65, 85], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          return (
            <div
              key={i}
              style={{
                opacity: pillOpacity,
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 12,
                padding: "10px 22px",
                textAlign: "center" as const,
                backdropFilter: "blur(8px)",
                WebkitBackdropFilter: "blur(8px)",
              }}
            >
              <div
                style={{
                  fontFamily: '"Instrument Serif", Georgia, serif',
                  fontSize: 22,
                  color: "rgba(255,255,255,0.9)",
                }}
              >
                {metric.value}
              </div>
              <div
                style={{
                  fontFamily: '"DM Sans", system-ui, sans-serif',
                  fontSize: 11,
                  color: "rgba(255,255,255,0.38)",
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

      {/* Tagline */}
      <div
        style={{
          marginTop: 44,
          opacity: taglineOpacity,
          fontFamily: '"Instrument Serif", Georgia, serif',
          fontSize: 22,
          color: "rgba(255,255,255,0.52)",
          fontStyle: "italic",
          letterSpacing: "0.02em",
          textAlign: "center" as const,
        }}
      >
        {config.tagline}
      </div>
    </div>
  );
};

/* ── Commentary Overlay ─────────────────────────────────────────────── */

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
  const opacity = Math.min(fadeIn, fadeOut);
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
          maxWidth: 800,
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

/* ══════════════════════════════════════════════════════════════════════
 *  DiscoveryPhase — Stage 1 Composition (12s / 360 frames)
 *
 *  Takes a single `config` prop (DiscoveryPhaseConfig).
 *  Background hue animates from green (120°) → blue (210°) over 12s,
 *  matching the Wellness Alchemist Green-to-Blue theme.
 * ══════════════════════════════════════════════════════════════════════ */

interface DiscoveryPhaseProps {
  config: DiscoveryPhaseConfig;
}

const DiscoveryPhase: React.FC<DiscoveryPhaseProps> = ({ config }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const { theme } = config;

  const bgHue = interpolate(frame, [0, PHASE.TOTAL], [theme.bgHueRange[0], theme.bgHueRange[1]], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

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
        const x    = 15 + i * 16;
        const y    = 20 + ((i * 37) % 60);
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

      {/* ── Phase 1: DATA NOISE (0s–4s / frames 0–119) ─────────────── */}
      <Sequence from={PHASE.NOISE_START} durationInFrames={PHASE.NOISE_END}>
        <DataNoisePhase theme={theme} />
      </Sequence>

      {/* ── Phase 2: COLLAPSE (4s–8s / frames 120–239) ─────────────── */}
      <Sequence
        from={PHASE.COLLAPSE_START}
        durationInFrames={PHASE.COLLAPSE_END - PHASE.COLLAPSE_START}
      >
        <CollapsePhase theme={theme} />
      </Sequence>

      {/* ── Phase 3: VISION REVEAL (8s–12s / frames 240–359) ────────── */}
      <Sequence
        from={PHASE.VISION_START}
        durationInFrames={PHASE.VISION_END - PHASE.VISION_START}
      >
        <WellnessGauge config={config} />
      </Sequence>

      {/* Commentary overlay — narrative script at bottom */}
      {config.commentary && config.commentary.length > 0 && (
        <CommentaryOverlay lines={config.commentary} frame={frame} />
      )}
    </div>
  );
};

export default DiscoveryPhase;

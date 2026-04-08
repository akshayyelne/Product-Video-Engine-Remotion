import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";

/* ── Hex → RGBA (local utility — no external imports) ───────────────── */

const hexToRgba = (hex: string, alpha: number): string => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
};

/* ── Props ──────────────────────────────────────────────────────────── */

interface AgentOrbProps {
  /** Frame range the orb is visible (set by parent via <Sequence>) */
  thinkingFragments: string[];
  theme: {
    orbGradientStart: string;
    orbGradientEnd: string;
  };
}

/**
 * AgentOrb — Pulsing thinking indicator
 *
 * Spec compliance (from agent-orb-specification.md):
 *   Animation : 2-second scale pulse (0.9x → 1.1x)
 *   Styling   : Radial gradient (orbGradientStart → orbGradientEnd), backdrop blur 10px
 *   Logic     : Rendered by parent during Thinking phase only
 *
 * The orb handles its own fade-in/out over the first and last 15 frames
 * of its local timeline. The parent controls when it mounts.
 */
const AgentOrb: React.FC<AgentOrbProps> = ({ thinkingFragments, theme }) => {
  const frame = useCurrentFrame(); // local frame within <Sequence>
  const { fps } = useVideoConfig();

  /* ── Pulse: 2-second period, 0.9x–1.1x range ──────────────────────── */
  const pulseCycle = (2 * Math.PI * frame) / (2 * fps);
  const pulse = Math.sin(pulseCycle) * 0.5 + 0.5; // 0 → 1
  const scale = 0.9 + 0.2 * pulse;                // 0.9 → 1.1

  /* ── Fade in first 15 frames, fade out last 15 of a 150-frame window ─ */
  const opacity = interpolate(frame, [0, 15, 135, 150], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  /* ── Fragment orbit ────────────────────────────────────────────────── */
  const angleOffset = (frame / fps) * 45; // 45°/sec rotation

  return (
    <div
      style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        opacity,
      }}
    >
      {/* Outer glow */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          width: 260,
          height: 260,
          transform: `translate(-50%, -50%) scale(${scale})`,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${hexToRgba(theme.orbGradientStart, 0.15)} 0%, transparent 70%)`,
          filter: "blur(30px)",
        }}
      />

      {/* Core orb */}
      <div
        style={{
          width: 120,
          height: 120,
          borderRadius: "50%",
          background: `radial-gradient(circle at 35% 35%, ${theme.orbGradientStart}, ${theme.orbGradientEnd})`,
          transform: `scale(${scale})`,
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
          boxShadow: [
            `0 0 60px ${hexToRgba(theme.orbGradientStart, 0.4)}`,
            `0 0 120px ${hexToRgba(theme.orbGradientEnd, 0.2)}`,
            "inset 0 -4px 12px rgba(0,0,0,0.2)",
          ].join(", "),
          position: "relative",
        }}
      >
        {/* Specular highlight */}
        <div
          style={{
            position: "absolute",
            top: 14,
            left: 18,
            width: 36,
            height: 24,
            borderRadius: "50%",
            background:
              "radial-gradient(ellipse, rgba(255,255,255,0.35), transparent)",
            filter: "blur(6px)",
          }}
        />
      </div>

      {/* Orbiting thinking fragments */}
      {thinkingFragments.map((frag, i) => {
        const angle =
          (i / thinkingFragments.length) * 360 + angleOffset;
        const rad = (angle * Math.PI) / 180;
        const radius = 160;
        const x = Math.cos(rad) * radius;
        const y = Math.sin(rad) * radius;
        const fragOpacity = 0.35 + 0.25 * Math.sin(pulseCycle + i * 1.2);

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
              fontFamily: '"DM Sans", system-ui, sans-serif',
              fontSize: 12,
              fontWeight: 400,
              letterSpacing: "0.04em",
              color: `rgba(255,255,255,${fragOpacity})`,
              whiteSpace: "nowrap",
              pointerEvents: "none",
            }}
          >
            {frag}
          </div>
        );
      })}
    </div>
  );
};

export default AgentOrb;

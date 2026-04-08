/**
 * BrandReveal.tsx — Stage 6: Go-to-Market (GTM) Finale
 *
 * The premium Black & Gold closing card for Soulora.
 *
 * Duration : 15s / 450 frames @ 30 fps
 *
 * Timeline
 * ──────────────────────────────────────────────────────────
 *   0s –  2s   frames   0–  59   Black screen; gold particles seed in
 *   2s –  5s   frames  60– 149   Logo wordmark writes itself in gold
 *   5s –  7s   frames 150– 209   Tagline fades up beneath the logo
 *   7s –  9s   frames 210– 269   Platform badges stagger in (iOS / Android / Soon)
 *   9s – 12s   frames 270– 359   CTA line slides up; waitlist URL appears
 *  12s – 15s   frames 360– 449   Hold — particles pulse; ambient glow breathes
 * ──────────────────────────────────────────────────────────
 */

import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import type { GtmPhaseConfig } from "../data/soulora-config";

/* ── Helpers ─────────────────────────────────────────────────────────────── */

const rgba = (hex: string, a: number) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${a})`;
};

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/** Ease-out cubic */
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

const reveal = (frame: number, start: number, dur = 24) =>
  easeOut(clamp01((frame - start) / dur));

/* ── Deterministic particle field ───────────────────────────────────────── */
// 40 gold/platinum particles; positions derived from seed so they're stable

interface Particle {
  x: number;   // % of width
  y: number;   // % of height
  size: number;
  speed: number;
  phase: number;
  col: "gold" | "platinum";
}

const PARTICLES: Particle[] = Array.from({ length: 40 }, (_, i) => {
  const h = ((i * 137.508) % 100);
  const v = ((i * 97.123 + 13) % 100);
  return {
    x: h,
    y: v,
    size: 1.5 + (i % 4) * 0.8,
    speed: 0.012 + (i % 5) * 0.004,
    phase: (i * 0.61803) % (2 * Math.PI),
    col: i % 3 === 0 ? "platinum" : "gold",
  };
});

/* ── Wordmark — individual letter reveal ────────────────────────────────── */

const LETTERS = "Soulora".split("");

interface WordmarkProps {
  gold: string;
  highlight: string;
  frame: number;
}

const Wordmark: React.FC<WordmarkProps> = ({ gold, highlight, frame }) => {
  // Each letter fades + rises on a 7-frame stagger starting at frame 60
  const letterOp = (i: number) => reveal(frame, 60 + i * 7, 22);
  const letterY  = (i: number) =>
    interpolate(frame, [60 + i * 7, 60 + i * 7 + 22], [28, 0], {
      extrapolateLeft: "clamp", extrapolateRight: "clamp",
    });

  // Shimmer sweep passes through once at frame 130
  const shimmerX = interpolate(frame, [118, 155], [-160, 1200], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  const shimmerOp = interpolate(frame, [118, 133, 150, 165], [0, 0.55, 0.55, 0], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      {/* Letter by letter */}
      <div style={{ display: "flex", alignItems: "baseline" }}>
        {LETTERS.map((ch, i) => (
          <span
            key={i}
            style={{
              fontFamily: '"Instrument Serif", Georgia, serif',
              fontSize: 148,
              fontWeight: 400,
              lineHeight: 1,
              letterSpacing: "-0.01em",
              // First letter slightly lighter (the capital S)
              color: i === 0 ? highlight : rgba(gold, 0.92),
              opacity: letterOp(i),
              transform: `translateY(${letterY(i)}px)`,
              display: "inline-block",
              filter: `drop-shadow(0 0 32px ${rgba(gold, 0.35 * letterOp(i))})`,
            }}
          >
            {ch}
          </span>
        ))}
      </div>

      {/* Shimmer sweep overlay */}
      <div
        style={{
          position: "absolute",
          top: 0, left: 0, right: 0, bottom: 0,
          pointerEvents: "none",
          overflow: "hidden",
          borderRadius: 4,
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "-20%",
            left: shimmerX,
            width: 140,
            height: "140%",
            background: `linear-gradient(105deg,
              transparent 0%,
              ${rgba("#FFFFFF", shimmerOp * 0.22)} 45%,
              ${rgba(highlight, shimmerOp * 0.55)} 50%,
              ${rgba("#FFFFFF", shimmerOp * 0.22)} 55%,
              transparent 100%)`,
            transform: "skewX(-12deg)",
          }}
        />
      </div>
    </div>
  );
};

/* ── Main composition ────────────────────────────────────────────────────── */

export interface BrandRevealProps {
  config: GtmPhaseConfig;
}

const BrandReveal: React.FC<BrandRevealProps> = ({ config }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const { theme } = config;
  const gold      = theme.primaryColor;
  const highlight = theme.highlightColor;

  /* ── Background ──────────────────────────────────────────────────── */
  // Near-pure black, very subtle warm hue so it reads as "premium" not "void"
  const bgL = interpolate(frame, [0, 450], [3, 6], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });

  /* ── Central radial glow — breathes after logo appears ──────────── */
  const glowOpBase = reveal(frame, 80, 50);
  const glowBreath = frame > 150
    ? glowOpBase * (0.55 + 0.45 * Math.abs(Math.sin(frame * 0.025)))
    : glowOpBase * reveal(frame, 80, 50);
  const glowSize = 680 + 60 * Math.abs(Math.sin(frame * 0.022));

  /* ── Tagline ─────────────────────────────────────────────────────── */
  const tagOp = reveal(frame, 150, 32);
  const tagY  = interpolate(frame, [150, 182], [16, 0], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });

  /* ── Divider line draws itself ───────────────────────────────────── */
  const dividerW = interpolate(frame, [148, 195], [0, 480], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });

  /* ── Platform badges ─────────────────────────────────────────────── */
  const badgeOp = (i: number) => reveal(frame, 210 + i * 20, 22);
  const badgeY  = (i: number) =>
    interpolate(frame, [210 + i * 20, 232 + i * 20], [24, 0], {
      extrapolateLeft: "clamp", extrapolateRight: "clamp",
    });

  /* ── CTA ─────────────────────────────────────────────────────────── */
  const ctaOp = reveal(frame, 278, 28);
  const ctaY  = interpolate(frame, [278, 306], [22, 0], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });

  /* ── Waitlist URL ────────────────────────────────────────────────── */
  const urlOp = reveal(frame, 316, 28);

  /* ── Final hold: "Soulora" radiates once more ────────────────────── */
  const finalRadiate = frame > 360
    ? 0.4 + 0.6 * Math.abs(Math.sin((frame - 360) * 0.04))
    : 1;

  /* ── Commentary ──────────────────────────────────────────────────── */
  const activeLine = config.commentary?.find(
    (l) => frame >= l.startFrame && frame < l.endFrame
  );
  const commentOp = activeLine
    ? Math.min(
        reveal(frame, activeLine.startFrame, 15),
        1 - clamp01((frame - (activeLine.endFrame - 15)) / 15),
      )
    : 0;
  const commentSlide = activeLine
    ? interpolate(frame, [activeLine.startFrame, activeLine.startFrame + 15], [8, 0], {
        extrapolateLeft: "clamp", extrapolateRight: "clamp",
      })
    : 0;

  return (
    <div
      style={{
        width, height,
        position: "relative",
        overflow: "hidden",
        background: `hsl(${theme.bgHueRange[0]}, 8%, ${bgL}%)`,
        fontFamily: '"DM Sans", system-ui, sans-serif',
      }}
    >

      {/* ── Central radial glow ──────────────────────────────────────── */}
      <div
        style={{
          position: "absolute",
          top: "50%", left: "50%",
          width: glowSize, height: glowSize,
          transform: "translate(-50%, -55%)",
          borderRadius: "50%",
          background: `radial-gradient(circle,
            ${rgba(gold, 0.09 * glowBreath)} 0%,
            ${rgba(gold, 0.04 * glowBreath)} 40%,
            transparent 70%)`,
          filter: "blur(60px)",
          pointerEvents: "none",
        }}
      />

      {/* ── Corner accent lines (circuit-board nod from Stage 5) ─────── */}
      {[
        { top: 32, left: 32, rotate: "0deg" },
        { top: 32, right: 32, rotate: "90deg" },
        { bottom: 32, left: 32, rotate: "270deg" },
        { bottom: 32, right: 32, rotate: "180deg" },
      ].map((pos, i) => {
        const cornerOp = reveal(frame, 20 + i * 10, 20);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              ...pos as React.CSSProperties,
              width: 52, height: 52,
              opacity: cornerOp * 0.38,
              pointerEvents: "none",
            }}
          >
            <svg width="52" height="52" viewBox="0 0 52 52">
              <polyline
                points="0,40 0,0 40,0"
                fill="none"
                stroke={gold}
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
        );
      })}

      {/* ── Gold particle field ───────────────────────────────────────── */}
      {PARTICLES.map((p, i) => {
        const particleOp = reveal(frame, i * 1.1, 18);
        const drift = Math.sin(frame * p.speed + p.phase) * 18;
        const driftX = Math.cos(frame * p.speed * 0.7 + p.phase) * 10;
        const twinkle = 0.25 + 0.75 * Math.abs(Math.sin(frame * p.speed * 1.4 + p.phase));
        const baseAlpha = p.col === "gold" ? 0.18 : 0.10;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: p.size,
              height: p.size,
              borderRadius: "50%",
              background: p.col === "gold" ? gold : highlight,
              opacity: particleOp * twinkle * baseAlpha * 4,
              transform: `translate(${driftX}px, ${drift}px)`,
              filter: `blur(${p.size > 2.5 ? 0.5 : 0}px)`,
              pointerEvents: "none",
            }}
          />
        );
      })}

      {/* ── Thin horizontal rule at very top and bottom (brand frame) ── */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0,
        height: 1,
        background: `linear-gradient(90deg, transparent 0%, ${rgba(gold, 0.35)} 50%, transparent 100%)`,
        opacity: reveal(frame, 10, 20),
      }} />
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0,
        height: 1,
        background: `linear-gradient(90deg, transparent 0%, ${rgba(gold, 0.35)} 50%, transparent 100%)`,
        opacity: reveal(frame, 10, 20),
      }} />

      {/* ══════════════════════════════════════════════════════════════
       *  HERO CENTRE — Logo, tagline, divider, badges, CTA
       * ══════════════════════════════════════════════════════════════ */}
      <div
        style={{
          position: "absolute",
          top: "50%", left: "50%",
          transform: "translate(-50%, -52%)",
          display: "flex",
          flexDirection: "column" as const,
          alignItems: "center",
        }}
      >
        {/* ── Wordmark ─────────────────────────────────────────────── */}
        <Wordmark gold={gold} highlight={highlight} frame={frame} />

        {/* ── Animated divider ─────────────────────────────────────── */}
        <div
          style={{
            marginTop: 8,
            width: dividerW,
            height: 1,
            background: `linear-gradient(90deg,
              transparent 0%,
              ${rgba(gold, 0.7)} 30%,
              ${rgba(highlight, 0.9)} 50%,
              ${rgba(gold, 0.7)} 70%,
              transparent 100%)`,
            boxShadow: `0 0 8px ${rgba(gold, 0.4)}`,
          }}
        />

        {/* ── Tagline ──────────────────────────────────────────────── */}
        <div
          style={{
            marginTop: 22,
            opacity: tagOp,
            transform: `translateY(${tagY}px)`,
            fontFamily: '"Instrument Serif", Georgia, serif',
            fontSize: 28,
            fontStyle: "italic",
            color: rgba(gold, 0.82),
            letterSpacing: "0.03em",
            textAlign: "center" as const,
            filter: `drop-shadow(0 0 12px ${rgba(gold, 0.28 * tagOp)})`,
          }}
        >
          {config.tagline}
        </div>

        {/* ── Platform badges ──────────────────────────────────────── */}
        <div
          style={{
            marginTop: 44,
            display: "flex",
            gap: 16,
          }}
        >
          {config.badges.map((badge, i) => {
            const isCTA = badge.label.toLowerCase().includes("coming");
            return (
              <div
                key={i}
                style={{
                  opacity: badgeOp(i),
                  transform: `translateY(${badgeY(i)}px)`,
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  background: isCTA
                    ? `linear-gradient(135deg, ${rgba(gold, 0.2)} 0%, ${rgba(gold, 0.1)} 100%)`
                    : "rgba(255,255,255,0.04)",
                  border: `1px solid ${rgba(gold, isCTA ? 0.55 : 0.22)}`,
                  borderRadius: 28,
                  padding: "12px 26px",
                  backdropFilter: "blur(12px)",
                  WebkitBackdropFilter: "blur(12px)",
                  boxShadow: isCTA
                    ? `0 0 24px ${rgba(gold, 0.18)}, inset 0 1px 0 ${rgba(highlight, 0.12)}`
                    : "none",
                }}
              >
                <span style={{ fontSize: 20 }}>{badge.icon}</span>
                <span
                  style={{
                    fontFamily: '"DM Sans", system-ui, sans-serif',
                    fontSize: 14,
                    fontWeight: isCTA ? 600 : 400,
                    color: isCTA ? rgba(gold, 0.95) : "rgba(255,255,255,0.68)",
                    letterSpacing: "0.02em",
                  }}
                >
                  {badge.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* ── CTA copy ─────────────────────────────────────────────── */}
        <div
          style={{
            marginTop: 40,
            opacity: ctaOp,
            transform: `translateY(${ctaY}px)`,
            fontFamily: '"DM Sans", system-ui, sans-serif',
            fontSize: 18,
            fontWeight: 300,
            color: "rgba(255,255,255,0.6)",
            letterSpacing: "0.02em",
            textAlign: "center" as const,
            maxWidth: 680,
            lineHeight: 1.55,
          }}
        >
          {config.cta}
        </div>

        {/* ── Waitlist URL ─────────────────────────────────────────── */}
        {config.waitlistUrl && (
          <div
            style={{
              marginTop: 22,
              opacity: urlOp,
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <div
              style={{
                width: 32, height: 1,
                background: rgba(gold, 0.45),
              }}
            />
            <div
              style={{
                fontFamily: '"DM Sans", system-ui, sans-serif',
                fontSize: 13,
                fontWeight: 500,
                letterSpacing: "0.1em",
                color: rgba(gold, 0.72),
                textTransform: "uppercase" as const,
              }}
            >
              {config.waitlistUrl}
            </div>
            <div
              style={{
                width: 32, height: 1,
                background: rgba(gold, 0.45),
              }}
            />
          </div>
        )}
      </div>

      {/* ── "COMING SOON" pill — top strip ───────────────────────────── */}
      <div
        style={{
          position: "absolute",
          top: 44, left: "50%",
          transform: "translateX(-50%)",
          opacity: reveal(frame, 55, 22) * 0.72,
          display: "flex",
          alignItems: "center",
          gap: 8,
          background: rgba(gold, 0.07),
          border: `1px solid ${rgba(gold, 0.22)}`,
          borderRadius: 20,
          padding: "6px 20px",
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            width: 6, height: 6,
            borderRadius: "50%",
            background: gold,
            opacity: 0.55 + 0.45 * Math.abs(Math.sin(frame * 0.1)),
            boxShadow: `0 0 6px ${rgba(gold, 0.6)}`,
          }}
        />
        <span
          style={{
            fontFamily: '"DM Sans", system-ui, sans-serif',
            fontSize: 11, fontWeight: 600,
            letterSpacing: "0.18em",
            textTransform: "uppercase" as const,
            color: rgba(gold, 0.78),
          }}
        >
          Coming Soon
        </span>
      </div>

      {/* ── Final radiate ring (frame 360+) ──────────────────────────── */}
      {frame > 360 && (
        <div
          style={{
            position: "absolute",
            top: "50%", left: "50%",
            transform: "translate(-50%, -50%)",
            width: 900 + 200 * (1 - finalRadiate),
            height: 900 + 200 * (1 - finalRadiate),
            borderRadius: "50%",
            border: `1px solid ${rgba(gold, 0.06 * finalRadiate)}`,
            boxShadow: `0 0 80px ${rgba(gold, 0.04 * finalRadiate)}`,
            pointerEvents: "none",
          }}
        />
      )}

      {/* ── Commentary overlay ────────────────────────────────────────── */}
      {activeLine && (
        <div
          style={{
            position: "absolute",
            bottom: 52, left: 0, right: 0,
            display: "flex", justifyContent: "center",
            pointerEvents: "none", zIndex: 10,
          }}
        >
          <div
            style={{
              opacity: commentOp,
              transform: `translateY(${commentSlide}px)`,
              background: "rgba(0,0,0,0.5)",
              backdropFilter: "blur(14px)",
              WebkitBackdropFilter: "blur(14px)",
              borderRadius: 12,
              padding: "14px 38px",
              maxWidth: 860,
              textAlign: "center" as const,
              border: `1px solid ${rgba(gold, 0.12)}`,
            }}
          >
            <div
              style={{
                fontFamily: '"DM Sans", system-ui, sans-serif',
                fontSize: 17, fontWeight: 400, lineHeight: 1.55,
                color: "rgba(255,255,255,0.85)", letterSpacing: "0.01em",
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

export default BrandReveal;

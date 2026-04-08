import React from "react";
import {
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  Sequence,
  Audio,
  staticFile,
} from "remotion";
import AgentOrb from "./AgentOrb";
import type { ProductFeaturesConfig, ResultCard, CommentaryLine } from "../data/soulora-config";

/* ── Hex → RGBA (local utility — no external imports) ───────────────── */

const hexToRgba = (hex: string, alpha: number): string => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
};

/* ══════════════════════════════════════════════════════════════════════
 *  ALAYAFLOW TIMING CONSTANTS (16s @ 30fps = 480 frames)
 *
 *  Input phase : 0s–4s   → frames 0–119
 *  Orb phase   : 4s–9s   → frames 120–269
 *  Cards phase : 9s–16s  → frames 270–479  (tagline fades in at 14s)
 * ══════════════════════════════════════════════════════════════════════ */

const FPS = 30;

const PHASE = {
  INPUT_START: 0,
  INPUT_END: 4 * FPS,           // 120
  ORB_START: 4 * FPS,           // 120
  ORB_DURATION: 5 * FPS,        // 150 frames
  CARDS_START: 9 * FPS,         // 270
  CARDS_END: 16 * FPS,          // 480 — runs to end of video
  TOTAL: 16 * FPS,              // 480
} as const;

/* ── Subcomponents ──────────────────────────────────────────────────── */

interface TypingInputProps {
  featureLabel: string;
  inputText: string;
  cursorColor: string;
}

const TypingInput: React.FC<TypingInputProps> = ({
  featureLabel,
  inputText,
  cursorColor,
}) => {
  const frame = useCurrentFrame(); // local within <Sequence>
  const { fps } = useVideoConfig();

  const typingDelay = 15; // frames before typing starts
  const charsPerSecond = 28;
  const framesPerChar = fps / charsPerSecond;

  const charsVisible = Math.min(
    inputText.length,
    Math.max(0, Math.floor((frame - typingDelay) / framesPerChar))
  );

  const visibleText = inputText.slice(0, charsVisible);
  const cursorBlink = Math.round(frame / 8) % 2 === 0 ? 1 : 0;

  const containerOpacity = interpolate(frame, [0, 15], [0, 1], {
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
        width: 820,
        opacity: containerOpacity,
      }}
    >
      <div
        style={{
          background: "rgba(255,255,255,0.06)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          border: "1px solid rgba(255,255,255,0.12)",
          borderRadius: 20,
          padding: "28px 36px",
          boxShadow:
            "0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.08)",
        }}
      >
        {/* Feature label */}
        <div
          style={{
            fontFamily: '"DM Sans", system-ui, sans-serif',
            fontSize: 13,
            fontWeight: 500,
            letterSpacing: "0.08em",
            textTransform: "uppercase" as const,
            color: hexToRgba(cursorColor, 0.7),
            marginBottom: 14,
          }}
        >
          {featureLabel}
        </div>

        {/* Typed text */}
        <div
          style={{
            fontFamily: '"Instrument Serif", Georgia, serif',
            fontSize: 26,
            lineHeight: 1.55,
            color: "rgba(255,255,255,0.92)",
            minHeight: 88,
            position: "relative",
          }}
        >
          {visibleText}
          <span
            style={{
              display: "inline-block",
              width: 2,
              height: 28,
              background: cursorColor,
              marginLeft: 2,
              verticalAlign: "text-bottom",
              opacity: cursorBlink,
              borderRadius: 1,
              boxShadow: `0 0 8px ${hexToRgba(cursorColor, 0.5)}`,
            }}
          />
        </div>
      </div>
    </div>
  );
};

/* ── Result Card ────────────────────────────────────────────────────── */

interface ResultCardProps {
  card: ResultCard;
  index: number;
}

const ResultCardBlock: React.FC<ResultCardProps> = ({ card, index }) => {
  const frame = useCurrentFrame(); // local within <Sequence>

  const staggerDelay = index * 20; // ~0.66s stagger between cards
  const localFrame = frame - staggerDelay;

  const progress = interpolate(localFrame, [0, 18], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const translateY = interpolate(progress, [0, 1], [60, 0]);
  const opacity = interpolate(progress, [0, 1], [0, 1]);
  const scale = interpolate(progress, [0, 1], [0.92, 1]);

  return (
    <div
      style={{
        background: "rgba(255,255,255,0.05)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 16,
        padding: "24px 28px",
        width: 300,
        transform: `translateY(${translateY}px) scale(${scale})`,
        opacity,
        boxShadow:
          "0 4px 24px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.06)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Accent top edge */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 2,
          background: `linear-gradient(90deg, ${card.accent}, transparent)`,
        }}
      />
      <div style={{ fontSize: 28, marginBottom: 10 }}>{card.emoji}</div>
      <div
        style={{
          fontFamily: '"Instrument Serif", Georgia, serif',
          fontSize: 18,
          fontWeight: 400,
          color: "rgba(255,255,255,0.95)",
          marginBottom: 8,
          lineHeight: 1.3,
        }}
      >
        {card.title}
      </div>
      <div
        style={{
          fontFamily: '"DM Sans", system-ui, sans-serif',
          fontSize: 13,
          lineHeight: 1.6,
          color: "rgba(255,255,255,0.55)",
          fontWeight: 400,
        }}
      >
        {card.body}
      </div>
    </div>
  );
};

/* ── Tagline Hold ───────────────────────────────────────────────────── */

const TaglineHold: React.FC<{ tagline: string }> = ({ tagline }) => {
  const frame = useCurrentFrame(); // local within cards Sequence (0 = 9s global)

  // Fade in at local frame 150 (= 14s global, 5s into cards phase)
  const opacity = interpolate(frame, [150, 170], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        position: "absolute",
        bottom: 120,
        left: "50%",
        transform: "translateX(-50%)",
        opacity,
        textAlign: "center" as const,
      }}
    >
      <div
        style={{
          fontFamily: '"Instrument Serif", Georgia, serif',
          fontSize: 22,
          color: "rgba(255,255,255,0.6)",
          fontStyle: "italic",
          letterSpacing: "0.02em",
        }}
      >
        {tagline}
      </div>
    </div>
  );
};

/* ── Commentary Overlay ─────────────────────────────────────────────── */

const FADE_FRAMES = 15; // crossfade duration at each boundary

interface CommentaryOverlayProps {
  lines: CommentaryLine[];
  frame: number;
}

const CommentaryOverlay: React.FC<CommentaryOverlayProps> = ({ lines, frame }) => {
  // Find the active line for the current frame
  const activeLine = lines.find(
    (line) => frame >= line.startFrame && frame < line.endFrame
  );

  if (!activeLine) return null;

  // Fade in over first FADE_FRAMES, fade out over last FADE_FRAMES
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

  // Subtle slide-up on entry
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
 *  ProductFeatures — Black-Box Composition
 *
 *  Takes a single `config` prop. Every piece of text, color, and
 *  thinking fragment comes from that object. The animation logic
 *  never changes — only the data does.
 * ══════════════════════════════════════════════════════════════════════ */

interface ProductFeaturesProps {
  config: ProductFeaturesConfig;
}

const ProductFeatures: React.FC<ProductFeaturesProps> = ({ config }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  const { theme } = config;
  const [hueStart, hueEnd] = theme.bgHueRange;

  const bgHue = interpolate(frame, [0, PHASE.TOTAL], [hueStart, hueEnd], {
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
      {/* ── Ambient particles (themed) ──────────────────────────────── */}
      {[...Array(6)].map((_, i) => {
        const x = 15 + i * 16;
        const y = 20 + ((i * 37) % 60);
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
                  ? hexToRgba(theme.orbGradientStart, 0.12)
                  : hexToRgba(theme.orbGradientEnd, 0.1),
              transform: `translateY(${drift}px)`,
              filter: "blur(1px)",
            }}
          />
        );
      })}

      {/* ── Audio layer ────────────────────────────────────────────────── */}
      {config.audio && (
        <>
          {/* Background ambient track — loops for full duration, low volume */}
          <Audio
            src={staticFile(config.audio.bgTrack)}
            volume={config.audio.bgVolume ?? 0.3}
            loop={config.audio.bgLoop ?? true}
            startFrom={0}
          />

          {/* Shimmer SFX — triggers when Agent Orb appears (frame 120 = 4s) */}
          <Sequence from={PHASE.ORB_START} durationInFrames={PHASE.ORB_DURATION}>
            <Audio
              src={staticFile(config.audio.orbSfx)}
              volume={config.audio.orbSfxVolume ?? 0.6}
            />
          </Sequence>

          {/* Voiceover — Option A: single combined track from frame 0 */}
          {config.audio.voiceoverTrack && (
            <Audio
              src={staticFile(config.audio.voiceoverTrack)}
              volume={config.audio.voiceoverVolume ?? 0.85}
              startFrom={0}
            />
          )}

          {/* Voiceover — Option B: per-phase files triggered at phase boundaries */}
          {!config.audio.voiceoverTrack && config.audio.voiceoverPhases && (
            <>
              <Sequence from={PHASE.INPUT_START} durationInFrames={PHASE.INPUT_END}>
                <Audio
                  src={staticFile(config.audio.voiceoverPhases.input)}
                  volume={config.audio.voiceoverVolume ?? 0.85}
                />
              </Sequence>
              <Sequence from={PHASE.ORB_START} durationInFrames={PHASE.ORB_DURATION}>
                <Audio
                  src={staticFile(config.audio.voiceoverPhases.orb)}
                  volume={config.audio.voiceoverVolume ?? 0.85}
                />
              </Sequence>
              <Sequence from={PHASE.CARDS_START} durationInFrames={PHASE.TOTAL - PHASE.CARDS_START}>
                <Audio
                  src={staticFile(config.audio.voiceoverPhases.cards)}
                  volume={config.audio.voiceoverVolume ?? 0.85}
                />
              </Sequence>
            </>
          )}
        </>
      )}

      {/* ── Phase 1: INPUT (0s–4s / frames 0–119) ──────────────────── */}
      <Sequence from={PHASE.INPUT_START} durationInFrames={PHASE.INPUT_END}>
        <TypingInput
          featureLabel={config.featureLabel}
          inputText={config.inputText}
          cursorColor={theme.cursorColor}
        />
      </Sequence>

      {/* ── Phase 2: AGENT ORB (4s–9s / frames 120–269) ────────────── */}
      <Sequence from={PHASE.ORB_START} durationInFrames={PHASE.ORB_DURATION}>
        <AgentOrb
          thinkingFragments={config.thinkingFragments}
          theme={theme}
        />
      </Sequence>

      {/* ── Phase 3: RESULT CARDS + TAGLINE (9s–15s / frames 270–449) ── */}
      <Sequence
        from={PHASE.CARDS_START}
        durationInFrames={PHASE.CARDS_END - PHASE.CARDS_START}
      >
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            display: "flex",
            gap: 24,
            alignItems: "flex-start",
          }}
        >
          {config.resultCards.map((card, i) => (
            <ResultCardBlock key={i} card={card} index={i} />
          ))}
        </div>
        {/* Tagline fades in at 13s (frame 120 local = 4s into cards phase) */}
        <TaglineHold tagline={config.tagline} />
      </Sequence>

      {/* ── Commentary overlay — narrative script at bottom ────────────── */}
      {config.commentary && config.commentary.length > 0 && (
        <CommentaryOverlay lines={config.commentary} frame={frame} />
      )}
    </div>
  );
};

export default ProductFeatures;

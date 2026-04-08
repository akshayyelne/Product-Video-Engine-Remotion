/**
 * MasterDemo.tsx — Soulora Full Product Video (All 6 Stages)
 *
 * Uses Remotion's <Series> to sequence every stage back-to-back.
 * A single <Audio> tag covers the entire 85s ElevenLabs master narration.
 *
 * Duration breakdown (30 fps):
 * ──────────────────────────────────────────────────────────────────
 *  Stage 1 · Discovery      DiscoveryPhase      360 frames  (12s)
 *  Stage 2 · Definition     DefinitionPhase     360 frames  (12s)
 *  Stage 3 · Vision         VisionTrend         450 frames  (15s)
 *  Stage 4 · Capabilities   ProductFeatures     480 frames  (16s)
 *  Stage 5 · Architecture   ArchitectureNode    450 frames  (15s)
 *  Stage 6 · GTM            BrandReveal         450 frames  (15s)
 * ──────────────────────────────────────────────────────────────────
 *  Total                                       2550 frames  (85s)
 * ──────────────────────────────────────────────────────────────────
 *
 * Audio:
 *   Place your ElevenLabs master narration MP3 at:
 *     public/soulora-master-narration.mp3
 *
 *   To render without audio (silent preview), set MASTER_AUDIO_ENABLED
 *   to false below or remove the <Audio> element.
 *
 * CLI render:
 *   npx remotion render src/Root.tsx SouloraDemo out/SouloraDemo.mp4
 *
 * CLI still (spot-check frame 1800 = start of Stage 5):
 *   npx remotion still src/Root.tsx SouloraDemo --frame=1800 out/still-arch.png
 */

import React from "react";
import { Series, Audio, staticFile } from "remotion";

import DiscoveryPhase    from "./DiscoveryPhase";
import DefinitionPhase   from "./DefinitionPhase";
import VisionTrend       from "./VisionTrend";
import ProductFeatures   from "./ProductFeatures";
import ArchitectureNode  from "./ArchitectureNode";
import BrandReveal       from "./BrandReveal";

import {
  discoveryConfig,
  definitionConfig,
  visionConfig,
  souloraConfig,
  architectureConfig,
  gtmConfig,
} from "../data/soulora-config";

/* ── Duration constants ─────────────────────────────────────────────────── */

export const STAGE_DURATIONS = {
  discovery:     360,  // 12s
  definition:    360,  // 12s
  vision:        450,  // 15s
  capabilities:  480,  // 16s
  architecture:  450,  // 15s
  gtm:           450,  // 15s
} as const;

export const TOTAL_FRAMES = Object.values(STAGE_DURATIONS).reduce(
  (sum, d) => sum + d,
  0
); // 2550 frames = 85s

/* ── Audio configuration ────────────────────────────────────────────────── */

/**
 * Set to false for a silent render (useful while the narration MP3
 * is not yet available in the /public folder).
 */
const MASTER_AUDIO_ENABLED = false; // flip to true once public/soulora-master-narration.mp3 is added

/**
 * ElevenLabs master narration file — must be placed at:
 *   public/soulora-master-narration.mp3
 *
 * The file should be exactly 85 seconds long, or Remotion will
 * trim / loop it according to the Audio element's behaviour.
 * Set loop={false} (default) so it plays once.
 */
const MASTER_NARRATION_FILE = "soulora-master-narration.mp3";

/* ── Component ──────────────────────────────────────────────────────────── */

const MasterDemo: React.FC = () => {
  return (
    <>
      {/* ── Master ElevenLabs narration track ─────────────────────────
       *  Starts at frame 0 and runs for the full composition duration.
       *  Volume can be lowered here if a background music track is
       *  added separately.
       * ──────────────────────────────────────────────────────────── */}
      {MASTER_AUDIO_ENABLED && (
        <Audio
          src={staticFile(MASTER_NARRATION_FILE)}
          volume={1}
          startFrom={0}
        />
      )}

      {/* ── Stage sequence ─────────────────────────────────────────── */}
      <Series>

        {/* ── Stage 1: Discovery (0s – 12s / frames 0–359) ─────────── */}
        <Series.Sequence
          durationInFrames={STAGE_DURATIONS.discovery}
          name="Stage 1 · Discovery"
        >
          <DiscoveryPhase config={discoveryConfig} />
        </Series.Sequence>

        {/* ── Stage 2: Definition (12s – 24s / frames 360–719) ─────── */}
        <Series.Sequence
          durationInFrames={STAGE_DURATIONS.definition}
          name="Stage 2 · Definition"
        >
          <DefinitionPhase config={definitionConfig} />
        </Series.Sequence>

        {/* ── Stage 3: Vision (24s – 39s / frames 720–1169) ────────── */}
        <Series.Sequence
          durationInFrames={STAGE_DURATIONS.vision}
          name="Stage 3 · Vision"
        >
          <VisionTrend config={visionConfig} />
        </Series.Sequence>

        {/* ── Stage 4: Capabilities (39s – 55s / frames 1170–1649) ─── */}
        <Series.Sequence
          durationInFrames={STAGE_DURATIONS.capabilities}
          name="Stage 4 · Capabilities"
        >
          <ProductFeatures config={souloraConfig} />
        </Series.Sequence>

        {/* ── Stage 5: Architecture (55s – 70s / frames 1650–2099) ─── */}
        <Series.Sequence
          durationInFrames={STAGE_DURATIONS.architecture}
          name="Stage 5 · Architecture"
        >
          <ArchitectureNode config={architectureConfig} />
        </Series.Sequence>

        {/* ── Stage 6: GTM (70s – 85s / frames 2100–2549) ─────────── */}
        <Series.Sequence
          durationInFrames={STAGE_DURATIONS.gtm}
          name="Stage 6 · GTM"
        >
          <BrandReveal config={gtmConfig} />
        </Series.Sequence>

      </Series>
    </>
  );
};

export default MasterDemo;

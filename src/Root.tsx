import React from "react";
import { Composition, registerRoot } from "remotion";
import ProductFeatures from "./components/ProductFeatures";
import DiscoveryPhase from "./components/DiscoveryPhase";
import DefinitionPhase from "./components/DefinitionPhase";
import VisionTrend from "./components/VisionTrend";
import ArchitectureNode from "./components/ArchitectureNode";
import BrandReveal from "./components/BrandReveal";
import MasterDemo, { TOTAL_FRAMES } from "./components/MasterDemo";
import { souloraConfig, discoveryConfig, definitionConfig, visionConfig, architectureConfig, gtmConfig } from "./data/soulora-config";

import "./style.css";

/**
 * Root.tsx — Remotion Entry Point
 *
 * DEPLOYMENT NOTES:
 *
 *   1. CLI render (the Composition id must match exactly):
 *        npx remotion render src/Root.tsx ProductFeatures out/ProductFeatures.mp4
 *
 *   2. CLI still (single frame test):
 *        npx remotion still src/Root.tsx ProductFeatures --frame=300 out/frame300.png
 *
 *   3. File tree this depends on:
 *        src/
 *        ├── Root.tsx                      ← this file (entry point with registerRoot)
 *        ├── style.css                     ← Tailwind base
 *        ├── components/
 *        │   ├── ProductFeatures.tsx        ← black-box composition
 *        │   └── AgentOrb.tsx              ← thinking orb subcomponent
 *        └── data/
 *            └── soulora-config.ts         ← Wellness Alchemist content
 *
 *   4. Audio setup — place MP3 files in the public/ folder:
 *        public/
 *        ├── ambient-calm.mp3              ← royalty-free ambient loop (CC0)
 *        └── shimmer-sfx.mp3              ← short shimmer/whoosh SFX (~1-2s)
 *
 *      Download from Pixabay (CC0, no attribution required):
 *        - Ambient: https://pixabay.com/music/search/calm%20ambient/
 *        - Shimmer: https://pixabay.com/sound-effects/search/shimmer/
 *
 *      To render WITHOUT audio (silent), remove the `audio` key from
 *      souloraConfig in soulora-config.ts.
 *
 *   5. Fonts: For production SSR / Lambda renders, add:
 *        import { loadFont } from "@remotion/google-fonts/DMSans";
 *        import { loadFont as loadSerif } from "@remotion/google-fonts/InstrumentSerif";
 *        loadFont();  loadSerif();
 *
 *   6. To add a second product video, create a new config file and
 *      add another <Composition> below with a unique id.
 */

const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="ProductFeatures"
        component={ProductFeatures as unknown as React.ComponentType<Record<string, unknown>>}
        durationInFrames={480}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          config: souloraConfig,
        }}
      />
      <Composition
        id="SouloraDiscovery"
        component={DiscoveryPhase as unknown as React.ComponentType<Record<string, unknown>>}
        durationInFrames={360}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          config: discoveryConfig,
        }}
      />
      <Composition
        id="SouloraDefinition"
        component={DefinitionPhase as unknown as React.ComponentType<Record<string, unknown>>}
        durationInFrames={360}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          config: definitionConfig,
        }}
      />
      <Composition
        id="SouloraVision"
        component={VisionTrend as unknown as React.ComponentType<Record<string, unknown>>}
        durationInFrames={450}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          config: visionConfig,
        }}
      />
      <Composition
        id="SouloraArchitecture"
        component={ArchitectureNode as unknown as React.ComponentType<Record<string, unknown>>}
        durationInFrames={450}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          config: architectureConfig,
        }}
      />
      <Composition
        id="SouloraGTM"
        component={BrandReveal as unknown as React.ComponentType<Record<string, unknown>>}
        durationInFrames={450}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          config: gtmConfig,
        }}
      />
      {/* ── Full 85s master demo — all 6 stages sequenced ── */}
      <Composition
        id="SouloraDemo"
        component={MasterDemo}
        durationInFrames={TOTAL_FRAMES}
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};

registerRoot(RemotionRoot);

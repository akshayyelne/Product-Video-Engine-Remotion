/**
 * soulora-config.ts — Wellness Alchemist data for ProductFeatures
 *
 * This is the single source of truth for all text, colors, and timing
 * that ProductFeatures renders. To create a new product video, duplicate
 * this file (e.g. staffing-config.ts) and pass it to <ProductFeatures config={...} />.
 */

/* ── Type contract ──────────────────────────────────────────────────── */

export interface ResultCard {
  emoji: string;
  title: string;
  body: string;
  accent: string; // hex color for card top-edge gradient
}

export interface CommentaryLine {
  /** Global frame this line appears (inclusive) */
  startFrame: number;
  /** Global frame this line disappears (exclusive) */
  endFrame: number;
  /** The narrative text displayed on screen */
  text: string;
}

export interface ProductFeaturesConfig {
  /** Label shown above the typing input bar */
  featureLabel: string;

  /** The user query that types out during the Input phase */
  inputText: string;

  /** Terms that orbit the Agent Orb during the Thinking phase */
  thinkingFragments: string[];

  /** Three resolution cards shown after the Orb dissolves */
  resultCards: [ResultCard, ResultCard, ResultCard];

  /** End-hold tagline */
  tagline: string;

  /** Visual theme — drives orb, cursor, particles, and background */
  theme: {
    orbGradientStart: string; // hex — orb inner / primary color
    orbGradientEnd: string;   // hex — orb outer / secondary color
    cursorColor: string;      // hex — typing cursor + label tint
    bgHueRange: [number, number]; // HSL hue shift [start, end] over duration
  };

  /**
   * Audio — optional background music and SFX
   *
   * Files live in the /public folder and are referenced via staticFile().
   * Set to null or omit to render silent video.
   */
  audio?: {
    /** Background ambient track (filename in /public, e.g. "ambient-calm.mp3") */
    bgTrack: string;
    /** Background track volume (0–1, default 0.3) */
    bgVolume?: number;
    /** Whether to loop the background track (default true) */
    bgLoop?: boolean;
    /** Shimmer SFX that plays when the Agent Orb appears (filename in /public) */
    orbSfx: string;
    /** Orb SFX volume (0–1, default 0.6) */
    orbSfxVolume?: number;
    /**
     * Voiceover — TTS commentary track synced to AlayaFlow phases
     *
     * Two options:
     *   A) Single file: set `voiceoverTrack` to one 15s MP3 that covers all phases.
     *   B) Per-phase:   set `voiceoverPhases` with individual files per phase,
     *      each triggered at the correct Sequence boundary.
     *
     * If both are set, `voiceoverTrack` takes priority.
     */
    voiceoverTrack?: string;
    voiceoverVolume?: number; // default 0.85
    voiceoverPhases?: {
      input: string;   // plays at frame 0    (0s)
      orb: string;     // plays at frame 120  (4s)
      cards: string;   // plays at frame 270  (9s)
    };
  };

  /**
   * Commentary — optional narrative overlay displayed at bottom of screen
   *
   * Each line maps to an AlayaFlow phase. Lines crossfade with a 15-frame
   * fade-in and fade-out at each boundary. Omit to render without commentary.
   *
   * Timing reference (30fps):
   *   Input:  frames 0–119    (0s–4s)
   *   Orb:    frames 120–269  (4s–9s)
   *   Cards:  frames 270–479  (9s–16s)
   */
  commentary?: CommentaryLine[];
}

/* ── Discovery Phase Types ──────────────────────────────────────────── */

export interface GaugeMetric {
  label: string;
  value: string;
}

export interface DiscoveryPhaseConfig {
  /** Central wellness gauge shown in Phase 3 */
  gauge: {
    label: string;
    /** 0–100 score the dial animates up to */
    targetScore: number;
    /** Sub-metric pills shown below the gauge */
    metrics: GaugeMetric[];
  };
  /** End-hold tagline */
  tagline: string;
  /** Visual theme — drives background, gauge arc, and particles */
  theme: {
    primaryColor: string;    // hex — green anchor (#88B04B)
    secondaryColor: string;  // hex — blue anchor (#4A90E2)
    bgHueRange: [number, number]; // HSL hue shift [start, end] over 12s
  };
  /**
   * Commentary overlay — narrative script at bottom
   *
   * Timing reference (30fps, 12s total):
   *   Noise:    frames 0–119    (0s–4s)
   *   Collapse: frames 120–239  (4s–8s)
   *   Vision:   frames 240–359  (8s–12s)
   */
  commentary?: CommentaryLine[];
}

/* ── GTM Phase Types ─────────────────────────────────────────────────── */

export interface GtmBadge {
  icon: string;
  label: string;
}

export interface GtmPhaseConfig {
  /** Brand name — rendered as the hero logotype */
  brandName: string;
  /** Tagline shown beneath the logo */
  tagline: string;
  /** CTA line */
  cta: string;
  /** Platform availability badges */
  badges: GtmBadge[];
  /** Waitlist URL displayed as a subtle label (no hyperlink in video) */
  waitlistUrl?: string;
  /** Visual theme — Black & Gold finale */
  theme: {
    /** Gold accent  #C9A84C */
    primaryColor: string;
    /** Soft platinum highlight */
    highlightColor: string;
    /** Deep black bg hue range (stays near 0 for pure black) */
    bgHueRange: [number, number];
  };
  /**
   * Commentary overlay
   *
   * Timing reference (30fps, 15s = 450 frames):
   *   Reveal:   frames   0–179
   *   CTA hold: frames 180–449
   */
  commentary?: CommentaryLine[];
}

/* ── Soulora: Stage 6 GTM ────────────────────────────────────────────── */

export const gtmConfig: GtmPhaseConfig = {
  brandName: "Soulora",
  tagline:   "Your Wellness, Synthesized.",
  cta:       "Join the waitlist today and start your journey to peak vitality.",
  badges: [
    { icon: "🍎", label: "Available on iOS" },
    { icon: "🤖", label: "Available on Android" },
    { icon: "🔜", label: "Coming Soon" },
  ],
  waitlistUrl: "soulora.app/waitlist",
  theme: {
    primaryColor:   "#C9A84C",
    highlightColor: "#F0E6C8",
    bgHueRange:     [40, 38],
  },
  commentary: [
    {
      startFrame: 0,
      endFrame: 210,
      text: "Soulora: Your Wellness, Synthesized.",
    },
    {
      startFrame: 225,
      endFrame: 450,
      text: "Join the waitlist today and start your journey to peak vitality.",
    },
  ],
};

/* ── Architecture Phase Types ───────────────────────────────────────── */

export interface ArchNode {
  /** Unique id used to wire edges */
  id: string;
  /** Display label (can be multi-line with \n) */
  label: string;
  /** Small sub-label shown below the main label */
  sublabel?: string;
  /** Emoji / icon character */
  icon: string;
  /** Hex accent colour for this node's glow + border */
  color: string;
  /** Column position: 0 = sources, 1 = orchestration, 2 = outputs */
  col: 0 | 1 | 2;
  /** Row position within the column (0-based) */
  row: number;
}

export interface ArchEdge {
  from: string;  // ArchNode id
  to: string;    // ArchNode id
  /** Pulse delay offset in frames (staggers the travelling dot) */
  delay?: number;
}

export interface ArchitecturePhaseConfig {
  nodes: ArchNode[];
  edges: ArchEdge[];
  /** Column header labels */
  columnLabels: [string, string, string];
  /** Compliance / security badge shown beneath the orchestration column */
  complianceBadge?: string;
  tagline: string;
  theme: {
    primaryColor: string;   // Teal/Cyan  #00BFA5
    secondaryColor: string; // Indigo     #5C6BC0
    accentColor: string;    // Violet     #9C27B0
    bgHueRange: [number, number];
  };
  /**
   * Commentary overlay
   *
   * Timing reference (30fps, 15s = 450 frames):
   *   Intro:   frames   0–  89
   *   Build:   frames  90– 299
   *   Hold:    frames 300– 449
   */
  commentary?: CommentaryLine[];
}

/* ── Soulora: Stage 5 Technical Architecture ─────────────────────────── */

export const architectureConfig: ArchitecturePhaseConfig = {
  columnLabels: ["Data Sources", "AI Orchestration Layer", "Personalized Output"],

  nodes: [
    // Column 0 — Fragmented Data Sources
    { id: "applehealth", label: "Apple Health",   sublabel: "Activity · Sleep · HRV", icon: "🍎", color: "#4CAF50", col: 0, row: 0 },
    { id: "emr",         label: "EMR / EHR",      sublabel: "Clinical Records",        icon: "🏥", color: "#29B6F6", col: 0, row: 1 },
    { id: "wearables",   label: "Wearables",       sublabel: "Oura · Whoop · Garmin",   icon: "⌚", color: "#FF8A65", col: 0, row: 2 },
    { id: "journal",     label: "Journal & Mood",  sublabel: "Self-reported Data",      icon: "📔", color: "#CE93D8", col: 0, row: 3 },

    // Column 1 — AI Orchestration Layer (single centre node)
    {
      id: "orchestrator",
      label: "Soulora AI\nOrchestrator",
      sublabel: "HIPAA · SOC 2 · FHIR R4",
      icon: "🧠",
      color: "#00BFA5",
      col: 1,
      row: 1,   // vertically centred between 4 source rows
    },

    // Column 2 — Personalized Outputs
    { id: "insight",    label: "Insight Engine",    sublabel: "Pattern Detection",     icon: "💡", color: "#FFD54F", col: 2, row: 0 },
    { id: "protocol",   label: "Protocol Builder",  sublabel: "Adaptive Plans",        icon: "📋", color: "#80CBC4", col: 2, row: 1 },
    { id: "forecast",   label: "Vitality Forecast", sublabel: "30-Day Trajectory",     icon: "📈", color: "#C9A84C", col: 2, row: 2 },
    { id: "alert",      label: "Risk Alerts",       sublabel: "Early Warning System",  icon: "🔔", color: "#EF5350", col: 2, row: 3 },
  ],

  edges: [
    // Sources → Orchestrator
    { from: "applehealth", to: "orchestrator", delay: 0  },
    { from: "emr",         to: "orchestrator", delay: 12 },
    { from: "wearables",   to: "orchestrator", delay: 24 },
    { from: "journal",     to: "orchestrator", delay: 36 },
    // Orchestrator → Outputs
    { from: "orchestrator", to: "insight",   delay: 8  },
    { from: "orchestrator", to: "protocol",  delay: 20 },
    { from: "orchestrator", to: "forecast",  delay: 32 },
    { from: "orchestrator", to: "alert",     delay: 44 },
  ],

  complianceBadge: "HIPAA Compliant · SOC 2 Type II · FHIR R4",
  tagline: "Soulora — Secure intelligence, synthesized.",

  theme: {
    primaryColor:   "#00BFA5",
    secondaryColor: "#5C6BC0",
    accentColor:    "#9575CD",
    bgHueRange:     [225, 215],
  },

  commentary: [
    {
      startFrame: 0,
      endFrame: 240,
      text: "Under the hood, Soulora orchestrates a secure, healthcare-compliant agentic framework",
    },
    {
      startFrame: 255,
      endFrame: 450,
      text: "to synthesize disparate data points into a singular truth.",
    },
  ],
};

/* ── Vision Phase Types ─────────────────────────────────────────────── */

export interface StrategyCard {
  icon: string;
  title: string;
  body: string;
}

export interface VisionPhaseConfig {
  /** Label for the trend line — e.g. "Vitality Index" */
  indexLabel: string;
  /** Ordered data points — score climbs from first to last */
  dataPoints: Array<{ label: string; score: number }>;
  /** 3 strategy insight cards shown in Phase 3 */
  strategyCards: [StrategyCard, StrategyCard, StrategyCard];
  /** End-hold tagline */
  tagline: string;
  /** Visual theme — Gold/Deep Blue palette */
  theme: {
    primaryColor: string;   // Gold  #C9A84C
    secondaryColor: string; // Blue  #4A7FCB
    bgHueRange: [number, number];
  };
  /**
   * Commentary overlay — narrative script at bottom
   *
   * Timing reference (30fps, 15s total):
   *   Intro:   frames   0– 89  (0s– 3s)
   *   Draw:    frames  90–299  (3s–10s)
   *   Reveal:  frames 300–449  (10s–15s)
   */
  commentary?: CommentaryLine[];
}

/* ── Soulora: Stage 3 Vision ─────────────────────────────────────────── */

export const visionConfig: VisionPhaseConfig = {
  indexLabel: "Vitality Index",
  dataPoints: [
    { label: "Start",  score: 60 },
    { label: "Week 1", score: 68 },
    { label: "Week 2", score: 75 },
    { label: "Week 3", score: 84 },
    { label: "Week 4", score: 92 },
  ],
  strategyCards: [
    {
      icon: "📈",
      title: "Adaptive Protocol",
      body: "AI recalibrates your daily plan as your Vitality Index rises — no static regimens.",
    },
    {
      icon: "🎯",
      title: "Peak Performance Window",
      body: "Pinpoints your highest-readiness hours for deep work, exercise, and recovery.",
    },
    {
      icon: "🔮",
      title: "30-Day Forecast",
      body: "Projects your Vitality Index trajectory based on current habit momentum.",
    },
  ],
  tagline: "Soulora — Engineering your peak.",
  theme: {
    primaryColor:   "#C9A84C",
    secondaryColor: "#4A7FCB",
    bgHueRange:     [228, 240],
  },
  commentary: [
    {
      startFrame: 0,
      endFrame: 210,
      text: "True wellness isn't a snapshot; it's a trajectory.",
    },
    {
      startFrame: 240,
      endFrame: 450,
      text: "Soulora maps your daily insights into a long-term strategy for peak human performance.",
    },
  ],
};

/* ── Definition Phase Types ─────────────────────────────────────────── */

export interface InsightData {
  causeIcon: string;
  causeLabel: string;
  causeTime?: string;
  effectIcon: string;
  effectLabel: string;
  /** e.g. "↓ 22%" */
  effectDelta: string;
  effectDirection: "up" | "down";
}

export interface DefinitionPhaseConfig {
  /** Correlation insight to surface */
  insight: InsightData;
  /** Gauge snapshot zoomed into from Stage 1 */
  gauge: {
    label: string;
    targetScore: number;
    metrics: GaugeMetric[];
    /** Label of the metric to spotlight in amber */
    highlightMetric: string;
  };
  /** Visual theme */
  theme: {
    primaryColor: string;
    secondaryColor: string;
    /** Amber/warning accent for the highlighted metric */
    accentColor: string;
    bgHueRange: [number, number];
  };
  commentary?: CommentaryLine[];
}

/* ── Soulora: Stage 2 Definition ────────────────────────────────────── */

export const definitionConfig: DefinitionPhaseConfig = {
  insight: {
    causeIcon: "☕",
    causeLabel: "Caffeine",
    causeTime: "at 4 PM",
    effectIcon: "🌙",
    effectLabel: "Deep Sleep",
    effectDelta: "↓ 22%",
    effectDirection: "down",
  },
  gauge: {
    label: "Wellness Score",
    targetScore: 78,
    metrics: [
      { label: "Sleep",  value: "82%" },
      { label: "Energy", value: "74%" },
      { label: "Mood",   value: "80%" },
    ],
    highlightMetric: "Sleep",
  },
  theme: {
    primaryColor:   "#88B04B",
    secondaryColor: "#4A90E2",
    accentColor:    "#F5A623",
    bgHueRange:     [210, 230],
  },
  commentary: [
    {
      startFrame: 0,
      endFrame: 165,
      text: "It's not just about tracking; it's about the hidden patterns.",
    },
    {
      startFrame: 195,
      endFrame: 360,
      text: "Soulora identifies the exact moment your habits impact your recovery.",
    },
  ],
};

/* ── Soulora: Stage 1 Discovery ─────────────────────────────────────── */

export const discoveryConfig: DiscoveryPhaseConfig = {
  gauge: {
    label: "Wellness Score",
    targetScore: 78,
    metrics: [
      { label: "Sleep",  value: "82%" },
      { label: "Energy", value: "74%" },
      { label: "Mood",   value: "80%" },
    ],
  },
  tagline: "Soulora — Your wellness, synthesized.",
  theme: {
    primaryColor:   "#88B04B",
    secondaryColor: "#4A90E2",
    bgHueRange:     [120, 210],
  },
  commentary: [
    {
      startFrame: 0,
      endFrame: 120,
      text: "Your wellness data is fragmented across devices and apps.",
    },
    {
      startFrame: 120,
      endFrame: 240,
      text: "Soulora recognizes the patterns and brings them together.",
    },
    {
      startFrame: 240,
      endFrame: 360,
      text: "One unified picture of your wellbeing.",
    },
  ],
};

/* ── Soulora: Wellness Alchemist ────────────────────────────────────── */

export const souloraConfig: ProductFeaturesConfig = {
  featureLabel: "Wellness Alchemist",

  inputText:
    "I've been sleeping poorly, feeling anxious, and my energy crashes every afternoon.",

  thinkingFragments: [
    "cortisol patterns",
    "circadian rhythm",
    "adaptogenic support",
    "HRV analysis",
    "neurotransmitter balance",
  ],

  resultCards: [
    {
      emoji: "🌙",
      title: "Evening Wind-Down Protocol",
      body: "Magnesium glycinate + L-theanine at 8pm. Guided body scan before sleep.",
      accent: "#88B04B",
    },
    {
      emoji: "⚡",
      title: "Afternoon Energy Reset",
      body: "Replace caffeine with a 10-min breathwork session + ashwagandha microdose.",
      accent: "#6BB5E0",
    },
    {
      emoji: "🧘",
      title: "Weekly Anxiety Baseline",
      body: "3x morning journaling prompts paired with HRV tracking to measure progress.",
      accent: "#4A90E2",
    },
  ],

  tagline: "Soulora — Your wellness, synthesized.",

  theme: {
    orbGradientStart: "#88B04B",
    orbGradientEnd: "#4A90E2",
    cursorColor: "#88B04B",
    bgHueRange: [220, 200],
  },

  /**
   * Audio files — place these in the /public folder:
   *
   *   public/
   *   ├── ambient-calm.mp3              ← royalty-free ambient loop (Pixabay, CC0)
   *   ├── shimmer-sfx.mp3              ← short shimmer/whoosh (~1-2s)
   *   ├── soulora-commentary-full.mp3  ← single 15s voiceover (Option A)
   *   ├── 01-input-phase.mp3           ← per-phase voiceover (Option B)
   *   ├── 02-orb-phase.mp3             ← per-phase voiceover (Option B)
   *   └── 03-resolution-phase.mp3      ← per-phase voiceover (Option B)
   */
  audio: {
    bgTrack: "ambient-calm.mp3",
    bgVolume: 0.3,
    bgLoop: true,
    orbSfx: "shimmer-sfx.mp3",
    orbSfxVolume: 0.6,

    // Option A: single combined voiceover track (takes priority if set)
    voiceoverTrack: "soulora-commentary-full.mp3",
    voiceoverVolume: 0.85,

    // Option B: per-phase voiceover files (used if voiceoverTrack is not set)
    // voiceoverPhases: {
    //   input: "01-input-phase.mp3",
    //   orb: "02-orb-phase.mp3",
    //   cards: "03-resolution-phase.mp3",
    // },
  },

  /**
   * Commentary lines — one per AlayaFlow phase
   *
   * These map directly to the narrative arc:
   *   Input (0–4s):   Establish the human problem
   *   Orb (4–9s):     Show the AI reasoning
   *   Cards (9–16s):  Reveal the synthesized answer
   */
  commentary: [
    {
      startFrame: 0,
      endFrame: 120,
      text: "You tell Soulora how you're feeling — unfiltered and raw.",
    },
    {
      startFrame: 120,
      endFrame: 270,
      text: "Our AI Alchemist synthesizes your unique biomarkers and patterns in real-time.",
    },
    {
      startFrame: 270,
      endFrame: 480,
      text: "The result? A personalized blueprint for your mental baseline. Your wellness, synthesized.",
    },
  ],
};

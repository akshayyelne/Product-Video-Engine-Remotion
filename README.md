# Product Video Engine — Remotion

A Remotion blueprint for AI product videos

This project uses React, Tailwind, and Remotion to generate a polished set of product video compositions, including discovery, definition, vision, architecture, brand reveal, and a master demo sequence.

## Features

- Multi-composition Remotion project
- Full HD (`1920x1080`) output at `30fps`
- Tailwind CSS styling via `@remotion/tailwind`
- Data-driven scenes loaded from `src/data/soulora-config.ts`
- Example render targets configured in `src/Root.tsx`

## Getting Started

### Prerequisites

- Node.js 18+ (recommended)
- npm

### Install dependencies

```bash
npm install
```

## Available Scripts

- `npm run start`
  - Starts the Remotion Studio for local preview.
- `npm run build`
  - Bundles the project with Remotion into the `public/` directory.
- `npm run render`
  - Renders the `ProductFeatures` composition to `out/ProductFeatures.mp4`.
- `npm run upgrade`
  - Upgrades Remotion dependencies.

## Rendering

### Preview in Studio

```bash
npm run start
```

Open the local Remotion Studio URL and select the composition you want to preview.

### Render a composition

```bash
npm run render
```

### Render a single still frame

```bash
npx remotion still src/Root.tsx ProductFeatures --frame=300 out/frame300.png
```

## Project Structure

- `src/Root.tsx` — Remotion entry point and composition registry
- `src/style.css` — Global styles and Tailwind base
- `src/components/` — Individual video components
- `src/data/soulora-config.ts` — Product video content and configuration
- `public/` — Static assets for rendering (audio, images, fonts)

## Notes

- If you add audio assets, place them in `public/` and reference them in the config file.
- For production or server-side rendering with font support, use `@remotion/google-fonts` in `Root.tsx` or the component entrypoint.
- To add another video composition, register it in `src/Root.tsx` with a unique `id`.

## License

This project does not include a license file. Add one if you plan to share or publish the project.

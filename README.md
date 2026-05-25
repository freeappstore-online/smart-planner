# Smart Planner

Smart Planner is a local-first planner for FreeAppStore. Tasks, habits, notes, shopping, and inspiration all stay in the browser with no backend, external images, analytics, or tracking.

## Run

```bash
pnpm install
pnpm dev
```

## Build

```bash
pnpm build
```

## Compliance

- All content is stored locally in `localStorage`.
- Inspiration visuals are generated SVG data URIs inside the app.
- No external image URLs are used.
- The app is configured as a PWA with local icons and manifest data.

## License

MIT.

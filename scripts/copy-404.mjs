import { copyFile } from 'node:fs/promises';

// GitHub Pages serves this file for unknown paths; copy the built entry so /admin
// can load the SPA while preserving Vite's configured base path for its assets.
await copyFile(new URL('../dist/index.html', import.meta.url), new URL('../dist/404.html', import.meta.url));

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base is set for GitHub Pages deployment under /PneumoVax/ (must match the
// GitHub repo name exactly — Pages paths are case-sensitive).
// All public asset paths MUST use import.meta.env.BASE_URL.
export default defineConfig({
  base: '/PneumoVax/',
  plugins: [react()],
  test: {
    // Logic tests run in node; UI rendering tests opt into happy-dom per file
    // with `// @vitest-environment happy-dom` at the top.
    environment: 'node',
    setupFiles: ['./src/test-setup.js'],
    globals: true,
    // P2-9 (2026-10-12): coverage tooling. `npm run test:coverage` reports
    // which lines of the two engine files never run during the suite — the
    // input to deciding where the next tests go. Not a gate: no threshold is
    // enforced, because a coverage percentage is not evidence a rule is
    // right, and a number everyone games is worse than no number. Read the
    // uncovered-line list, not the percentage.
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary'],
      reportsDirectory: './coverage',
      // The two files that decide what a clinician is told. Everything else
      // is UI or data; widen this deliberately, not by habit.
      include: ['src/logic/recommend.js', 'src/logic/validate.js'],
      all: true,
    },
  },
});

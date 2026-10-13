# Sangita Travels Pune — Frontend Client & Admin Portal

Single-Page Application (SPA) built with **React 19**, **TypeScript**, and **Vite 8**.

---

## Code Quality & Tooling

The frontend codebase is configured with a unified code quality pipeline:

- **EditorConfig (`.editorconfig`)**: Cross-editor indentation (2 spaces), UTF-8 charset, LF line endings, and trimmed trailing whitespace.
- **Prettier (`.prettierrc`, `.prettierignore`)**: Standardized formatting (single quotes, 2 spaces, semi-colons, 100 max width, trailing commas).
- **ESLint 9+ Flat Config (`eslint.config.js`)**: Modern TypeScript-ESLint, React Hooks, and Fast Refresh analysis.
- **Oxlint (`.oxlintrc.json`)**: Rust-powered ultra-fast static linter.

---

## Available Scripts

In the `frontend` directory:

| Script | Description |
| :--- | :--- |
| `npm run dev` | Start the Vite development server with Hot Module Replacement (HMR) |
| `npm run build` | Perform TypeScript type check (`tsc -b`) and build the production bundle in `dist/` |
| `npm run lint` | Run both Oxlint and ESLint checks across `src/` |
| `npm run lint:eslint` | Run standalone ESLint on all TypeScript and React files |
| `npm run lint:oxlint` | Run standalone Oxlint |
| `npm run format` | Auto-format all source code (`.ts`, `.tsx`, `.css`, `.json`) using Prettier |
| `npm run format:check` | Check code formatting compliance without modifying files |
| `npm run preview` | Locally preview the compiled production build |

---

## Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

| Variable | Description |
| :--- | :--- |
| `VITE_API_URL` | Base URL of the backend REST API (`http://localhost:8080`) |
| `VITE_APP_ENV` | Environment (`development` or `production`) |
| `VITE_PUBLIC_BRAND_NAME` | Business name shown in navigation and footer |
| `VITE_PUBLIC_SUPPORT_PHONE` | Customer service phone number |
| `VITE_PUBLIC_WHATSAPP_NUMBER` | WhatsApp booking helpline number |

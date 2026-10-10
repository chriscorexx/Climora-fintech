# Contributing to Climora

Thanks for your interest in improving Climora. This document covers how to contribute and the
conventions this repository follows.

## Ground rules

- Be respectful and constructive (see [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)).
- Discuss larger changes in an issue before opening a pull request.
- Security issues: please do not open a public issue — see the security note at the bottom.

## Getting set up

```bash
git clone https://github.com/chriscorexx/Climora-fintech.git
cd Climora-fintech
npm install
npm run dev:web      # API server + Vite dev server on http://localhost:5173
```

Useful commands while working:

| Command           | Purpose                            |
| ----------------- | ---------------------------------- |
| `npm run dev:web` | Run the web app                    |
| `npm run desktop` | Run the Electron shell             |
| `npm test`        | Vitest unit + UI suite (must pass) |
| `npm run lint`    | ESLint, zero warnings tolerated    |
| `npm run format`  | Apply Prettier formatting          |
| `npm run build`   | Typecheck + production build       |

## Branching and pull requests

1. Fork the repository and create a topic branch from `main`.
2. Keep pull requests focused — one logical change per PR.
3. Use [Conventional Commits](https://www.conventionalcommits.org/) for commit messages
   (`feat:`, `fix:`, `docs:`, `chore:`, `refactor:`, `test:`, `ci:`).
4. Before opening the PR, make sure all of these pass:

```bash
npm run lint
npm test
npm run build
```

5. Fill in the pull request template: what changed, why, how you verified it, and any follow-ups.
6. Add tests for new pure logic in `src/core/` (Vitest, following existing test style) and update
   documentation in `docs/` when behavior changes.

## Code conventions

- TypeScript everywhere; strict mode is on (`tsconfig.json`).
- Functional React components with typed props; no comments unless the "why" is non-obvious.
- Styling uses the `fin-*` design tokens in `tailwind.config.ts`; the dark theme is pure black and
  neutral greys with semantic accents only — please do not introduce blue-family colors.
- Keep the motion system accessible: new animations must be disabled by the existing
  `prefers-reduced-motion` rules in `src/index.css`.
- Respect module boundaries: domain logic lives in `src/core/`, UI in `src/components/`.
- Never commit secrets, API keys, or credentials. Environment variables are documented in
  `.env.example` only.

## Documentation

Documentation lives in [`docs/`](docs/). If your change affects deployment, access control, risk
scoring, or data sources, update the corresponding document in the same pull request.

## Recognition

Contributors are listed in the README contributors table. Add yourself in your first merged PR.

## Security

If you discover a security vulnerability — especially anything involving the demo-grade
authentication model or exposed credentials — report it privately to the maintainers instead of
opening a public issue, and rotate any exposed keys immediately.

# RccgHopeHouse.Web

A production-ready React + TypeScript frontend for the Rccg Hope House website. Built with Vite for fast development and optimized builds, 
this project provides the public site and an admin area for content management (devotionals, sermons, prayer requests, events, etc.).

---

## Table of Contents

- [Project overview](#project-overview)
- [Tech stack](#tech-stack)
- [Key features](#key-features)
- [Repository layout](#repository-layout)
- [Prerequisites](#prerequisites)
- [Local development](#local-development)
- [Environment variables](#environment-variables)
- [Linting & formatting](#linting--formatting)
- [Testing](#testing)
- [Building for production](#building-for-production)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License & attribution](#license--attribution)
- [Contact](#contact)

---

## Project overview

This repository contains the frontend for the Rccg Hope House website. It is implemented in React + TypeScript and 
uses Vite as the build tool. The codebase contains a public site (pages, sections, shared components) and an admin area with UI for creating and managing content.

The project follows a clear folder structure, an alias for imports (`@` -> `src`), and a small set of tools for linting and quality control.

## Tech stack

- React
- TypeScript
- Vite
- ESLint (project-level config in `eslint.config.js`)
- CSS Modules / global CSS (project contains organized `src/styles` files)

Optional/adjacent tooling referenced in the repo:
- Prettier (if configured for formatting)
- Testing frameworks (Jest / Vitest - add as needed)

## Key features

- Fast dev server with HMR via Vite
- Type-safe React with TypeScript
- Admin UI for CRUD operations (devotionals, sermons, prayers, services)
- API client abstraction under `src/api` to centralize network calls
- Clear separation between public site and admin pages
- Build-optimized output for static hosting

## Repository layout

Top-level layout (key folders and files):

- `src/` - application source
  - `src/admin/` - admin pages and components
  - `src/api/` - API utilities and client
  - `src/components/` - shared UI components and sections
  - `src/pages/` - route pages for the public site
  - `src/styles/` - global and component-specific CSS
  - `src/main.tsx`, `src/App.tsx` - application bootstrap
- `vite.config.ts` - Vite configuration (alias `@` -> `src`, dev proxy)
- `eslint.config.js` - ESLint configuration
- `README.md` - this file

Note: the repo uses the `@` import alias configured in `vite.config.ts` for shorter imports (for example `@/api/api`).

## Prerequisites

- Node.js 18.x or later (LTS recommended)
- npm 9.x or Yarn/Pnpm (project uses npm by default in examples)

If you use Visual Studio 2022 to inspect or edit the project, open the folder with __Open Folder__ or use your preferred editor. For frontend development, prefer a terminal and an editor with TypeScript support.

## Local development

1. Install dependencies

npm install

2. Start the dev server

npm run dev

Common scripts (may vary if package.json differs):

- `npm run dev` — start Vite dev server with HMR
- `npm run build` — create a production build in `dist/`
- `npm run preview` — preview the production build locally
- `npm run lint` — run ESLint
- `npm run lint:fix` — run ESLint with autofix where available

If your repo uses a different package manager, replace `npm` with `yarn` or `pnpm`.

### Working with the API

The project expects an API backend for admin operations. During development, the Vite server may proxy requests under `/api/*` to a backend host (see `vite.config.ts`). Configure the backend URL via environment variables described below.

## Environment variables

Vite exposes environment variables prefixed with `VITE_` to the browser. Example variables to add in an `.env.local` file at the project root:

# Example
VITE_API_BASE_URL=http://localhost:5000/api
VITE_APP_TITLE=Rccg Hope House

Notes:
- Do not commit secrets to the repository. Client-side secrets are not safe; any secret required by the client should be handled by the backend.
- For server-side or CI secrets, use your CI/CD provider's secrets store.

## Linting & formatting

ESLint is configured in `eslint.config.js`. Run the linter with:

npm run lint
npm run lint:fix

Consider adding a pre-commit hook (Husky) to run linting and tests automatically before commits.

## Testing

This repository does not include a test runner by default. To add tests:

- Unit tests: add Vitest or Jest with React Testing Library
- Integration/E2E: consider Playwright or Cypress for UI flows

Suggested quick start with Vitest:

npm install -D vitest @testing-library/react
# add scripts "test" and "test:watch" to package.json

## Building for production

Create an optimized build:

npm run build

Preview the build locally:

npm run preview

The production artifacts are placed in `dist/` by default and can be served by any static hosting or included in a backend pipeline.

## Deployment

Common hosting options:

- Vercel / Netlify — ideal for static SPAs, automatic previews, and easy DNS
- Azure Static Web Apps — integrates with Azure Functions if you need serverless API routing
- Azure App Service — for deploying with a server that serves static files
- Docker — containerize the build output and serve it from any container host

Deployment steps (general):
1. Build (`npm run build`)
2. Upload contents of `dist/` to your static host or bundle into your server image
3. Configure environment variables and API endpoints in the host

## Troubleshooting

- Dev server fails to start: ensure no other process uses the configured port and that Node version matches the requirement.
- API calls failing in dev: check `vite.config.ts` proxy settings and your `VITE_API_BASE_URL`.
- Type errors: run the TypeScript compiler or your editor's type checker to see precise messages.

## Contributing

This project follows a contributor-friendly workflow. Create issues for bugs and feature requests. For code contributions:

1. Fork the repository
2. Create a branch: `git checkout -b feat/short-description`
3. Run tests and linting locally
4. Open a pull request with a clear description and related issue number

A `CONTRIBUTING.md` will be added to the repo with repository-specific guidelines (lint rules, commit message conventions, and review expectations).

## License & attribution

State the project license here (for example MIT) and include any required attribution for assets, templates, or third-party libraries.

## Contact

For questions about the codebase, open an issue or contact the repository maintainers.

---

If you want, I can:
- Expand any README section with repository-specific examples (API details, exact environment variables, CI/CD workflow)
- Create a `CONTRIBUTING.md` and a `.editorconfig` that match the project's preferred coding standards

This revised README maintains the original content while integrating the new project-specific information, ensuring clarity and coherence throughout the document.

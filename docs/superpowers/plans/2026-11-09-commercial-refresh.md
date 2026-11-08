# SmartFit commercial refresh implementation plan

> Execute with superpowers:executing-plans. User explicitly opted out of design questions and requested direct implementation.

**Goal:** Commercial fashion presentation, Traditional Chinese/English UI, real photographic editorial content, refined digital fitting avatar, and dependable local sign-in.
**Architecture:** Preserve Vue/Express/SQLite and user data. Default development runs API and Vite under one origin. Editorial photography is versioned locally with source/license manifest. Add reactive locale dictionaries and persist locale preference. Use a detailed CC0 human mesh with garment visualization, retaining no-WebGL fallback.
**Tech Stack:** Existing Vue 3 / Three.js / Node 24 / Express, local static assets.
**Spec:** User's four requested upgrades and approved recommended direction in conversation; original transaction/privacy requirements remain in force.

## Global constraints
- No real payments, AI-generated fake photography, scraping personal accounts, or invented endorsements.
- Traditional Chinese default, English toggle; do not erase existing user posts/designs/orders.
- Keep foreign-origin mutations rejected; eliminate fragile proxy dependency in default launch.
- All model and photo assets have documented sources; preserve fallback and measurement disclaimer.
- Upload tested changes to authorized vivi-enzz/SmartFit repository; do not deploy a hosted site.

## Review focus
- Default launch works with a browser Origin header and cookie authentication.
- Foreign-origin, null origins and stale proxy headers do not bypass security.
- Existing databases receive editorial seeds without deleting personal content.
- Both languages cover navigation, forms, errors and checkout flows.
- Model loading failures and slow images retain usable UI.

### Task 1: Local startup and request validation
- [x] Write failing single-origin development and preview tests.
- [x] Implement shared-origin dev launcher and explicit preview proxy settings, actionable mismatch error/version diagnostics.
- [x] Run actual HTTP login/cookie and cross-site rejection tests.

### Task 2: Editorial photography and commercial UI
- [x] Verify photos/licenses and download local optimized assets.
- [x] Add migration-safe curated seed posts and provenance metadata; test existing database preservation.
- [x] Rebuild home, community, navigation and styling as commercial fashion platform.

### Task 3: Localized UI
- [x] Add tests for locale persistence, coverage and rendered bilingual pages.
- [x] Add dictionary-based zh-Hant/en and accessible language switch, translate static/dynamic labels and errors.

### Task 4: Avatar
- [x] Verify CC0 model source, preprocess anatomically detailed geometry, and validate mesh structure.
- [x] Replace primitive body with detailed mesh; add hair, eyes, fabric detail, studio lighting; preserve live garment options and fallback.

### Task 5: Verification and delivery
- [x] Run full tests, production build, production HTTP smoke, independent review.
- [x] Record browser-control limits if tools remain unavailable.
- [x] Update README with one-origin launcher and safe Mac update instructions; upload and verify GitHub tree.

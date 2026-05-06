# Normandy Optical Safilo Sales Competition

This repo contains a React + Vite dashboard for tracking Safilo frame sales by location and employee.

## What’s included

- Dashboard view with one lane per location
- Horses in each lane for each employee
- Admin login with prefilled username `admin` and password `Safilo2026`
- Admin controls to add locations, add employees, and enter weekly sales
- Local persistence via browser `localStorage`
- Dynamic finish line based on top sales values

## Setup

1. Install dependencies:

```bash
npm install
```

2. Start local development server:

```bash
npm run dev
```

3. Build for production:

```bash
npm run build
```

## Deploy

This is a static front-end app and can be deployed to GitHub Pages or any static hosting service.

### GitHub Pages deployment notes

- Create a GitHub repository for this project.
- If your site will be served from `https://<user>.github.io/sales_tracker/`, set the Vite base path in `vite.config.ts` to `/sales_tracker/` before building for production.
- Build the app with `npm run build`.
- Publish the contents of the `dist/` folder to GitHub Pages, either by using a deployment tool or by deploying `dist/` manually.
- Keep `.env` out of source control; the Firebase config is safe to embed in the build, but do not commit private secrets.

## Notes on persistence

This app now supports Firebase Firestore for shared remote persistence, with browser local storage as a fallback.

### How it works

- If Firebase config is provided via environment variables, the app loads and saves sales data from Firestore.
- If Firebase is not configured, the app falls back to browser `localStorage`.

### Why Firestore?

Firestore is a free option for small usage, works from a static frontend, and keeps data shared across browsers and locations.

### Setup

1. Create a free Firebase project at https://console.firebase.google.com/
2. Enable Firestore in the project.
3. Add the app's Firebase config values to a `.env` file (see `.env.example`).
4. Deploy or run the app locally with `npm run dev`.
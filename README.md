# Calorie Tracker (PWA)

An installable phone web app for tracking calories. Type what you ate in plain
language ("two big spoons of oats") and Claude estimates the calories and macros.
Each entry is saved and summed into a daily total. Your food log is stored locally
on your device; only the food description is sent to the AI endpoint.

## How it works

- **Frontend:** Vite + React + TypeScript, installable as a PWA (offline-capable
  except for the AI call).
- **Storage:** `localStorage` on your device — no accounts, no cloud database.
- **AI:** a small serverless function at `/api/estimate` holds your Anthropic API
  key and calls Claude (`claude-haiku-4-5`). The key never reaches the phone.

## Run locally

```bash
npm install
cp .env.example .env          # then paste your real ANTHROPIC_API_KEY into .env
npm run dev
```

Open the printed URL. The dev server proxies `/api/estimate` to Claude using the
key in `.env`, so estimation works locally without deploying.

## Build

```bash
npm run build     # type-checks then builds to dist/
npm run preview   # serve the production build (AI call needs a deployed backend)
```

## Deploy (Vercel)

1. Push this folder to a Git repo and import it at [vercel.com](https://vercel.com),
   or run `npx vercel`.
2. In the Vercel project: **Settings → Environment Variables**, add
   `ANTHROPIC_API_KEY` = your key. (Set it yourself; it is never committed.)
3. Deploy. Vercel serves the static app and runs `api/estimate.ts` as a function.

## Install on your phone

Open the deployed URL on your phone:

- **iPhone (Safari):** Share → *Add to Home Screen*.
- **Android (Chrome):** menu → *Install app* / *Add to Home screen*.

It then launches fullscreen like a native app.

## Notes

- Estimates are approximate. You can edit the calorie number before saving.
- Regenerate the app icons with `npm run icons` (edit `scripts/gen-icons.mjs`).

## Roadmap (not in this MVP)

- Multi-device sync / accounts, calorie goals, trends/charts, photo & barcode input.

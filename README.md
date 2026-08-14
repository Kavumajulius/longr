# LONGR Hub

The original `longr-hub.html` experience, rebuilt as a typed React application
with TypeScript and Next.js (App Router). The original HTML file is retained as
a visual and content reference.

## Requirements

- Node.js 22.13 or newer
- npm

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in a browser.

## Verify the project

```bash
npx tsc --noEmit
npm test
```

## Firebase / Firestore

The site reads its fully transformed articles from Cloud Firestore using the
Firebase Admin SDK (server-side, read-only). Firestore is the sole source of
article content — there is no fallback to local mock data. If Firestore is
unreachable or not configured, the server logs an error and the feed renders
empty rather than serving stale local content.

### One-time setup

1. Download a service account key from Firebase Console → Project settings →
   Service accounts → **Generate new private key**, and save it as
   `firebase-service-account.json` in the project root (already gitignored).
   The alternative is to set the `FIREBASE_SERVICE_ACCOUNT` environment variable
   to the JSON contents.
2. Push the article documents to Firestore:

   ```bash
   npm run db:seed
   ```

3. Lock down Firestore with the included rules (`firestore.rules`) so browser
   clients can only read or write their own user profile:

   ```bash
   npx firebase deploy --only firestore:rules
   ```

### Authentication setup (manual, in the Firebase Console)

Users authenticate with email + password. Account profiles are written to the
`users/{uid}` collection in Firestore when onboarding completes. To turn this on:

1. Open [Firebase Console](https://console.firebase.google.com) → your
   `longr-web` project → **Build → Authentication → Sign-in method**.
2. Enable **Email/Password** and save.
3. Deploy the updated Firestore rules (`firestore.rules`):

   ```bash
   npx firebase deploy --only firestore:rules
   ```

   The rules allow each signed-in user to read/write only their own document at
   `users/{uid}`; all other browser access stays denied.

No other setup is required — `lib/firebase.ts` already reads the web config from
`.env.local`, and the Admin SDK is only used server-side for article reads.

### How reads work

- `lib/firebase-admin.ts` initializes the Admin SDK from the service account.
- `lib/articles.ts` reads the `articles` collection (ordered by `id`) and maps
  each document back to an `HvcoExperience`. Documents carry a `featured`
  boolean for the featured-sessions row. If the collection is empty or
  unreachable, it returns an empty feed (no local fallback).
- `app/page.tsx` fetches articles server-side and passes them into the
  client `LongrHub` component. It uses ISR (`revalidate = 3600`), so Firestore
  changes appear within an hour.
- `app/api/articles/route.ts` exposes the same data as JSON for debugging.

### Adding or updating articles

Content changes live in `app/longr-data.ts` and `app/hvco-content.ts`. Re-run
`npm run db:seed` to publish the latest transformed articles to Firestore.

## What works

- Header navigation filters the longevity feed
- Search filters sessions by title, category, and description
- Category pills and the horizontal category control are interactive
- Featured sessions and feed cards open full article/session views
- Every article is transformed into the five-part LONGR HVCO format with an
  concise 4–5 minute read time, 6–10 word food-first headline, varied section
  headings, structured JSON metadata, three detailed actions, today’s win, and
  a tomorrow-preview cliffhanger
- Every category connects a named everyday food to its preparation, pairing,
  timing, longevity mechanism, condition context, and relevant safety guardrail
- Session checkboxes recalculate the selected life-gain total
- Saved sessions persist in the browser on the current device
- The nutrition prompt routes into the nutrition feed
- Desktop and mobile layouts retain the original responsive styling

## Main files

- `app/LongrHub.tsx` contains the typed interactive interface
- `app/longr-data.ts` contains the typed category and session content
- `app/hvco-content.ts` contains the typed article transformation engine
- `app/globals.css` preserves the original visual design
- `app/layout.tsx` contains site metadata and the LONGR social preview

# Spin — travel planner with interactive wheels

Spin is a cross-platform travel planner built with **Expo (React Native) + React Native Web**.
One codebase runs in the **browser**, on **iOS** and on **Android**.

Enter your departure country, dates, number of travellers and budget currency, then spin
the wheels — *Where to go?*, *How many days?*, *Maximum budget* and an optional
*Which holiday style?* — and get an approximate cost plan with a realism check, saving tips,
accommodation / activity / sightseeing ideas and a visual trip summary.

> **All prices are approximate demo estimates.** No live pricing or booking API is connected.
> Suggestion cards are marked **“Example”** and link to public search pages
> (Booking.com, Airbnb, GetYourGuide, Tripadvisor, Google Maps). Nothing claims availability.

## Design & motion

- **Visual language:** deep-ocean primary, sunset accent and warm sand background; generous spacing,
  a clear type scale, one set of radii/shadows and an original SVG icon set (`src/theme.js`,
  `src/components/Icon.js`). A landing screen with a night-sky hero, a self-drawing flight path and a
  slowly turning preview wheel leads into the three planning steps.
- **Purposeful animation** built only with React Native `Animated` (no extra animation library):
  sections fade and rise into view as you scroll, steps slide in the direction of travel, wheels spin
  with an eased stop and a pointer “tick”, the destination code pops and a plane flies the route when
  the destination changes, the budget bar, category bars and totals animate to new values, settings
  panels and suggestion groups expand smoothly, and suggestions load with skeleton cards.
- **Reduced motion:** when the OS/browser asks for less motion, reveals and step transitions are
  skipped, decorative loops stop and wheels land almost instantly. Everything works without animation.
- **Layouts for three sizes:** phone (< 600), tablet (600–1023) and desktop (≥ 1024) each get their own
  arrangement: a bottom sheet vs centred dialogs, one vs two wheel columns, a sticky summary column
  on desktop, and a sticky bottom action bar with your live selection on the wheels step.
- **States and accessibility:** hover, pressed, selected, disabled, loading, error and empty states;
  keyboard focus rings (shown for keyboard use only); the budget indicator uses an icon shape, text
  percentage, a labelled budget marker and a hatched over-budget segment, so it never relies on
  colour alone.

## Features

- **7 UI languages**: English (default), Ukrainian, Russian, Spanish, French, German, Italian.
  A language switcher is always visible in the header; the choice is saved (AsyncStorage /
  localStorage). On the very first launch the device/browser language is used if supported,
  otherwise English. Dates, numbers and currency are formatted for the selected language.
  Missing strings fall back to English.
- **Trip setup** with validation: departure country, exact dates *or* a flexible date range,
  travellers (typed or −/+), budget currency (EUR default, 8 currencies, editable demo rate).
  The budget is always the **total for the whole group** (the UI says so and shows per-person values).
- **Four wheels** (SVG, animated): tap/click, swipe, *Spin* button, *‹ ›* step buttons, and on the
  web the keyboard (Enter/Space to spin, arrow keys to step). Each wheel has its own settings
  (included/excluded countries, day range + step, budget range + step, style list) and a
  manual input/list for people who don’t want to spin. The departure country is never a destination.
  *Spin all wheels* spins everything at once. Respects “reduce motion”.
- **Duration ↔ dates**: exact dates lock the duration; a flexible range only offers durations
  that fit, and the plan lets you pick a start date inside the range.
- **Realism check**: status (sufficient / tight / may not be enough / too low), budget bar with the
  likely range, breakdown into transport, accommodation, food, local transport and activities with
  share of budget, the main cost drivers, and one-tap **saving tips** (shorter trip, cheaper stay,
  cheaper transport, off-peak dates, higher budget, cheaper destinations from your wheel).
- **Suggestions** for stays, activities and places with price units (per night for the group,
  per person + group total), loading / error + retry / empty states.
- **Trip summary** with total, remaining budget or overrun, per-person cost and share/copy.

## Run it

Requirements: Node.js 20.19+ (22 LTS recommended) and npm.

```bash
npm install
```

### Web

```bash
npm run web            # dev server, opens http://localhost:8081
npm run build:web      # static production build in ./dist (host on any static server)
npx serve -s dist      # preview the production build
```

### Android

- **Quickest:** install **Expo Go** on your phone, run `npm start` and scan the QR code
  (phone and computer on the same network; `npx expo start --tunnel` otherwise).
- **Emulator:** install Android Studio + an emulator, then `npm run android`.
- **Native dev build:** `npx expo run:android` (generates `android/` via prebuild).

### iOS

- **Quickest:** install **Expo Go** from the App Store, run `npm start` and scan the QR code
  with the Camera app.
- **Simulator (macOS + Xcode):** `npm run ios`.
- **Native dev build:** `npx expo run:ios` (requires macOS + Xcode).

All native modules used (`react-native-svg`, `@react-native-async-storage/async-storage`,
`@react-native-community/datetimepicker`, `expo-localization`, `react-native-safe-area-context`)
are included in Expo Go, so no custom build is needed for development.

### Tests and lint

```bash
npm test      # logic + locale completeness
npm run lint  # ESLint with eslint-config-expo (includes React Compiler hook rules)
```

Runs the Node test suite in `tests/`: dates, validation, the cost model, budget tips,
demo suggestions, derived trip state, plural rules, and a check that **every locale has every
English key with the same placeholders**.

## Building store binaries (not done yet)

This repository has **not** been built for or published to the App Store / Google Play.
To do so:

1. Replace the placeholder identifiers in `app.json`
   (`ios.bundleIdentifier`, `android.package` — currently `com.example.spintravel`)
   and the icons/splash in `assets/`.
2. Create an Expo account and configure EAS: `npx eas-cli@latest login` → `npx eas-cli@latest build:configure`.
3. Build: `npx eas-cli@latest build --platform android` / `--platform ios`
   (iOS needs an Apple Developer Program membership; Android needs a Google Play developer account).
4. Submit: `npx eas-cli@latest submit --platform ios|android`, then complete store listings,
   privacy details and review.

## Project structure

```
App.js                     App shell: header, language switcher, landing + step navigation
src/i18n/                  I18nProvider, translate() with English fallback, plural rules
src/i18n/locales/*.js      All UI strings, one file per language (edit/extend here)
src/data/                  Countries (names in 7 languages, demo price index), currencies, highlights
src/lib/                   Pure logic: dates, validation, formatting, budget analysis
src/services/              Integration layer: pricingService (demo model), suggestionsService,
                           links (search URLs), config (env-based, no secrets)
src/state/                 Reducer + persistence (store.js) and pure derived state (derived.js)
src/components/            Wheel, WheelCard, Hero, RouteHeader, BudgetBar, SelectModal, DateField,
                           Icon (SVG icon set), motion (reveal/transition/reduced-motion helpers), UI primitives
src/screens/               SetupScreen, WheelsScreen, PlanScreen
tests/                     node:test suites
```

### Adding a language

1. Copy `src/i18n/locales/en.js` to `xx.js` and translate the values (keep `{placeholders}`).
2. Register it in `src/i18n/languages.js` and add a locale tag in `src/lib/format.js`.
3. Add country/currency names in `src/data/countries.js` and the plural rule in `src/lib/plural.js` if needed.
4. `npm test` reports any missing keys or placeholder mismatches.

## What is demo data

| Area | Source |
| --- | --- |
| Cost estimate (transport, stay, food, local transport, activities) | Rule-based demo model in `src/services/pricingService.js`: per-country price index, great-circle distance, season and booking lead time. Not real prices. |
| Exchange rates | Fixed approximate rates in `src/data/currencies.js`, editable in the app. |
| Accommodation / activity / food cards | Generic types with rough demo price ranges, marked **Example**; links open real search pages without implying availability. |
| Place names | Well-known public landmarks (`src/data/highlights.js`), no prices or opening hours claimed. |

## Connecting real data

- **Suggestions:** set `EXPO_PUBLIC_SUGGESTIONS_API_URL` (see `.env.example`) to **your own backend**
  that implements `POST /suggestions` and returns cards in the shape built by `card()` in
  `src/services/suggestionsService.js`. Your backend holds the provider keys (Booking/Expedia
  affiliate APIs, Amadeus, GetYourGuide, Viator, Google Places, …). The UI then shows provider
  results with a “check price and availability” note instead of the Example badge.
- **Prices:** implement a remote version of `estimateTripCosts()` with the same return shape
  (flight search, hotel rates) and swap it in `src/services/pricingService.js`.
- **Exchange rates:** fetch daily rates in a service and feed them into the currency setup.
- Never ship private API keys in the app bundle — `EXPO_PUBLIC_*` values are visible to users.

# ← Backspace

**Hit Backspace Less.**  
*Typing practice for the characters developers actually type.*

Most typing tests measure how fast you can type lowercase English prose. Developers spend their day typing symbols, flags, pipes, brackets, SQL clauses, and CLI commands (`{ } [ ] ( ) => !== && || | ~ $ @ # \ / --`)—and nobody trains them.

**Backspace** is a free, offline-first typing trainer built specifically for developers. Practice real Git, Terminal, Docker, PostgreSQL, JavaScript/TypeScript, Python, AI Prompts, and high-density Symbol drills. Every keystroke is timestamped to identify your slowest and most error-prone keys on a full QWERTY heatmap and generate adaptive drills from them. Everything runs locally in the browser with zero accounts, zero tracking, and full offline support.

---

## Table of Contents

1. [Features](#1-features)
2. [Tech Stack](#2-tech-stack)
3. [Project Structure](#3-project-structure)
4. [Application Routes](#4-application-routes)
5. [Typing Engine & Scoring Mathematics](#5-typing-engine--scoring-mathematics)
6. [Design System: "Paper and Ink"](#6-design-system-paper-and-ink)
7. [Local Storage Schema & Privacy](#7-local-storage-schema--privacy)
8. [Keyboard Shortcuts](#8-keyboard-shortcuts)
9. [Getting Started & Commands](#9-getting-started--commands)
10. [Pre-Launch Customization Checklist](#10-pre-launch-customization-checklist)

---

## 1. Features

- **7 Developer Modes + Adaptive Weak-Keys Mode**:
  - **Git**: Commits, branches, interactive rebases, stashes, reflogs, and worktrees.
  - **Terminal**: Bash/POSIX commands, `grep`, `find`, `awk`, `sed`, `tar`, `lsof`, and pipes.
  - **Docker**: Container lifecycle, port mappings, volumes, Compose, and `buildx`.
  - **SQL**: PostgreSQL queries, joins, aggregations, window functions, JSONB operators, and concurrent indexes.
  - **Code**: Idiomatic one-liners in **JavaScript/TypeScript** and **Python**.
  - **AI Prompts**: Structured system prompts, code review instructions, and output constraints.
  - **Symbols**: Signature high-density symbol drills progressing from basic brackets to bash expansions and regex lookaheads.
  - **My Weak Keys (Adaptive)**: Unlocks after 5 completed tests (or immediately when clicking any slow-key chip) and weights every line in the bank by your personal per-key latency and error rate.
- **Zero-Latency Typing Arena**:
  - Decoupled plain TypeScript engine (`src/engine/*`) using `performance.now()` timestamps.
  - Memoised 4-line scrolling viewport (`<TypingLine />`) so keystrokes only update the active line without re-rendering the entire screen.
  - Instant caret movement (block, underline, or bar), focus mode (dims header and mode row to 25% opacity during active typing), optional Web Audio API synthesised mechanical key clicks, and an optional live on-screen QWERTY guide.
- **Per-Key Latency & Error Analytics**:
  - Full SVG QWERTY keyboard heatmap colored by millisecond latency (`<140ms` fast, `140–210ms` moderate, `>210ms` slow) with vermilion corner dots marking keys with logged errors.
  - Ranked Top 10 Slowest Keys and Top 10 Error-Prone Keys (requiring a minimum of 8 samples per key).
- **Shareable 1200×630 Result Cards**:
  - Rendered client-side with the HTML5 Canvas API on warm paper with the gold ornament band, displaying Net WPM, Backspace Score, Accuracy, Category, Duration, Consistency, Developer Rank, and date.
  - Supports **Download PNG**, **Copy image** (Clipboard API with download fallback), and **Copy text**.
- **Developer Progression & Streaks**:
  - XP system and 6 engineering titles (**Intern**, **Junior**, **Mid**, **Senior**, **Staff**, **Principal**).
  - Daily streak tracking, 26-week GitHub-style contribution heatmap, personal bests matrix (`Category × Duration`), and 11 unlockable milestone badges.
- **100% Offline-First & Private**:
  - Web App Manifest (`public/manifest.json`) and Service Worker (`public/sw.js`) cache the application shell for offline use.
  - Full JSON export, import, and typed-confirmation (`DELETE`) data reset in `/settings`.

---

## 2. Tech Stack

- **Framework**: React 19 + TypeScript (strict) + Vite
- **Routing**: React Router (`react-router-dom`)
- **Styling**: Tailwind CSS v4 (`@tailwindcss/vite`) + CSS Custom Properties
- **Animations**: Motion (`motion/react`) with full `prefers-reduced-motion` and manual Reduce Motion support
- **Icons**: `lucide-react` + custom inline SVGs
- **Audio**: Native Web Audio API noise-burst synthesizer (zero external audio files)
- **Testing**: Node built-in test runner (`node:test` + `node:assert/strict`) executed via `tsx`

---

## 3. Project Structure

```text
/
├── index.html                      # SEO meta tags, Google Fonts, inline SVG favicon, no-flash theme script
├── metadata.json                   # App metadata
├── package.json                    # Scripts and dependencies
├── public/
│   ├── icon.svg                    # Vector app icon (ink rounded square, cream B, vermilion arrow)
│   ├── manifest.json               # PWA Web App Manifest
│   ├── sw.js                       # Offline app-shell service worker
│   └── assets/aistudio/            # Supplied brand wordmark and icon assets
└── src/
    ├── main.tsx                    # App entry point & service worker registration
    ├── App.tsx                     # Router, route transitions, global hotkeys, skip-to-content link
    ├── index.css                   # "Paper and Ink" CSS variables, typography, keycap & cursor rules
    ├── context/
    │   └── AppContext.tsx          # Global React state synced with backspace:v1: localStorage
    ├── data/
    │   └── content.ts              # Curated developer command, code, prompt, and symbol banks
    ├── engine/                     # Pure TypeScript modules (NO React imports)
    │   ├── types.ts                # Core interfaces for keystrokes, results, stats, and settings
    │   ├── scoring.ts              # WPM, Backspace Score, consistency, streaks, XP, badges, adaptive weighting
    │   ├── typingEngine.ts         # Stateful TypingEngine class for line buffering and per-second sampling
    │   ├── storage.ts              # Versioned localStorage wrapper with in-memory fallback
    │   ├── sound.ts                # Web Audio API synthesised key click generator
    │   └── engine.test.ts          # Unit tests for scoring, engine state, and persistence
    ├── hooks/
    │   ├── useDocumentMeta.ts      # Per-route document.title & meta description hook + site constants
    │   └── usePWAInstall.ts        # PWA install prompt & navigator.onLine status hooks
    ├── components/
    │   ├── Logo.tsx                # Single reusable <Logo variant="full" | "icon" /> component
    │   ├── OrnamentBand.tsx        # Seamless inline-SVG gold lotus & ogee arch band + corner ornaments
    │   ├── Header.tsx              # Sticky 64px header with focus-mode fade, streak chip, and mobile drawer
    │   ├── Footer.tsx              # Gold ornament band, 4-column navigation, online/offline indicator
    │   ├── QwertyHeatmap.tsx       # SVG QWERTY keyboard for live next-key guide & latency heatmaps
    │   ├── ShareCardCanvas.tsx     # 1200x630 HTML5 Canvas result card renderer & exporter
    │   └── ShortcutsModal.tsx      # Accessible keyboard shortcuts dialog (?)
    └── pages/
        ├── LandingPage.tsx         # 10-section storytelling landing page with live mini test
        ├── PracticePage.tsx        # Core 4-line typing arena
        ├── ResultsPage.tsx         # Post-test analytics, WPM chart, slow keys, and share card
        ├── ProgressPage.tsx        # Lifetime stats, 26-week calendar, personal bests, and history table
        ├── LeaderboardPage.tsx     # Coming soon preview, personal top 10, and local notify-me form
        ├── SettingsPage.tsx        # Appearance, typing, audio, motion, and JSON data management
        ├── AboutPage.tsx           # Editorial story, Made in India section, scoring formulas, roadmap
        ├── ContactPage.tsx         # Validated contact form with mailto: builder and clipboard copy
        ├── PrivacyPage.tsx         # Plain-English privacy policy with sticky TOC
        ├── TermsPage.tsx           # Terms of use & practice command disclaimer with sticky TOC
        ├── ChangelogPage.tsx       # Data-driven release timeline
        └── NotFoundPage.tsx        # Custom 404 terminal page with physical Backspace navigation
```

---

## 4. Application Routes

| Route | Page Title | Purpose |
| :--- | :--- | :--- |
| `/` | `Backspace – Typing Practice for Developers` | Storytelling landing page with self-typing hero, live mini test, bento features, and FAQ |
| `/practice` | `Practice – Backspace` | Main typing arena supporting URL query params (`?category=git&time=60&level=medium&drillKey=...`) |
| `/results` | `Test Results – Backspace` | Post-test breakdown, WPM-per-second SVG chart, QWERTY slow-key heatmap, and 1200×630 share card |
| `/progress` | `Progress & Analytics – Backspace` | XP bar, streaks, personal bests table, WPM trend chart, 26-week calendar, badges, and 50-test log |
| `/leaderboard` | `Leaderboard – Backspace` | Local personal top 10, clearly marked `SAMPLE` global preview rows, and local email notification form |
| `/settings` | `Settings – Backspace` | Theme, font size (`20–36px`), line spacing, caret style, key sound, reduce motion, and data export/reset |
| `/about` | `About – Backspace` | Product philosophy, Made in India statement, transparent scoring math, and 3-stage roadmap |
| `/contact` | `Contact – Backspace` | Validated feedback/bug form with 600-char counter, `mailto:` launcher, and copy-message fallback |
| `/privacy` | `Privacy Policy – Backspace` | Truthful v1 privacy documentation (local storage only, no cookies/analytics, Google Fonts disclosure) |
| `/terms` | `Terms of Use – Backspace` | Acceptable use, command safety disclaimer, IP ownership, and governing law placeholder |
| `/changelog` | `Changelog – Backspace` | Versioned release notes (`v1.0.0`) and upcoming milestones |
| `*` | `404 Not Found – Backspace` | Interactive `$ cd /unknown` terminal error page where pressing `Backspace` navigates back |

---

## 5. Typing Engine & Scoring Mathematics

All typing and scoring calculations live in `src/engine/scoring.ts` and `src/engine/typingEngine.ts` with zero UI framework dependencies:

- **Correct Characters (`correctChars`)**: Characters in committed lines and the active line that match the target character at the same index. Pressing `Enter` to commit a completed line counts as `1` correct character.
- **Net WPM**:
  $$\text{netWPM} = \text{round}\left(\frac{\text{correctChars} / 5}{\text{minutes}}\right)$$
- **Raw WPM**:
  $$\text{rawWPM} = \text{round}\left(\frac{\text{totalKeystrokes} / 5}{\text{minutes}}\right)$$
- **Accuracy %**:
  $$\text{accuracy} = \text{round}\left(\frac{\text{correctKeystrokes}}{\text{totalKeystrokes}} \times 100\right)$$
  *(Note: Corrected mistakes still count as keystroke errors in accuracy.)*
- **Consistency %**:
  $$\text{consistency} = \text{clamp}_{0..100}\left(100 - \frac{\sigma(\text{perSecondWPM})}{\mu(\text{perSecondWPM})} \times 100\right)$$
- **Backspace Score** *(headline personal-best metric alongside WPM)*:
  $$\text{backspaceScore} = \text{round}\left(\text{netWPM} \times \left(\frac{\text{accuracy}}{100}\right)^2\right)$$
- **XP & Developer Levels**:
  - $\text{XP}_{\text{test}} = \text{round}(\text{backspaceScore} / 2) + 10$
  - $\text{Level} = \lfloor\sqrt{\text{Total XP} / 50}\rfloor + 1$
  - **Titles**: Levels 1–2 `Intern` · Levels 3–4 `Junior` · Levels 5–7 `Mid` · Levels 8–11 `Senior` · Levels 12–17 `Staff` · Level 18+ `Principal`
- **Per-Key Latency & Adaptive Weighting**:
  - Tracks `{ count, totalLatencyMs, errors }` for every expected character (ignoring idle pauses $> 2000\text{ ms}$).
  - Keys with $\ge 8$ samples qualify for the **Top Slowest Keys** and **Top Error Keys** rankings.
  - **Adaptive Mode (`My weak keys`)** scores every line across all banks by the normalized sum of character slowness and error rate, mixing 80% high-scoring lines with 20% general lines.
- **Save Qualification**:
  - A test is persisted only when it finishes normally with $\ge 5\text{ seconds}$ elapsed and $\ge 10\text{ characters}$ typed. Tests cancelled with `Esc` are discarded.

---

## 6. Design System: "Paper and Ink"

Defined in `src/index.css`:

| Token | Light Mode (Default) | Dark Mode (`.dark`) | Role |
| :--- | :--- | :--- | :--- |
| `--paper` | `#F2EDE4` | `#14110D` | Page background |
| `--card` | `#FAF7F0` | `#1D1914` | Card & keycap surface |
| `--line` | `#D9D2C3` | `#3A332A` | 1px hairline borders & keycap depth |
| `--ink` | `#1B1A17` | `#F2EDE4` | Primary typography & active borders |
| `--text-muted` | `#6B665B` | `#A89D8A` | UI labels & secondary copy |
| `--untyped` | `#8A8478` | `#8C8170` | Untyped characters in the typing arena |
| `--accent` | `#FF5B1F` | `#FF7A45` | Vermilion block cursor, progress line, primary CTAs |
| `--accent-ink` | `#B8390A` | `#FF9A6B` | High-contrast vermilion for small text labels |
| `--error` | `#C8102E` | `#FF6B6B` | Incorrect character underline & error counters |
| `--success` | `#2F4B3A` | `#8FBF6A` | Online status & confirmation messages |
| `--gold` | `#C8962E` | `#D9A93F` | Decorative ornament band & lotus corner accents |

- **Typography**:
  - **Display**: `Bricolage Grotesque` (700, 800)
  - **Body**: `IBM Plex Sans` (400, 500, 600)
  - **Monospace / Arena**: `IBM Plex Mono` (400, 500, 600) with `font-variant-ligatures: none`
  - **Devanagari**: `Noto Sans Devanagari` (for `बैकस्पेस` on About and Footer)
- **Tactile Geometry**:
  - Zero drop shadows and zero gradients across the entire UI.
  - Keycaps and interactive buttons use `3px` border-radius, `1px` border, and a `3px` bottom border that compresses to `1px` (`translateY(2px)`) on `:active`.

---

## 7. Local Storage Schema & Privacy

All user data is stored in `localStorage` under the `backspace:v1:` namespace, wrapped in a versioned envelope `{ schemaVersion: 1, data: ... }` with automatic fallback to an in-memory `Map` if `localStorage` is blocked in private/sandboxed browsing:

- `backspace:v1:settings` — Theme, font size, line spacing, caret style, sound, motion, and last-used mode parameters.
- `backspace:v1:results` — Array of completed `TestResult` records (capped at 500, newest first).
- `backspace:v1:keyStats` — Cumulative per-character `{ count, totalLatencyMs, errors }`.
- `backspace:v1:bigramStats` — Cumulative two-character sequence telemetry for future bigram drills.
- `backspace:v1:personalBests` — Map keyed by `"category|duration|level"`.
- `backspace:v1:streakDates` — Array of local `YYYY-MM-DD` dates with at least one completed 30s+ test.
- `backspace:v1:xp` — Cumulative developer XP integer.
- `backspace:v1:badges` — Array of unlocked badge IDs.
- `backspace:v1:notifyEmail` — Locally saved email from the Leaderboard coming-soon form.

---

## 8. Keyboard Shortcuts

### Global Hotkeys *(active whenever the typing arena and form inputs are not focused)*
- <kbd>g</kbd> then <kbd>p</kbd> — Go to **Practice** (`/practice`)
- <kbd>g</kbd> then <kbd>s</kbd> — Go to **Progress** (`/progress`)
- <kbd>t</kbd> — Cycle color theme (`Light` → `Dark` → `System`)
- <kbd>?</kbd> — Open or close the Keyboard Shortcuts modal

### Inside the Typing Arena
- <kbd>Tab</kbd> — Restart test immediately with freshly shuffled lines
- <kbd>Esc</kbd> — Cancel active test and exit focus mode
- <kbd>Enter</kbd> — Commit completed line and advance to the next line
- <kbd>Backspace</kbd> — Delete character within the current line only

---

## 9. Getting Started & Commands

```bash
# Install dependencies
npm install

# Start local development server on http://localhost:3000
npm run dev

# Run pure TypeScript engine & scoring unit tests
npx --yes tsx --test src/engine/engine.test.ts

# Type-check the codebase
npm run lint

# Build for production
npm run build
```

---

## 10. Pre-Launch Customization Checklist

Before deploying to production, review and update these clearly marked constants:

1. **Logo Assets (`src/components/Logo.tsx`)**:
   - `FULL_LOGO_SRC` and `ICON_LOGO_SRC` point to your supplied assets in `/public/assets/aistudio/`. If you rename or move the image files, update those two constants in `src/components/Logo.tsx`.
2. **Contact Email & GitHub Repository URL (`src/hooks/useDocumentMeta.ts` & `src/pages/ContactPage.tsx`)**:
   - Replace `CONTACT_EMAIL = 'hello@example.com'`, `GITHUB_URL = 'https://github.com/example/backspace'`, and `SITE_URL = 'https://backspace.dev'` with your live addresses.
3. **Legal Review (`src/pages/PrivacyPage.tsx` & `src/pages/TermsPage.tsx`)**:
   - Replace `GOVERNING_LAW_PLACEHOLDER` in `src/pages/TermsPage.tsx` and remove the draft review banner once reviewed by legal counsel.

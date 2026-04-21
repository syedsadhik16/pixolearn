

## Professional BYJU-style Journey Screen

Transform `/journey` into a winding-path roadmap with floating ambient blobs, themed monthly phases, and a single popping "Continue" card for the current lesson — matching your reference images while preserving PIXO's warm red + blue brand and all existing data wiring.

### Visual concept

```text
 ┌──────────────────────────────────────┐
 │   Header: "My Adventure" + progress  │
 │   ─── thin gradient progress pill ── │
 ├──────────────────────────────────────┤
 │  ◯ blob       PHASE 1 · Sound Sense  │  ← phase chip (coral)
 │       ╲                              │
 │        ●  Day 1   ✓                  │  ← node on winding path
 │       ╱                              │
 │      ●   Day 2   ✓                   │
 │       ╲      ◯ blob                  │
 │        ●  Day 3   ★ milestone        │
 │       ╱                              │
 │   ┌─────────────────────────┐        │
 │   │  Day 4 · Blend Sounds   │  ←── floating "current" card
 │   │  [   Continue   ]       │        (pops above path)
 │   └─────────────────────────┘        │
 │        ●  Day 5  🔒                   │
 │       ╲                              │
 │  ──── PHASE 2 · Word Builders ────   │
 │   (locked, grayscale until reached)  │
 └──────────────────────────────────────┘
```

### What changes (only `src/pages/Journey.tsx` + tiny CSS additions)

1. **Background ambience** — Add 3–4 fixed `pixo-blob` shapes (coral, sky, yellow) drifting behind the scroll content, plus faint dotted SVG path trail down the center. Pure decorative, `pointer-events-none`.

2. **Header** — Compact: companion mascot + "My Adventure" title, then a slim gradient pill progress bar with `Day X / 180` and `XX%` on the right. Drop the long subtitle.

3. **Phase sections (replaces accordion)** — Each month becomes a vertical "phase" with:
   - A colored chip header (e.g. `Phase 1 · Sound Sense` in coral) with a small emoji medallion.
   - Themed accent color per phase (reuses existing `monthColors` palette: coral → yellow → green → sky → purple → red).
   - Locked phases render grayscale + lock icon, no expand needed — the whole roadmap is always visible (BYJU-style continuous scroll).

4. **Winding path of day-nodes** — Replace the flat list with circular nodes (56px) zig-zagging left/center/right via `margin-left` offsets (`ml-0 / ml-12 / ml-24` alternating). Connecting **dotted SVG path** between nodes using `stroke-dasharray`. Node states:
   - Completed: filled secondary green + check.
   - Current: large primary node with subtle glow + pulse ring.
   - Milestone: gold ring + star.
   - Locked: muted gray + lock.
   - Premium-locked (free plan, day > 2): crown icon, taps go to `/pricing`.

5. **Floating "Current Lesson" card** — When the path reaches the current day, render a white pill card (`pixo-card-premium`) overlapping the node with:
   - Tiny eyebrow: `Day 4 · Sound Intro`
   - Title: lesson title (truncated)
   - Full-width pill **Continue** button (primary gradient).
   This mirrors the "Irrational Exponents → Continue" card from your reference.

6. **Free-plan paywall banner** — Keep existing crown banner but restyle to match new card system (rounded-3xl, soft shadow, no border).

7. **Locked future levels** — Keep the two "Level 2 / Level 3" tiles at bottom but restyle as muted phase chips for visual consistency.

### Technical notes

- **No data/logic changes** — `useCurriculumProgress`, `completedDayIds`, `currentDay`, premium gating, navigation all preserved exactly.
- **Auto-scroll to current day** on mount (replaces auto-expand-month).
- **Accessibility** — All nodes remain ≥48px touch targets; `aria-label` on each node ("Day 4, current, tap to continue"); dotted path is `aria-hidden`.
- **Performance** — SVG paths are static; blobs use CSS transforms only; no extra network calls.
- **CSS additions** in `src/index.css` (~20 lines): `.journey-node`, `.journey-path-dot`, `.journey-phase-chip`, `.journey-current-card` utilities.

### Files touched

- `src/pages/Journey.tsx` — full redesign (logic untouched).
- `src/index.css` — append journey-specific utility classes.

### Out of scope

- Lesson content, curriculum data, route guards, premium logic — all unchanged.
- Other screens (Dashboard, Lesson, Trophies) — not touched in this pass.


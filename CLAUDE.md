# You are riffing on someone else's prototype

This repo is a copy of [`comp4020-ass2-dachi`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass2-dachi) at
`a80c0830` --- dachi's crit agent's shipped prototype for `06-a2-retro`.
The copy is yours; their repo is untouched and off limits.

**The brief is to take this somewhere it hasn't been.** Not to restart it, not
to polish it, and not to finish the agent's to-do list. Read how they directed
the agent, find the thing the prototype implies but doesn't do, and build
that. You have the session's half-hour, so pick something you can get live.

**Nothing here is marked.** No cutoff, no reflection, no `PROCESS.md` entry,
no crit sweep, no repo of your own on the line. That is the point --- the
interesting move is the one you wouldn't risk in your own graded repo.

**What you show at the share-back** is the live site plus
`git diff riff-start`. Push early and keep `main` green.

**The agent's own spec tests are `spec/course-promises.test.ts` and `spec/data-integrity.test.ts`.** They encode the crit brief,
not yours, and they gate the deploy --- a red check means no live site to show
at the share-back. If your riff moves past that brief, change them or delete
them; keep `spec/invariants.test.ts` green, since that one is true of any good
site.

Everything below this line was written for that crit submission. The marks,
the cutoff, the private-repo phase, the weekly `start` skill and the
reflection are all done, and none of it governs what you do here. Read it for
how they worked, not for what you owe.

---

# Doorology (SLOP2558)

A studio course on doors, run as crits and clinics rather than lectures. One
niche object, four assessments, no generic curriculum padding.

## Content rules

- Every `related:` edge is declared once, on whichever side of the pair is
  more natural, never both — the graph renders it on both pages regardless.
- Session/lecture slugs referenced by an assessment's `related:` are fixed by
  that assessment; write the assessment first if a slug needs to be locked
  in, then match it exactly when writing the corresponding session/lecture.
- A session or lecture's `spec:` must be a contract a reader can check
  without asking the person who wrote it — "you can name X" not "you
  understand X."
- No stock photography. Illustrations are two-ink risograph flat shapes in
  the theme's own gold/black tokens (read `--at-primary`/`--at-secondary`
  from `astro-theme-slop`'s CSS before picking a colour), generated with
  Python PIL since no image-gen tool is available in this environment.
  Dropping a placeholder image entirely (no replacement) is a valid design
  choice `check-evidence.ts` accepts — used for the people page.
- A blanket policy claim ("every X is due at Y") has to be checked against
  every entry it covers, not assumed true by pattern — the field guide is
  genuinely due after the closing crit, not at it, and the policies page
  said otherwise until a coherence pass caught it. When writing a rule that
  generalises across all four assessments or all twelve sessions, grep the
  actual frontmatter dates rather than trusting the pattern the other three
  established.
- A `teachers:` list on a crit session should include whoever marks the
  assessment due that session, not just the convenor — the week 8 redesign
  crit already listed both Petra and Callum for exactly this reason (he
  marks the redesign proposal), but week 4's audit crit was missing him
  despite him marking the door audit due there too, found on a seventh
  fresh content read and fixed to match the established pattern (commit
  `22f0789`). When a person's own bio names which assessments they mark,
  check every crit session where one of those assessments is due lists
  them, not just the ones a first pass happened to get right.
- A session's `spec:` list can silently inherit a bullet from the
  underlying `astro-course-university` template's own example content
  (a generic web-dev claim like "your dev environment runs the course's
  toolchain") that was never replaced with a claim about this course's
  actual subject — invisible to `check-evidence.ts` (which only checks
  that `spec:` exists, not that it's in-universe) and to every browser-level
  sensor, only findable by reading the prose against the rest of the
  course's voice. Found on session 1 on a seventh fresh content read,
  fixed to a door-specific, still-checkable claim (commit `8d60555`).

## Verification

- `pnpm check`'s own accessibility gate (`astro-theme-university`'s
  `a11y-checker.ts`) runs axe-core inside JSDOM, not a real browser — it can
  report "no accessibility violations" while still being structurally blind
  to `color-contrast` failures, which need real layout/paint to resolve.
  A clean `pnpm check` is not sufficient evidence of accessible contrast;
  confirm separately with `agent-browser a11y <url> --json` against a served
  `dist/` build. Run 2026-09-15 across all distinct page templates (home,
  both listing and `[slug]` pages for sessions/lectures/assessments/people,
  policies, the week-1 deck) came back 0 violations/0 incomplete; a follow-up
  run the same day swept all 12 session and 6 lecture `[slug]` pages
  individually (a superset of the one-per-template pass), also 0/0 — real
  confirmation, not a restatement of the build's own jsdom-based pass.
- Live-tested pagefind search (2026-09-15): a real query returns correctly
  excerpted results linking to the right page, a nonsense query shows "No
  results," clearing to empty hides all status — all confirmed with
  `agent-browser` against a served `dist/` build. Note for future reference,
  not something reproduced as a live bug: `SearchDialog.astro`'s dynamic
  `import()` of the pagefind index sets a permanent `loadFailed` flag on any
  failure, with no retry and no console diagnostic — a fragile failure mode
  in the vendored component, worth knowing about if search ever looks
  silently broken with nothing in the console to explain it.
- This site builds with `base: "/comp4020-ass2-dachi/"` (a GitHub Pages
  project site), so every asset/script reference in the built HTML is an
  absolute path under that prefix. Serving `dist/` at the web root (e.g.
  `python3 -m http.server -d dist`) 404s every script — axe-core a11y
  checks still come back clean because they don't depend on client JS, but
  any check of actual page behaviour (the dark-mode toggle, search) will
  silently no-op and look like a bug that isn't one. Serve `dist/` from a
  directory one level up with a symlink named `comp4020-ass2-dachi` pointing
  at it, so requests resolve at the real base path, before trusting any
  live JS-behaviour check against a local build.
- The deck's own `src/decks/theme.css` only imports
  `astro-theme-university/styles/deck.css` — deck pages don't load the
  site's `base.css`, so they miss its blanket `prefers-reduced-motion`
  override, and reveal.js's bundled CSS (the nav-arrow bounce, fragment/
  slide transitions) ships with no reduced-motion handling of its own.
  Confirmed live (forced `reduced-motion: reduce`, polled every element's
  computed `animationDuration`/`transitionDuration`) and fixed by adding
  the same zero-duration `!important` override scoped to `.reveal *` in
  `theme.css` (commit `ef03259`).
- `astro-theme-university`'s `Nav.astro` wires its mobile menu toggle to
  clicks only — no `Escape` handler — while its sibling `SearchDialog`
  already closes on `Escape`. Not a WCAG failure (the toggle button itself
  still closes the menu on a second Enter/Space, so there's no keyboard
  trap), but a real, verified asymmetry between two components that should
  agree on keyboard convention. Confirmed live with `agent-browser`:
  `Tab` to the toggle, `Enter` to open (`aria-expanded="true"`), `Escape`
  left it open before the fix, closed it after. `Nav.astro` lives in
  `node_modules` (a vendored dependency, not a file this repo owns), so
  the fix is a small Astro integration in `astro.config.ts` using
  `injectScript("page", ...)` to add the missing document-level listener,
  rather than a node_modules edit that `pnpm install` would discard
  (commit `be03362`).
- Dark mode fully live-tested (2026-09-17): the footer toggle flips
  `data-theme` and persists to `localStorage`; a fresh page load with no
  stored preference correctly follows `prefers-color-scheme`; a stored
  preference correctly overrides the system scheme on reload; a real
  `agent-browser a11y --json` sweep in dark mode across four distinct page
  templates (home, a session, policies, the deck) came back 0 violations/0
  incomplete. Also checked the project's own `.at-footer-theme-toggle:focus-
  visible` fix (`src/styles/a11y-fixes.css`) in both themes by hand: axe/
  `getComputedStyle` can't resolve an `oklch()`/`light-dark()` colour to
  sRGB for a contrast calculation (both returned the un-evaluated
  color-function string, not rgb), so the outline colour vs. background was
  each resolved to sRGB via a 1×1 canvas `fillStyle`/`getImageData` round
  trip, then checked against the WCAG 3:1 non-text-contrast floor by hand —
  passes in both themes (~5.8:1 dark, ~3.5:1 light). A logic-symmetry pass
  over this repo's own scripts (`course-config.ts`, `lib/dates.ts`,
  `scripts/pages-base.ts`, `scripts/check-evidence.ts`, `content.config.ts`,
  `site-config.ts`, `astro.config.ts`) — the first time this project's own
  code, rather than the vendored theme, was the target — found no
  asymmetry; everything so far has come from the theme's vendored
  components (Nav, the mobile menu), not this repo's code.
- `astro-theme-university`'s `clientRouter` defaults to `true` and this
  project never overrides it, so every navigation is an Astro `ClientRouter`
  soft transition, not a full page reload — a distinct condition from every
  previous live check in this file, all of which tested via full page loads
  or reloads. All three of this project's own `astro.config.ts` integrations
  (dark-theme persistence, the Escape-to-close handler, the scroll-lock
  `MutationObserver`) were re-tested specifically across a real soft
  navigation (confirmed genuine via a `window.__mark` global surviving the
  transition, which a full reload would destroy): theme survives via the
  script's `data-astro-rerun`; clicking a nav link *from inside the open
  mobile menu* lands on the new page with `aria-expanded="false"` and
  `documentElement.style.overflow` correctly reset to `""` (the
  `astro:page-load` listener re-syncing against the freshly-swapped
  toggle's own default state, not a stale one carried over from the old
  page); Escape still closes a freshly-opened menu afterwards, since its
  listener is bound to `document`, which persists across the transition.
  No bug found, but this closes a real gap: nothing in the sweeps above had
  tested any custom integration against a soft navigation rather than a
  full page load.
- **A contrast fix verified in only one theme is not verified.** The
  `.at-card-title`/`.related-content h2` fix (`--at-secondary` instead of
  the theme default, added early to clear a 3.43:1 light-mode failure) was
  only ever checked against the light theme's background. `astro-theme-
  slop`'s `--at-primary`/`--at-secondary` are both flat hex, not
  `light-dark()`-aware, so the same dark bronze that clears 5.7:1 on a near-
  white background reads only 3.5:1 on the dark theme's near-black one —
  a real `agent-browser a11y` violation on three homepage cards, invisible
  to every prior sweep because they all ran in whichever theme happened to
  be active at the time, never both deliberately. `--at-primary` clears
  5.8:1 against the dark background (computed both by hand and confirmed
  live), so the fix is now `light-dark(var(--at-secondary),
  var(--at-primary))` everywhere the original fix was applied (6 files,
  commit `4970561`), re-confirmed 0 violations in both themes afterwards.
  General lesson: any hand-picked color fix for a contrast failure has to
  be re-checked against every theme the site ships, not just the one whose
  failure prompted it — `light-dark()` is the fix shape when the two
  themes need different literal values from the same semantic token.
- A full two-viewport screenshot sweep (all 32 pages), a desktop keyboard
  walkthrough, and the 320px reflow check all came back clean (2026-09-16).
  The one real finding, from the resize-mid-interaction check on the mobile
  nav: `.at-nav` is `position: sticky`, so the open mobile menu stays pinned
  at the top while the page scrolls underneath it — nothing locked
  background scroll. Confirmed live against a real mouse-wheel gesture
  (`agent-browser mouse wheel`, not `scrollBy` — CSS `overflow: hidden`
  blocks real wheel/touch input but not a scripted `scrollTo`/`scrollBy`,
  so that's the wrong sensor to prove a lock actually works). Also confirmed
  `document.scrollingElement === documentElement` on this page, so the lock
  has to target `documentElement`, not `body`. Fixed with a third
  `injectScript("page", ...)` integration (`nav-scroll-lock`) using a
  MutationObserver on the toggle's `aria-expanded` attribute rather than a
  click listener, so it also reacts to the Escape handler above and to the
  desktop breakpoint switch (which leaves `aria-expanded="true"` untouched
  even once the toggle itself becomes `display: none` — confirmed by the
  resize check, so the lock logic checks toggle visibility too, not just
  the attribute) (commit `6b72d6b`).
- A full OG/meta-tag audit across every distinct page template (home,
  session, lecture, assessment, person, policies, deck) found every
  `og:title`/`og:description`/`<title>` door-specific and accurate — no
  copy-pasted or generic text. One thing that looks like an inconsistency
  on first read but isn't: `[slug].astro`/`index.astro` pages (sessions,
  lectures, assessments, people, home) pass a raw literal `title` straight
  through to `BaseLayout`, with no suffix, while the hand-written top-level
  `index.mdx` pages (assessments, lectures, people listings, policies) come
  out as `"<title> — Slop University"` — `astro-theme-university`'s
  `remark-default-layout` auto-assigns its layout only to files under
  `pages/` with no `layout:` frontmatter already set, and that layout is
  what appends the site-name suffix; the custom route files never go
  through it. Same mechanism as this repo's other content, just two
  different page-authoring paths in the starter — not a bug to fix.
- This starter (`astro-theme-university`) ships no `@astrojs/sitemap`
  integration and no `robots.txt` in `public/` — `dist/` has neither.
  Not a gap: the brief and `check:evidence` don't ask for one, and adding
  one would be scope the assignment didn't request.
- A second full two-viewport screenshot sweep (2026-09-18), targeted at
  every template touched since the first sweep (2026-09-16) — the
  `light-dark()` contrast fix (6 files) and two content edits (session 01,
  session 04) — came back clean. No overflow, no broken cards, weight/date
  text still agrees with the underlying frontmatter (door audit correctly
  reads "20%" both on its own assessment page and in session 04's
  "Afterwards" summary).
- A mechanical grep across all of `src/content/` for common LLM stock
  phrases (delve, boundaries, tapestry, unlock, journey, seamless, robust,
  leverage, paradigm, "it is important to note", etc.), for rhetorical
  questions (`\?` anywhere in body text — zero hits, not just zero at line
  ends), and for generic design-jargon that would fail this file's own
  noun-swap voice test (design thinking, user-centered, ideation,
  stakeholder) all came back with zero matches. A different sensor from
  the several full manual content reads logged above — cheap, and worth
  re-running after any large content addition as a fast confirm rather
  than a full re-read.
- A dedicated throughline check (2026-09-18), distinct from the fact-
  coherence passes above: read all four assessment briefs side by side
  against the brief's own model-course criterion — one idea carried the
  whole semester, not four assignments sharing a topic. It holds: the
  audit's signifier/affordance vocabulary becomes the redesign's
  access/trust lenses, the prototype tests whether the redesign's claim
  survives contact with a stranger, and the field guide asks whether the
  categories generalise past the doors that produced them — every stage
  interrogates the same question, does this door tell the truth about
  what it does, at a different grain. Also reconsidered whether the
  course's own positioning ("Doorology") states a point of view as
  directly as the brief's cited model courses — the title is descriptive,
  but the home page's opening line ("Anyone who has ever pulled a door
  marked 'push'") already carries the argument the title doesn't; renaming
  a settled, cross-referenced course code this late for a title that
  wouldn't add a claim the prose doesn't already make wasn't worth the
  churn. No edit resulted from either check.
- The generic-template `spec:` bullet found on session 1 (commit `8d60555`)
  was caught incidentally on a fresh content read, not a targeted sweep —
  worth checking it wasn't the only one. A systematic pass (2026-09-18)
  read every session's and lecture's `spec:` frontmatter directly: all 12
  sessions carry door-specific, checkable bullets, and all 6 lectures
  correctly carry no `spec:` at all, matching the template's own contract
  ("declare it on anything that gets a mark, leave it empty elsewhere").
  Session 1 was an isolated instance, not a pattern — `pnpm check` also
  green at 32 pages/0 violations/0 broken links/6 tests this same run.

## Voice

Second person, addressed to the student, plain and specific. No rhetorical
questions, no "unlock"/"journey"/"dive in." A paragraph earns its place by
saying something only true of doors, not of "design thinking" in general —
if a sentence would survive with every mention of "door" swapped for
another object, cut it.

## Marking

Both `weighted` and `holistic` marking modes are used deliberately: the
capstone (Field Guide) is holistic because it's judged as a finished whole,
not a checklist; everything upstream of it is weighted because the criteria
that matter are known in advance and worth naming separately.

# FlowSpot Design System

## Kimatchum workbench restoration

Preserve the original five-step workflow: upload, song/singer range, common-range key comparison, score/chord playback/export, multiple songs; keep team ranges in the existing disclosure. Reuse the existing browser engine with its original algorithms and review gates. The workbench is the default tab; authenticated intake/email review is a separate, preserved tab. Request links open that tab. Switching tabs preserves work and stops audio. Embedded content reports its height to a same-origin/source-checked parent so the outer document owns scrolling. Paper/green tokens remain the visual contract. Show original image immediately and never label synthetic chord playback or experimental melody OCR as a verified singer-fit result. No authentication, server flags, storage permissions or email behavior changes. Existing offline browser test infrastructure is reused; no new packages. Lighthouse results are not claimed.

## 1. Atmosphere & Identity

FlowSpot's product and admin surfaces are quiet, practical workspaces. The admin signature is a compact white workspace on a soft gray canvas, with restrained status color used only to direct attention.

## 2. Color

The source of truth is `src/app/globals.css` and its semantic tokens.

| Role | Token or utility | Usage |
| --- | --- | --- |
| Page | `bg-background`, `bg-zinc-50` | Main and admin canvases |
| Surface | `bg-card`, `bg-white` | Cards and tables |
| Text | `text-foreground` | Primary copy |
| Muted text | `text-muted-foreground`, `text-zinc-500` | Captions and metadata |
| Border | `border-border`, `border-zinc-200` | Dividers and controls |
| Primary | `bg-primary`, `text-primary-foreground` | Primary actions |
| Positive | emerald utilities | Success and positive change |
| Warning | amber utilities | Attention without failure |
| Negative | rose utilities | Errors and negative change |
| Highlight | violet utilities | Current selection or active period |

Do not add raw colors when a semantic token or existing status ramp covers the role.

## 3. Typography

- Primary: Noto Sans KR with system fallbacks.
- Page title: `text-3xl font-bold tracking-tight`.
- Section title: `text-base font-semibold` or shared `CardTitle`.
- Metric: `text-2xl font-bold`.
- Body: `text-sm` to `text-base`.
- Caption: `text-xs text-muted-foreground`.
- Letter spacing remains zero except for existing admin navigation labels.

## 4. Spacing & Layout

- Base unit: 4px, expressed through Tailwind spacing utilities.
- Admin content width: `max-w-7xl`.
- Admin page padding: 24px mobile, 32px desktop.
- Section rhythm: 24px (`space-y-6`).
- Card padding: 24px desktop; compact 16px variants are allowed for dense mobile metrics.
- Responsive breakpoints follow Tailwind defaults. Multi-column admin content becomes one readable column below `md`.

## 5. Components

### Admin Sidebar
- Structure: grouped navigation with icon and label.
- States: default, hover, active, pending, collapsed, mobile open.
- Accessibility: descriptive labels remain available when collapsed.

### Metric Card
- Structure: label, optional comparison caption, prominent value.
- Variants: neutral, positive, warning, negative.
- Layout: 1 column mobile, up to 3 columns desktop.
- Empty state: show `0`, never a blank surface.

### Admin Data Table
- Structure: descriptive header, column labels, rows, empty state.
- Desktop: aligned table columns.
- Mobile: stacked, unframed rows with dividers; no horizontal scrolling for primary information.
- Long identifiers and email addresses may truncate only on pages where the full value is available elsewhere.

### Card
- Use the shared `Card`, `CardHeader`, and `CardContent` primitives.
- Keep cards flat and independent. Do not nest decorative cards.

## 6. Motion & Interaction

- Use existing 150-200ms color and opacity transitions for interactive controls.
- Loading navigation uses the existing spinner state.
- Data views do not use decorative entrance motion.
- Respect reduced-motion preferences for any future non-essential motion.

## 7. Depth & Surface

Use mixed subtle borders and the shared card's light shadow. Status-tinted cards may use a soft tonal shift, but must retain readable contrast. Avoid additional floating layers in dense admin views.

## 8. Accessibility Constraints & Accepted Debt

- Target WCAG 2.2 AA.
- Body copy remains at least 14px.
- All interactive elements need visible focus and keyboard access.
- Korean labels must wrap by phrase without clipping or single-character orphan lines.
- Primary content must fit at 375px without horizontal overflow.

Accepted debt: the existing admin pages contain a mix of raw zinc utilities and semantic tokens. New work follows the existing pattern; broader token consolidation is outside the current feature scope.

## 키맞춤 전용 화면 (local implementation contract)

- Identity: a score review desk, separate from the FlowSpot sales/product shell. Wordmark is 키맞춤; no sales navigation or support launcher. Existing authentication remains shared and is disclosed in the login explanation.
- Palette scoped to `.shell`: paper #f5f4ef; card/score white #ffffff; ink #233c38; secondary ink #546760; action #245e50; muted #e9eee8; line #d6dfd8; error #b42318. Fixed light paper surfaces preserve score readability even under a dark system preference. Other routes keep existing tokens.
- Typography: existing Noto Sans KR; brand 24px/700, heading 32px/700 (28px mobile), body 16px, secondary 14px. No new fonts.
- Layout: document owns scrolling, 1120px content cap, 24px desktop / 16px mobile gutter, 24px section rhythm. Header wraps at 640px. Existing review grid remains one column below 1024px. Long email/status text wraps.
- Primitives: reuse Button/Input/Card with scoped semantic tokens; reuse a KimatchumShell for workspace and contextual login. Controls >=44px, visible keyboard focus; loading/disabled/error states use existing handlers. Login uses an explicit form with email/password labels and existing social/magic-link actions.
- Motion/depth: existing button transitions only; neutral thin borders and existing light card shadow. No animations, assets, external fonts or new packages added.
- Accessibility: 4.5:1 body contrast target, 375px overflow check, semantic headings/nav/main, keyboard form submission, always-visible current product limitations. No promises of melody transposition or vocal-range playback.
- Accepted scope: shared OAuth provider screens, legal documents and sender domain retain existing service identity. Auth permission/redirect validation, DB and music recognition are unchanged. The screen must explicitly state that notation remains in the original key and playback is for checking chords. Lighthouse metrics are not claimed without measurement.

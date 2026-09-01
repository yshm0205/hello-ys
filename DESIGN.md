# FlowSpot Design System

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

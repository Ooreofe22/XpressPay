# PayXpress design system

All styling flows from semantic tokens in `app/globals.css`. Components never use raw hex values or `bg-white`; they use token classes, so the light and dark themes come for free.

## Theme

- `components/theme/ThemeProvider.tsx` sets the theme by toggling `.dark` on `<html>`. An inline script in `app/layout.tsx` applies it before first paint, so the page never flashes the wrong theme.
- The first visit follows the OS setting. After the user picks a theme with `ThemeToggle`, the choice is saved in `localStorage` (`payxpress-theme`).
- `ThemeToggle` appears in the landing nav, the app top bar and the auth screens.

## Colour tokens

| Token | Light | Dark | Use |
| --- | --- | --- | --- |
| `background` | #f5f5f7 | #000000 | Page |
| `card` | #ffffff | #161618 | Raised surfaces, alternate sections |
| `secondary` / `muted` | #f0f0f3 | #232326 | Chips, icon wells, hover fills |
| `foreground` | #1d1d1f | #f5f5f7 | Primary text |
| `muted-foreground` | #5e5e66 | #a1a1a8 | Secondary text, at least 5.4:1 contrast |
| `border` | #e3e3e8 | #2a2a2e | Hairlines |
| `primary` (accent) | #0b6e4f | #2ec48a | CTAs, focus rings, positive values |
| `warning` / `warning-tint` | #a34a00 / #fff1e0 | #ffb340 / 14% | Pending, flagged, needs attention |
| `destructive` / `destructive-tint` | #d70015 / #ffebed | #ff5c5c / 14% | Failed, suspended, errors |
| `primary-foreground` | #ffffff | #03140d | Text on accent |

There is **one accent**. `accent` is an alias of `primary`, kept so existing classes keep working. Never use it to mean "attention": that is `warning`.

## Type scale

| Class | Size | Use |
| --- | --- | --- |
| `type-display` | 42 to 88px fluid | Hero headline, once per page |
| `type-title-1` | 34 to 60px fluid | Section headlines |
| `type-title-2` | 24 to 32px fluid | Panel titles |
| `type-lead` | 18 to 22px fluid | Intro paragraphs |
| `type-body` | 17px | Body copy |
| `type-footnote` | 13px | Fine print |

Headlines get `text-wrap: balance` globally. Limit their width with `max-w-[Nch]` **on the heading element itself**, so `ch` is measured at the heading's font size.

## Rules

1. **One filled button per view.** Use `CtaLink` (accent, 10 to 14px corners) for the main action. Secondary actions are `TextLink`s.
2. **Loading states.** `CtaLink` shows a spinner while navigation is pending (`useLinkStatus`). `/app` has a skeleton in `app/app/loading.tsx`. Use the `.skeleton` utility for placeholders.
3. **Motion is feedback only.** Animate state changes like progress, success, a changed value or a new row. No scroll reveals, floating blobs or looping decoration. Always respect `prefers-reduced-motion`.
4. **Mono only for machine strings**: card numbers, account numbers and references. Use `tabular-nums` for amounts.
5. **No capsule pills.** Show status with `Status` (`components/ui/Status.tsx`): a coloured dot or icon and a plain label, with tones `neutral`, `positive`, `warning`, `danger` and `onBrand`. Show a choice between a few options as a segmented control (see the amount picker in `TransferDemo`).
6. **No filler.** No eyebrow labels above headlines, decorative badges, gradient washes or ornamental dots.
7. **Copy.** Specific headlines, plain sentences, no em dashes.

## App screens

Signed-in screens (app, admin, receipt, bills) sit inside `.app-surface`, which swaps in the app palette: green tinted neutrals and the orange accent. The landing page keeps the neutral palette.

Build every app screen from `components/app/kit.tsx`:

| Part | Use |
| --- | --- |
| `PageHeader` | Large title, one line of context, optional actions |
| `Panel` | Grouped content: 24px corners, hairline border |
| `SectionTitle` | 17px heading with an optional text action |
| `ListRow` | One line in a grouped list: tile, title, detail, trailing |
| `IconTile` | Squircle icon holder in `green`, `orange`, `neutral`, `onBrand` or `solid` |
| `Button` | `primary`, `accent`, `secondary`, `ghost`, `danger`, `onBrand`, `onBrandSolid`; `loading` swaps the icon for a spinner |
| `EmptyState` | Icon, title, one sentence and an optional action |
| `Skeleton` | Shimmering placeholder while data loads |

Choices between a few options use a segmented control with a sliding thumb. Overlays render into `.app-surface` through a portal so they cover the whole window.

# PlannerPro

PlannerPro is a productivity app for student SaaS builders who need to manage product growth work alongside college tasks.

The product direction is to help users plan their academic deadlines and SaaS execution in one focused workflow instead of splitting work across multiple tools.

## Product Focus

- Manage college assignments, deadlines, and study tasks
- Plan SaaS building work such as shipping, marketing, outreach, and growth experiments
- Keep both worlds visible in one dashboard so users can prioritize without burning out

## UI System

The app now uses `shadcn/ui` as the base UI foundation.

- `shadcn/ui` components for reusable primitives
- `next-themes` for `light`, `dark`, and `system` mode
- CSS variable presets for app-level custom themes
- In-app controls for switching mode and color preset

This keeps the design system flexible: mode handles surface contrast, while presets handle brand color direction.

## Current Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
- shadcn/ui
- next-themes

## Installed Packages

- `shadcn`
- `@base-ui/react`
- `class-variance-authority`
- `clsx`
- `tailwind-merge`
- `lucide-react`
- `next-themes`
- `tw-animate-css`

## shadcn Setup

The generated `shadcn` config lives in [components.json](C:\Users\rs329\plannerpro\my-app\components.json).

Current aliases:

- `@/components`
- `@/components/ui`
- `@/lib`
- `@/lib/utils`

Example command to add new components:

```bash
npx shadcn@latest add card input dialog sheet tabs
```

## Theme Architecture

The theme system is split into two layers:

1. Mode layer
   `next-themes` controls `light`, `dark`, and `system` by toggling the `class` attribute.
2. Preset layer
   A separate `data-theme` attribute controls custom product presets such as `ocean`, `sunrise`, and `forest`.

This means you can use combinations like:

- `light + ocean`
- `dark + ocean`
- `light + sunrise`
- `dark + forest`

## Files To Know

- [app/globals.css](C:\Users\rs329\plannerpro\my-app\app\globals.css) contains the base tokens and custom presets
- [components/theme-provider.tsx](C:\Users\rs329\plannerpro\my-app\components\theme-provider.tsx) wraps `next-themes`
- [components/theme-controls.tsx](C:\Users\rs329\plannerpro\my-app\components\theme-controls.tsx) provides the in-app mode/preset switcher
- [components/ui/button.tsx](C:\Users\rs329\plannerpro\my-app\components\ui\button.tsx) is the first installed `shadcn/ui` component

## Adding A Custom Theme

Add a new preset block in [app/globals.css](C:\Users\rs329\plannerpro\my-app\app\globals.css):

```css
[data-theme="midnight"] {
  --primary: oklch(0.56 0.2 275);
  --primary-foreground: oklch(0.98 0.01 275);
  --accent: oklch(0.78 0.08 300);
  --accent-foreground: oklch(0.2 0.02 275);
  --ring: oklch(0.56 0.2 275);
}
```

Then add it to the `presets` array in [components/theme-controls.tsx](C:\Users\rs329\plannerpro\my-app\components\theme-controls.tsx).

Recommended preset variables:

- `--primary`
- `--primary-foreground`
- `--accent`
- `--accent-foreground`
- `--ring`

You can also override more tokens if a theme needs a deeper visual shift:

- `--secondary`
- `--muted`
- `--border`
- `--input`

## Adding More shadcn Components

Use the CLI to install components as needed:

```bash
npx shadcn@latest add accordion alert-dialog avatar badge calendar card checkbox dialog dropdown-menu form input popover select sheet tabs textarea toast
```

Focus first on the components PlannerPro will actually use:

- `card`
- `input`
- `textarea`
- `dialog`
- `sheet`
- `tabs`
- `select`
- `popover`
- `calendar`
- `badge`
- `dropdown-menu`

## Getting Started

Run the development server:

```bash
npm run dev
```

Open `http://localhost:3000` in your browser.

## Notes

The app now has the `shadcn/ui` foundation installed, but only the base button component has been added so far. Add more components incrementally to avoid pulling in unnecessary UI code early.

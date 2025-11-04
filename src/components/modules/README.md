# Module Components Architecture

This directory contains a composable set of components for building brand module UIs.

## Architecture Philosophy

The components follow a **composable primitives** approach:
- Small, focused components that do one thing well
- Easy to understand and maintain
- Flexible enough for various use cases
- No prop drilling hell

## Core Components

### `BlockWrapper`
Container that provides hover interactions, action placement, and optional loading states.

**Props:**
- `children` - Main content
- `actions` - Action buttons/menus (positioned via `actionsPosition`)
- `versionInfo` - Version display (positioned bottom-right)
- `actionsPosition` - `"top-right"` | `"top-left"` | `"bottom"`
- `ctx` - Optional UseBrandModuleResult for automatic loading state
- `showLoadingState` - Whether to show skeleton during generation

**Usage:**
```tsx
<BlockWrapper 
  actions={<ModuleActions ctx={ctx} />}
  ctx={ctx}
  actionsPosition="top-right"
>
  <YourContent />
</BlockWrapper>
```

### `LoadingSkeleton`
Animated skeleton loader for content during generation.

**Props:**
- `lines` - Number of skeleton lines (default: 4)
- `className` - Additional styling

### `VersionSelector`
Dropdown for selecting between module versions, with publish status indicator.

**Props:**
- `ctx` - UseBrandModuleResult
- `variant` - `"default"` | `"compact"`

## Action Components

### `ModuleActions`
Unified action component that can render in two variants: compact dropdown or full-width bar.

**Props:**
- `ctx` - UseBrandModuleResult (required)
- `variant` - `"compact"` | `"full"` (default: `"compact"`)
- `actions` - Array of custom actions
- `onCopy` - Copy handler
- `onDownload` - Download handler  
- `onRegenerate` - Custom regenerate handler (defaults to `ctx.regenerate`)

**Variant: Compact (Default)**
Dropdown menu with three-dot icon. Good for compact layouts.

```tsx
const actions = (
  <ModuleActions
    ctx={ctx}
    variant="compact"
    onCopy={() => navigator.clipboard.writeText(data)}
    onDownload={handleDownload}
  />
);
```

**Variant: Full**
Full-width action bar with inline version selector and action buttons. Good for hero modules.

```tsx
const actions = (
  <ModuleActions
    ctx={ctx}
    variant="full"
    onCopy={handleCopy}
    onDownload={handleDownload}
  />
);
```

## Styling Components

### `ModuleCard`
Simple card container with optional icon + title header. Just styling, no logic.

**Props:**
- `children` - Card content
- `title` - Optional card title
- `icon` - Optional icon emoji/element
- `className` - Additional styling

**Usage:**
```tsx
<ModuleCard title="Tagline" icon="💬">
  <div>{content}</div>
</ModuleCard>
```

## Usage Patterns

**Every module follows the same pattern:**

1. Call `useBrandModule(companyId, moduleType)` to get ctx
2. Wrap with `BlockWrapper` + pass ctx and actions
3. Style your content (with `ModuleCard` or custom)

### Pattern 1: Standard Card Layout

```tsx
export default function ColorsModule({ companyId }: Props) {
  const ctx = useBrandModule(companyId, "colors");

  return (
    <BlockWrapper actions={<ModuleActions ctx={ctx} />} ctx={ctx}>
      <ModuleCard title="Brand Colors" icon="🎨">
        <ColorPalette data={ctx.selected?.data} />
      </ModuleCard>
    </BlockWrapper>
  );
}
```

### Pattern 2: Custom Compact Layout

```tsx
export default function LogoModule({ companyId }: Props) {
  const ctx = useBrandModule(companyId, "logo");

  return (
    <BlockWrapper
      actions={<ModuleActions ctx={ctx} onCopy={handleCopy} />}
      versionInfo={<VersionSelector ctx={ctx} variant="compact" />}
      actionsPosition="top-right"
      ctx={ctx}
    >
      <YourCustomLogoDisplay />
    </BlockWrapper>
  );
}
```

### Pattern 3: Hero/Prominent Layout

```tsx
export default function NamesModule({ companyId }: Props) {
  const ctx = useBrandModule(companyId, "name");

  return (
    <BlockWrapper
      actions={<ModuleActions ctx={ctx} variant="full" onCopy={handleCopy} />}
      ctx={ctx}
    >
      <HeroSection />
    </BlockWrapper>
  );
}
```

## Key Principle: ONE Pattern for Everything

**Before:** Different modules used different approaches (some used ModuleCard with hooks inside, some used BlockWrapper directly)

**After:** ALL modules follow the same pattern:
1. Call `useBrandModule()` at the top
2. Return `<BlockWrapper>` with actions
3. Style content inside (with `ModuleCard` or custom)

This means:
- ✅ Easy to understand any module
- ✅ Easy to add new modules
- ✅ Consistent behavior everywhere
- ✅ No magic or hidden complexity

## Benefits

1. **Simpler** - Fewer props, clearer intent
2. **Smaller** - 471 lines → ~200 lines total across focused files
3. **More flexible** - Compose primitives vs configure monolith
4. **Easier to maintain** - Each component has single responsibility
5. **Better DX** - Clearer what each component does
6. **Type-safe** - All properly typed with TypeScript
7. **Future-proof** - Easy to add new variations without modifying existing ones


# Component Testing Setup

This project uses Playwright component testing with a story gallery pattern. Components are tested in isolation against a small dev server without a dedicated component-testing runtime.

## Quick Start

### Run component tests
```bash
npm run test:component
```

### Run component tests in watch mode
```bash
npm run test:dev  # (runs vitest, not Playwright component tests)
```

For Playwright watch mode, use:
```bash
npx playwright test -c playwright-ct.config.ts --watch
```

### View the gallery
Open your browser to `http://localhost:5173/playwright/gallery/index.html` while the dev server is running:
```bash
npm run dev
```

## How It Works

### Gallery
- Located at `playwright/gallery/` — serves stories at the URL `http://localhost:5173/playwright/gallery/index.html`
- Exposes `window.mount(params)` and `window.unmount()` for Playwright to control
- Automatically discovers all `.story.{ts,js,vue}` files under `src/`
- Includes app plugins: Vuetify, i18n, and Pinia

### Stories
Stories are component scenarios written next to your components:

**Using render functions** (`Button.story.ts`):
```typescript
import { defineComponent, h } from 'vue'
import Button from './Button.vue'

export const Primary = () => h(Button, { variant: 'primary' })
export const Disabled = () => h(Button, { disabled: true })
```

**Using single-file components** (`Button.primary.story.vue`):
```vue
<script setup lang="ts">
import Button from './Button.vue'
</script>

<template>
  <Button variant="primary" />
</template>
```

### Tests
Tests are standard Playwright tests in `tests/components/`:

```typescript
import { test, expect } from '@playwright/test'

test('Button should render with text', async ({ mount }) => {
  const component = await mount('general/Button/Primary')
  await expect(component).toContainText('Click me')
})
```

**Story ID naming:**
- Path under `src/` without `.story.*` extension + export name
- Example: `src/components/general/Button.story.ts` export `Primary` → `general/Button/Primary`

## Testing Patterns

### Callbacks and events
Create state inside the story and record it for assertions:

```typescript
// src/components/Counter.story.ts
export const Stateful = () => {
  const [count, setCount] = useState(0)
  return <>
    <Counter count={count} setCount={setCount} />
    <form hidden><input data-testid="count" readOnly value={String(count)} /></form>
  </>
}
```

```typescript
// tests/components/counter.spec.ts
test('click increments count', async ({ mount }) => {
  const component = await mount('Counter/Stateful')
  await component.locator('button').click()
  await expect(component.getByTestId('count')).toHaveValue('1')
})
```

### Prop transitions with `update()`
Test how components react to prop changes without remounting:

```typescript
const component = await mount('Input/Default', { value: 'Hello' })
await component.update({ value: 'World' })
await expect(component).toContainText('World')
```

### Screenshots
```typescript
await expect(component).toHaveScreenshot('button-primary.png')
```

## File Structure

```
playwright/
  gallery/
    index.html          # Gallery entry point
    main.ts            # Gallery implementation (resolves stories, mounts app)

tests/
  components/          # Component test files (*.spec.ts)
    HighlightMatch.spec.ts

src/
  components/
    general/
      Button.vue
      Button.story.ts  # Stories for Button
      ...
```

## Configuration

- `playwright-ct.config.ts` — Component testing configuration
  - Tests run against `http://localhost:5173/playwright/gallery/index.html`
  - `reuseContext: true` reuses browser context across tests (faster execution)
  - `serviceWorkers: 'block'` prevents service worker caching issues

## Tips

- **Eyeball your stories:** Open the gallery URL in a browser while developing to quickly review all component states
- **Keep stories simple:** Stories should be documentation of component scenarios; if they become complex, consider breaking them into smaller stories
- **Use TypeScript:** Stories can be typed for better prop inference in tests:
  ```typescript
  import type { WithTitle } from './Button.story'
  const component = await mount<typeof WithTitle>('Button/WithTitle', { title: 'Hello' })
  ```
- **Global providers:** For components requiring stores, routes, etc., they are already set up in the gallery (Vuetify, i18n, Pinia)

## References

- [Playwright Component Testing](https://playwright.dev/docs/test-components)
- [Vue Testing Guide](https://vuejs.org/guide/scaling-up/testing.html)

# Lexical Text Staging & Styling Plugin (TextStyleFeature)

This is a premium, custom Lexical Editor Feature plugin built specifically for the PayloadCMS v3 administrator editor window. It provides advanced typographic styling options directly on active text selections.

## Features

This plugin maps directly to four separate and beautifully styled toolbar controls:

1. **Font Size Selector (`FontSizeToolbarItem`)**
   - Renders a clean, mono-spaced dropdown listing common font sizes (from `12px` to `72px`).
   - Seamlessly synchronizes active selection properties back to the toolbar state.
   
2. **Text Color Picker (`TextColorToolbarItem`)**
   - Features a premium, curated grid of 12 modern color presets (harmonized slate, pastel red, teal, blue, and Noe's signature accent color).
   - Equips a full inline HEX text entry panel synced directly with a native color spectrum picker.
   - Clears active background gradients automatically when solid color is applied.

3. **Text Gradient Creator (`TextGradientToolbarItem`)**
   - Applies eye-catching `linear-gradient` overlays on text using standard CSS `background-clip: text` and modern browser transparent text fills.
   - Includes 6 gorgeous preset gradient profiles (Sunset Glow, Neon Dream, Aurora Spirit, Deep Ocean, Gold Luxury, and Cyberpunk).
   - Packs an active custom gradient generator enabling full custom Color-A and Color-B custom selection, with a smooth range degree slider (0° to 360°) that updates real-time background previews.

4. **Style Eraser (`ClearStyleToolbarItem`)**
   - Instant click-to-reset command wiping all inline fonts, standard colors, clip variables, and gradient variables off the active selection.

---

## Technical Stack & API Integration

- **Core Engine**: React.js & Lexical Editor (v0.41.0)
- **Inline Styling**: Leverages the official `@lexical/selection` APIs (`$patchStyleText` & `$getSelectionStyleValueForProperty`) to safely update standard `style` tags on internal Lexical `TextNode` objects.
- **Aesthetic Theme**: Styled in glassmorphism matching PayloadCMS's dark mode palette (`backdrop-blur-xl`, border-white line tokens, micro-transitions, and `lucide-react` graphics).

---

## Setup & Registration

### 1. Server-side registration

Add the `TextStyleFeature()` to the RichText Editor config inside `src/payload.config.ts`:

```typescript
import { TextStyleFeature } from './plugins/textStyle/feature.server'

export default buildConfig({
  // ...
  editor: lexicalEditor({
    features: ({ defaultFeatures }) => [
      ...defaultFeatures,
      TextStyleFeature(), // Registers TextStyle server side
    ],
  }),
})
```

### 2. Static Analysis Bypass (For importMap.js)

To prevent Payload's AST compilation limitation from skipping dynamically loaded client components inside Next.js, add `TextStyleFeatureClient` directly inside the static generator block in `payload.config.ts`:

```typescript
const _dummyForStaticAnalysis = lexicalEditor({
  features: [
    TextStyleFeature(), // Force compiler to catch the client feature path
  ]
})
```

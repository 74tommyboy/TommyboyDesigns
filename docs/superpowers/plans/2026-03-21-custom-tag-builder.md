# Custom Tag Builder Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `/custom` landing page and 5-step inquiry wizard that lets customers configure a custom neck tag (shape, colors, details, uploads, order info) and submit it via Resend email + Supabase record.

**Architecture:** A Next.js server component landing page feeds into a client-side wizard shell that manages all step state in a single `useState` object. On submit, a `POST /api/custom-inquiry` route validates input, uploads-to-storage paths are already stored, generates signed URLs for email, saves to Supabase using a service-role client, and sends a Resend HTML email to the owner. The nav "Custom" link is updated to point to `/custom`.

**Tech Stack:** Next.js 14 (App Router), TypeScript, Tailwind CSS, Supabase (postgres + storage), Resend, `server-only` package, `@supabase/supabase-js` v2

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Create | `supabase/migrations/20260321000000_create_custom_inquiries.sql` | DB table + storage RLS |
| Create | `lib/custom-inquiry-types.ts` | Shared TypeScript types for wizard state and DB record |
| Create | `lib/supabase-admin.ts` | Service-role Supabase client (server-only) |
| Modify | `components/layout/Header.tsx` | Update Custom nav link href |
| Create | `components/custom/ShapeCard.tsx` | SVG shape preview + selectable card |
| Create | `components/custom/ColorSlot.tsx` | Single color picker slot with label + remove |
| Create | `components/custom/StepIndicator.tsx` | 5-step progress indicator |
| Create | `components/custom/WizardNav.tsx` | Back / Next / Submit buttons |
| Create | `app/custom/build/steps/ShapeStep.tsx` | Step 1 — shape selection grid |
| Create | `app/custom/build/steps/ColorsStep.tsx` | Step 2 — up to 4 color slots |
| Create | `app/custom/build/steps/DetailsStep.tsx` | Step 3 — distillery, year, batch, text lines |
| Create | `app/custom/build/steps/UploadsStep.tsx` | Step 4 — drag-and-drop file upload to Supabase Storage |
| Create | `app/custom/build/steps/OrderStep.tsx` | Step 5 — quantity, contact info, submit |
| Create | `app/custom/build/page.tsx` | Wizard shell (client component) |
| Create | `app/custom/build/confirmation/page.tsx` | Success page (server, reads search params) |
| Create | `app/custom/page.tsx` | Landing page (server component) |
| Create | `app/api/custom-inquiry/route.ts` | POST handler — validate, save, email |

---

## Task 1: Install `server-only` and add env vars

**Files:**
- Modify: `package.json` (via npm install)
- Modify: `.env.local` (document new vars — do NOT commit)

- [ ] **Step 1: Install server-only package**

```bash
cd C:/Users/El_Gu/projects/TommyboyDesigns-V2
npm install server-only
```

Expected: `added 1 package` (or similar), no errors.

- [ ] **Step 2: Verify env vars are present**

Open `.env.local` and confirm these three vars exist (add placeholders if not — fill real values from Supabase dashboard before testing):

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

`RESEND_API_KEY` should already be present from the review email feature.

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "feat: install server-only package"
```

---

## Task 2: Supabase migration

**Files:**
- Create: `supabase/migrations/20260321000000_create_custom_inquiries.sql`

- [ ] **Step 1: Create migration file**

```sql
-- supabase/migrations/20260321000000_create_custom_inquiries.sql

-- custom_inquiries table
CREATE TABLE IF NOT EXISTS custom_inquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'new'
    CHECK (status IN ('new', 'in_progress', 'quoted', 'completed')),
  shape text NOT NULL,
  colors jsonb NOT NULL DEFAULT '[]',
  details jsonb NOT NULL DEFAULT '{}',
  uploads text[] NOT NULL DEFAULT '{}',
  quantity integer NOT NULL,
  contact jsonb NOT NULL,
  notes text NOT NULL DEFAULT ''
);

-- Storage bucket (run in Supabase dashboard Storage UI, or via CLI)
-- insert into storage.buckets (id, name, public) values ('custom-inquiry-uploads', 'custom-inquiry-uploads', false);

-- RLS policy: allow anonymous uploads with a folder prefix
CREATE POLICY "anon_upload_custom_inquiries"
ON storage.objects
FOR INSERT TO anon
WITH CHECK (
  bucket_id = 'custom-inquiry-uploads'
  AND (storage.foldername(name))[1] IS NOT NULL
);
```

- [ ] **Step 2: Run migration in Supabase**

Option A (Supabase CLI): `npx supabase db push`
Option B (Dashboard): Copy the SQL into Supabase Dashboard → SQL Editor → Run.

Also create the storage bucket manually in Supabase Dashboard → Storage → New bucket → name: `custom-inquiry-uploads`, Public: OFF.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260321000000_create_custom_inquiries.sql
git commit -m "feat: add custom_inquiries migration and storage RLS"
```

---

## Task 3: Shared types

**Files:**
- Create: `lib/custom-inquiry-types.ts`

- [ ] **Step 1: Write the types file**

```typescript
// lib/custom-inquiry-types.ts

export const SHAPES = [
  { id: 'square',             label: 'Square',            width: 50, height: 50, isCircle: false },
  { id: 'circle',             label: 'Circle',            width: 50, height: 50, isCircle: true  },
  { id: 'rounded_square',     label: 'Rounded Square',    width: 50, height: 50, isCircle: false },
  { id: 'shield',             label: 'Shield',            width: 50, height: 50, isCircle: false },
  { id: 'rounded_rectangle',  label: 'Rounded Rectangle', width: 30, height: 60, isCircle: false },
  { id: 'oblong',             label: 'Oblong',            width: 40, height: 62, isCircle: false },
] as const

export type ShapeId = typeof SHAPES[number]['id']

export interface ColorSlot {
  slot: number      // 1–4
  hex: string       // e.g. '#D97706'
  label: string     // e.g. 'background'
}

export interface TagDetails {
  distillery: string
  year: string
  batchType: 'batch' | 'store_pick'
  batchValue: string
  additionalLines: string[]   // up to 3
}

export interface UploadedFile {
  path: string      // Supabase Storage path, e.g. 'abc123/logo.pdf'
  name: string      // original filename for display
}

export interface OrderInfo {
  quantity: number
  name: string
  email: string
  phone: string
  notes: string
}

export interface WizardState {
  shape: ShapeId | null
  colors: ColorSlot[]
  details: TagDetails
  uploads: UploadedFile[]
  order: OrderInfo
}

// SVG path elements for each shape — drawn in a 100×100 viewBox
// Exported here so ShapeCard and the landing page share one source of truth
export const SHAPE_SVG_PATHS: Record<ShapeId, string> = {
  square:            '<rect x="10" y="10" width="80" height="80" />',
  circle:            '<circle cx="50" cy="50" r="40" />',
  rounded_square:    '<rect x="10" y="10" width="80" height="80" rx="16" ry="16" />',
  shield:            '<path d="M50 8 L88 24 L88 60 Q88 84 50 96 Q12 84 12 60 L12 24 Z" />',
  rounded_rectangle: '<rect x="30" y="10" width="40" height="80" rx="10" ry="10" />',
  oblong:            '<rect x="25" y="11" width="50" height="78" rx="25" ry="25" />',
}
// Note: these are raw SVG strings. Consumers must use dangerouslySetInnerHTML={{ __html: SHAPE_SVG_PATHS[id] }}
// inside an <svg> element, or convert to JSX elements. Either approach is fine — just be consistent.

export const INITIAL_WIZARD_STATE: WizardState = {
  shape: null,
  // Slot 1 pre-populated so ColorsStep never mounts with an empty array
  // (avoids React render-cycle anti-patterns from initializing state inside render)
  colors: [{ slot: 1, hex: '#D97706', label: '' }],
  details: {
    distillery: '',
    year: '',
    batchType: 'batch',
    batchValue: '',
    additionalLines: [],
  },
  uploads: [],
  order: {
    quantity: 1,
    name: '',
    email: '',
    phone: '',
    notes: '',
  },
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add lib/custom-inquiry-types.ts
git commit -m "feat: add custom inquiry shared types"
```

---

## Task 4: Supabase admin client

**Files:**
- Create: `lib/supabase-admin.ts`

- [ ] **Step 1: Write the file**

```typescript
// lib/supabase-admin.ts
import 'server-only'
import { createClient } from '@supabase/supabase-js'

export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add lib/supabase-admin.ts
git commit -m "feat: add supabase admin client"
```

---

## Task 5: Nav fix

**Files:**
- Modify: `components/layout/Header.tsx`

- [ ] **Step 1: Update the Custom link href**

In `components/layout/Header.tsx`, find:
```typescript
{ label: 'Custom', href: '/collections/sip-drip-collection-custom-neck-tags' },
```
Change to:
```typescript
{ label: 'Custom', href: '/custom' },
```

- [ ] **Step 2: Lint check**

```bash
npm run lint
```

Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add components/layout/Header.tsx
git commit -m "fix: update Custom nav link to /custom"
```

---

## Task 6: ShapeCard component

**Files:**
- Create: `components/custom/ShapeCard.tsx`

Each card shows an SVG silhouette scaled proportionally to the tag's real dimensions, plus the shape name and mm dimensions below.

- [ ] **Step 1: Write the component**

```typescript
// components/custom/ShapeCard.tsx
'use client'

import { cn } from '@/lib/utils'
import { SHAPES, ShapeId } from '@/lib/custom-inquiry-types'

interface ShapeCardProps {
  shape: typeof SHAPES[number]
  selected: boolean
  onClick: () => void
}

// SVG paths for each shape — all drawn in a 100×100 viewBox
// Proportions match real tag dimensions (width:height ratio)
const SHAPE_PATHS: Record<ShapeId, React.ReactNode> = {
  square: (
    <rect x="10" y="10" width="80" height="80" />
  ),
  circle: (
    <circle cx="50" cy="50" r="40" />
  ),
  rounded_square: (
    <rect x="10" y="10" width="80" height="80" rx="16" ry="16" />
  ),
  shield: (
    <path d="M50 8 L88 24 L88 60 Q88 84 50 96 Q12 84 12 60 L12 24 Z" />
  ),
  rounded_rectangle: (
    // 30mm wide × 60mm tall → 40px wide × 80px tall centered in 100×100
    <rect x="30" y="10" width="40" height="80" rx="10" ry="10" />
  ),
  oblong: (
    // 40mm × 62mm → roughly 50×78 centered
    <rect x="25" y="11" width="50" height="78" rx="25" ry="25" />
  ),
}

export default function ShapeCard({ shape, selected, onClick }: ShapeCardProps) {
  const dims = shape.isCircle
    ? `${shape.width}mm`
    : `${shape.width}mm × ${shape.height}mm`

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'glass-card p-4 flex flex-col items-center gap-3 transition-all duration-200',
        'hover:border-amber-bourbon/40',
        selected && 'border-amber-bourbon shadow-amber-glow'
      )}
    >
      <svg
        viewBox="0 0 100 100"
        className="w-16 h-16 text-amber-bourbon"
        fill="currentColor"
        aria-hidden="true"
      >
        {SHAPE_PATHS[shape.id]}
      </svg>
      <div className="text-center">
        <p className="text-white text-sm font-medium">{shape.label}</p>
        <p className="text-steel/60 text-xs mt-0.5">{dims}</p>
      </div>
    </button>
  )
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/custom/ShapeCard.tsx
git commit -m "feat: add ShapeCard component"
```

---

## Task 7: ColorSlot component

**Files:**
- Create: `components/custom/ColorSlot.tsx`

- [ ] **Step 1: Write the component**

```typescript
// components/custom/ColorSlot.tsx
'use client'

import { X } from 'lucide-react'
import { ColorSlot as ColorSlotType } from '@/lib/custom-inquiry-types'

interface ColorSlotProps {
  slot: ColorSlotType
  onHexChange: (hex: string) => void
  onLabelChange: (label: string) => void
  onRemove: () => void
  removable: boolean
}

export default function ColorSlot({ slot, onHexChange, onLabelChange, onRemove, removable }: ColorSlotProps) {
  return (
    <div className="glass-card p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-steel/60 text-xs uppercase tracking-wider">Color {slot.slot}</span>
        {removable && (
          <button
            type="button"
            onClick={onRemove}
            className="text-steel/40 hover:text-red-400 transition-colors"
            aria-label="Remove color"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="flex items-center gap-3">
        <div className="relative w-10 h-10 rounded overflow-hidden border border-white/10 flex-shrink-0">
          <input
            type="color"
            value={slot.hex}
            onChange={(e) => onHexChange(e.target.value)}
            className="absolute inset-0 w-full h-full cursor-pointer opacity-0"
            aria-label={`Pick color ${slot.slot}`}
          />
          <div className="w-full h-full" style={{ backgroundColor: slot.hex }} />
        </div>
        <span className="text-steel text-sm font-mono">{slot.hex}</span>
      </div>

      <input
        type="text"
        value={slot.label}
        onChange={(e) => onLabelChange(e.target.value)}
        placeholder="Label (e.g. background)"
        className="w-full bg-navy-800/50 border border-white/10 rounded px-3 py-2 text-sm text-white placeholder:text-steel/40 focus:outline-none focus:border-amber-bourbon/50"
      />
    </div>
  )
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/custom/ColorSlot.tsx
git commit -m "feat: add ColorSlot component"
```

---

## Task 8: StepIndicator and WizardNav components

**Files:**
- Create: `components/custom/StepIndicator.tsx`
- Create: `components/custom/WizardNav.tsx`

- [ ] **Step 1: Write StepIndicator**

```typescript
// components/custom/StepIndicator.tsx
'use client'

import { cn } from '@/lib/utils'

const STEP_LABELS = ['Shape', 'Colors', 'Details', 'Uploads', 'Order']

interface StepIndicatorProps {
  currentStep: number  // 1-based
}

export default function StepIndicator({ currentStep }: StepIndicatorProps) {
  return (
    <div className="flex items-center gap-0 w-full mb-10">
      {STEP_LABELS.map((label, i) => {
        const stepNum = i + 1
        const done = stepNum < currentStep
        const active = stepNum === currentStep
        return (
          <div key={label} className="flex items-center flex-1">
            <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all',
                  done && 'bg-amber-bourbon text-navy-900',
                  active && 'bg-amber-bourbon/20 border border-amber-bourbon text-amber-bourbon',
                  !done && !active && 'bg-navy-800 border border-white/10 text-steel/40'
                )}
              >
                {done ? '✓' : stepNum}
              </div>
              <span
                className={cn(
                  'text-[10px] uppercase tracking-wider hidden sm:block',
                  active ? 'text-amber-bourbon' : 'text-steel/40'
                )}
              >
                {label}
              </span>
            </div>
            {i < STEP_LABELS.length - 1 && (
              <div
                className={cn(
                  'h-px flex-1 mx-2 transition-all',
                  done ? 'bg-amber-bourbon' : 'bg-white/10'
                )}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 2: Write WizardNav**

```typescript
// components/custom/WizardNav.tsx
'use client'

import { Loader2 } from 'lucide-react'

interface WizardNavProps {
  step: number
  totalSteps: number
  onBack: () => void
  onNext: () => void
  canNext: boolean
  submitting?: boolean
}

export default function WizardNav({ step, totalSteps, onBack, onNext, canNext, submitting }: WizardNavProps) {
  const isLast = step === totalSteps

  return (
    <div className="flex items-center justify-between mt-8 pt-6 border-t border-white/5">
      <button
        type="button"
        onClick={onBack}
        disabled={step === 1}
        className="px-6 py-2.5 text-sm text-steel-light border border-white/10 rounded hover:border-white/30 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
      >
        Back
      </button>

      <button
        type="button"
        onClick={onNext}
        disabled={!canNext || submitting}
        className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
        {isLast ? (submitting ? 'Submitting…' : 'Submit Request') : 'Next'}
      </button>
    </div>
  )
}
```

- [ ] **Step 3: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add components/custom/StepIndicator.tsx components/custom/WizardNav.tsx
git commit -m "feat: add StepIndicator and WizardNav components"
```

---

## Task 9: Wizard Step components

**Files:**
- Create: `app/custom/build/steps/ShapeStep.tsx`
- Create: `app/custom/build/steps/ColorsStep.tsx`
- Create: `app/custom/build/steps/DetailsStep.tsx`
- Create: `app/custom/build/steps/UploadsStep.tsx`
- Create: `app/custom/build/steps/OrderStep.tsx`

- [ ] **Step 1: Write ShapeStep**

```typescript
// app/custom/build/steps/ShapeStep.tsx
'use client'

import ShapeCard from '@/components/custom/ShapeCard'
import { SHAPES, ShapeId } from '@/lib/custom-inquiry-types'

interface ShapeStepProps {
  selected: ShapeId | null
  onChange: (id: ShapeId) => void
}

export default function ShapeStep({ selected, onChange }: ShapeStepProps) {
  return (
    <div>
      <h2 className="font-display text-white text-xl tracking-wider mb-2">CHOOSE YOUR SHAPE</h2>
      <p className="text-steel/60 text-sm mb-6">Select the shape for your custom neck tag.</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {SHAPES.map((shape) => (
          <ShapeCard
            key={shape.id}
            shape={shape}
            selected={selected === shape.id}
            onClick={() => onChange(shape.id)}
          />
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Write ColorsStep**

```typescript
// app/custom/build/steps/ColorsStep.tsx
'use client'

import { Plus } from 'lucide-react'
import ColorSlot from '@/components/custom/ColorSlot'
import { ColorSlot as ColorSlotType } from '@/lib/custom-inquiry-types'

interface ColorsStepProps {
  colors: ColorSlotType[]
  onChange: (colors: ColorSlotType[]) => void
}

const DEFAULT_COLORS = ['#D97706', '#0A0F1E', '#FFFFFF', '#4B5563']

export default function ColorsStep({ colors, onChange }: ColorsStepProps) {
  const addColor = () => {
    if (colors.length >= 4) return
    const next: ColorSlotType = {
      slot: colors.length + 1,
      hex: DEFAULT_COLORS[colors.length] ?? '#000000',
      label: '',
    }
    onChange([...colors, next])
  }

  const updateColor = (index: number, patch: Partial<ColorSlotType>) => {
    onChange(colors.map((c, i) => i === index ? { ...c, ...patch } : c))
  }

  const removeColor = (index: number) => {
    const updated = colors
      .filter((_, i) => i !== index)
      .map((c, i) => ({ ...c, slot: i + 1 }))
    onChange(updated)
  }

  // Note: INITIAL_WIZARD_STATE pre-populates slot 1, so colors.length is never 0 on mount.
  // Do NOT add initialization logic here — it belongs in INITIAL_WIZARD_STATE.

  return (
    <div>
      <h2 className="font-display text-white text-xl tracking-wider mb-2">CHOOSE YOUR COLORS</h2>
      <p className="text-steel/60 text-sm mb-6">Add up to 4 colors. Label each one to help us understand your vision.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        {colors.map((slot, i) => (
          <ColorSlot
            key={slot.slot}
            slot={slot}
            onHexChange={(hex) => updateColor(i, { hex })}
            onLabelChange={(label) => updateColor(i, { label })}
            onRemove={() => removeColor(i)}
            removable={colors.length > 1}
          />
        ))}
      </div>

      {colors.length < 4 && (
        <button
          type="button"
          onClick={addColor}
          className="flex items-center gap-2 text-sm text-amber-bourbon/70 hover:text-amber-bourbon transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add another color
        </button>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Write DetailsStep**

```typescript
// app/custom/build/steps/DetailsStep.tsx
'use client'

import { Plus, X } from 'lucide-react'
import { TagDetails } from '@/lib/custom-inquiry-types'

interface DetailsStepProps {
  details: TagDetails
  onChange: (details: TagDetails) => void
}

const inputCls = 'w-full bg-navy-800/50 border border-white/10 rounded px-3 py-2.5 text-sm text-white placeholder:text-steel/40 focus:outline-none focus:border-amber-bourbon/50'
const labelCls = 'block text-xs uppercase tracking-wider text-steel/60 mb-1.5'

export default function DetailsStep({ details, onChange }: DetailsStepProps) {
  const set = (patch: Partial<TagDetails>) => onChange({ ...details, ...patch })

  const addLine = () => {
    if (details.additionalLines.length >= 3) return
    set({ additionalLines: [...details.additionalLines, ''] })
  }

  const updateLine = (i: number, value: string) => {
    const lines = details.additionalLines.map((l, idx) => idx === i ? value : l)
    set({ additionalLines: lines })
  }

  const removeLine = (i: number) => {
    set({ additionalLines: details.additionalLines.filter((_, idx) => idx !== i) })
  }

  return (
    <div>
      <h2 className="font-display text-white text-xl tracking-wider mb-2">TAG DETAILS</h2>
      <p className="text-steel/60 text-sm mb-6">Tell us what text goes on your tag. Only Distillery is required.</p>

      <div className="space-y-4">
        <div>
          <label className={labelCls}>Distillery <span className="text-amber-bourbon">*</span></label>
          <input
            type="text"
            value={details.distillery}
            onChange={(e) => set({ distillery: e.target.value })}
            placeholder="e.g. Buffalo Trace"
            className={inputCls}
          />
        </div>

        <div>
          <label className={labelCls}>Year</label>
          <input
            type="text"
            value={details.year}
            onChange={(e) => set({ year: e.target.value })}
            placeholder="e.g. 2023"
            className={inputCls}
          />
        </div>

        <div>
          <div className="flex items-center gap-4 mb-2">
            {(['batch', 'store_pick'] as const).map((type) => (
              <label key={type} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="batchType"
                  value={type}
                  checked={details.batchType === type}
                  onChange={() => set({ batchType: type })}
                  className="accent-amber-bourbon"
                />
                <span className="text-sm text-steel-light">
                  {type === 'batch' ? 'Batch' : 'Store Pick'}
                </span>
              </label>
            ))}
          </div>
          <input
            type="text"
            value={details.batchValue}
            onChange={(e) => set({ batchValue: e.target.value })}
            placeholder={details.batchType === 'batch' ? 'e.g. Batch 1' : 'e.g. Total Beverage'}
            className={inputCls}
          />
        </div>

        {details.additionalLines.map((line, i) => (
          <div key={i} className="flex gap-2">
            <div className="flex-1">
              <label className={labelCls}>Additional Line {i + 1}</label>
              <input
                type="text"
                value={line}
                onChange={(e) => updateLine(i, e.target.value)}
                placeholder="Any other text for the tag"
                className={inputCls}
              />
            </div>
            <button
              type="button"
              onClick={() => removeLine(i)}
              className="mt-5 text-steel/40 hover:text-red-400 transition-colors self-start"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}

        {details.additionalLines.length < 3 && (
          <button
            type="button"
            onClick={addLine}
            className="flex items-center gap-2 text-sm text-amber-bourbon/70 hover:text-amber-bourbon transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add a text line
          </button>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Write UploadsStep**

```typescript
// app/custom/build/steps/UploadsStep.tsx
'use client'

import { useRef, useState } from 'react'
import { Upload, X, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'  // use existing anon-key client — do NOT create a second instance
import { UploadedFile } from '@/lib/custom-inquiry-types'

const ACCEPTED = '.png,.jpg,.jpeg,.pdf,.svg,.ai'
const MAX_MB = 10
const MAX_FILES = 5

interface UploadsStepProps {
  uploads: UploadedFile[]
  onChange: (uploads: UploadedFile[]) => void
}

interface UploadProgress {
  id: string        // UUID — avoids name-collision bugs when two files share the same filename
  name: string      // display only
  progress: 'uploading' | 'error'
  error?: string
}

function generateSessionId() {
  return crypto.randomUUID()
}

export default function UploadsStep({ uploads, onChange }: UploadsStepProps) {
  const [progresses, setProgresses] = useState<UploadProgress[]>([])
  const [dragging, setDragging] = useState(false)
  const sessionId = useRef(generateSessionId())
  const inputRef = useRef<HTMLInputElement>(null)

  const uploadFile = async (file: File) => {
    if (uploads.length + progresses.filter(p => p.progress === 'uploading').length >= MAX_FILES) return
    if (file.size > MAX_MB * 1024 * 1024) {
      const id = crypto.randomUUID()
      setProgresses(p => [...p, { id, name: file.name, progress: 'error', error: 'File too large (max 10MB)' }])
      return
    }

    const id = crypto.randomUUID()  // stable key — avoids name-collision bugs with duplicate filenames
    const path = `${sessionId.current}/${Date.now()}-${file.name}`
    setProgresses(p => [...p, { id, name: file.name, progress: 'uploading' }])

    const { error } = await supabase.storage
      .from('custom-inquiry-uploads')
      .upload(path, file)

    if (error) {
      setProgresses(p => p.map(x => x.id === id ? { ...x, progress: 'error', error: error.message } : x))
      return
    }

    setProgresses(p => p.filter(x => x.id !== id))
    onChange([...uploads, { path, name: file.name }])
  }

  const handleFiles = (files: FileList) => {
    Array.from(files).forEach(uploadFile)
  }

  const removeUpload = (path: string) => {
    onChange(uploads.filter(u => u.path !== path))
    // Note: we intentionally leave the file in storage — the API route handles cleanup if needed
  }

  return (
    <div>
      <h2 className="font-display text-white text-xl tracking-wider mb-2">REFERENCE FILES</h2>
      <p className="text-steel/60 text-sm mb-6">
        Optional — upload any reference images, logos, or artwork. Accepted: PNG, JPG, PDF, SVG, AI. Max 10MB each, up to 5 files.
      </p>

      {/* Drop zone */}
      <div
        className={`border-2 border-dashed rounded-lg p-10 text-center transition-colors cursor-pointer ${
          dragging ? 'border-amber-bourbon bg-amber-bourbon/5' : 'border-white/10 hover:border-white/30'
        }`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files) }}
      >
        <Upload className="w-8 h-8 text-steel/40 mx-auto mb-3" />
        <p className="text-steel-light text-sm">Drop files here or <span className="text-amber-bourbon">browse</span></p>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED}
          multiple
          className="hidden"
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
        />
      </div>

      {/* Upload list */}
      {(uploads.length > 0 || progresses.length > 0) && (
        <ul className="mt-4 space-y-2">
          {uploads.map((u) => (
            <li key={u.path} className="flex items-center justify-between glass-card px-4 py-2.5">
              <span className="text-sm text-steel-light truncate">{u.name}</span>
              <button type="button" onClick={() => removeUpload(u.path)} className="text-steel/40 hover:text-red-400 ml-3">
                <X className="w-4 h-4" />
              </button>
            </li>
          ))}
          {progresses.map((p, i) => (
            <li key={i} className="flex items-center gap-3 glass-card px-4 py-2.5">
              {p.progress === 'uploading' && <Loader2 className="w-4 h-4 animate-spin text-amber-bourbon flex-shrink-0" />}
              <span className={`text-sm truncate ${p.progress === 'error' ? 'text-red-400' : 'text-steel/60'}`}>
                {p.name}{p.error ? ` — ${p.error}` : ''}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
```

- [ ] **Step 5: Write OrderStep**

```typescript
// app/custom/build/steps/OrderStep.tsx
'use client'

import { OrderInfo } from '@/lib/custom-inquiry-types'

interface OrderStepProps {
  order: OrderInfo
  onChange: (order: OrderInfo) => void
}

const inputCls = 'w-full bg-navy-800/50 border border-white/10 rounded px-3 py-2.5 text-sm text-white placeholder:text-steel/40 focus:outline-none focus:border-amber-bourbon/50'
const labelCls = 'block text-xs uppercase tracking-wider text-steel/60 mb-1.5'

export default function OrderStep({ order, onChange }: OrderStepProps) {
  const set = (patch: Partial<OrderInfo>) => onChange({ ...order, ...patch })

  return (
    <div>
      <h2 className="font-display text-white text-xl tracking-wider mb-2">ORDER DETAILS</h2>
      <p className="text-steel/60 text-sm mb-6">Almost done — let us know how many tags you need and how to reach you.</p>

      <div className="space-y-4">
        <div>
          <label className={labelCls}>Quantity <span className="text-amber-bourbon">*</span></label>
          <input
            type="number"
            min={1}
            value={order.quantity}
            onChange={(e) => set({ quantity: Math.max(1, parseInt(e.target.value) || 1) })}
            className={inputCls}
          />
        </div>

        <div>
          <label className={labelCls}>Your Name <span className="text-amber-bourbon">*</span></label>
          <input
            type="text"
            value={order.name}
            onChange={(e) => set({ name: e.target.value })}
            placeholder="Full name"
            className={inputCls}
          />
        </div>

        <div>
          <label className={labelCls}>Email <span className="text-amber-bourbon">*</span></label>
          <input
            type="email"
            value={order.email}
            onChange={(e) => set({ email: e.target.value })}
            placeholder="you@example.com"
            className={inputCls}
          />
        </div>

        <div>
          <label className={labelCls}>Phone</label>
          <input
            type="tel"
            value={order.phone}
            onChange={(e) => set({ phone: e.target.value })}
            placeholder="Optional"
            className={inputCls}
          />
        </div>

        <div>
          <label className={labelCls}>Additional Notes</label>
          <textarea
            value={order.notes}
            onChange={(e) => set({ notes: e.target.value })}
            placeholder="Any other details, special requests, or questions…"
            rows={4}
            className={`${inputCls} resize-none`}
          />
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 6: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add app/custom/build/steps/
git commit -m "feat: add wizard step components (Shape, Colors, Details, Uploads, Order)"
```

---

## Task 10: Wizard shell

**Files:**
- Create: `app/custom/build/page.tsx`

- [ ] **Step 1: Write the wizard shell**

```typescript
// app/custom/build/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import StepIndicator from '@/components/custom/StepIndicator'
import WizardNav from '@/components/custom/WizardNav'
import ShapeStep from './steps/ShapeStep'
import ColorsStep from './steps/ColorsStep'
import DetailsStep from './steps/DetailsStep'
import UploadsStep from './steps/UploadsStep'
import OrderStep from './steps/OrderStep'
import { INITIAL_WIZARD_STATE, WizardState } from '@/lib/custom-inquiry-types'

const TOTAL_STEPS = 5

export default function BuildPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [state, setState] = useState<WizardState>(INITIAL_WIZARD_STATE)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const update = (patch: Partial<WizardState>) => setState(s => ({ ...s, ...patch }))

  const canNext: boolean = (() => {
    if (step === 1) return state.shape !== null
    if (step === 2) return state.colors.length > 0
    if (step === 3) return state.details.distillery.trim().length > 0
    if (step === 4) return true  // uploads are optional
    if (step === 5) return (
      state.order.quantity >= 1 &&
      state.order.name.trim().length > 0 &&
      state.order.email.trim().length > 0
    )
    return false
  })()

  const handleNext = async () => {
    if (step < TOTAL_STEPS) {
      setStep(s => s + 1)
      return
    }
    // Step 5: submit
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/custom-inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(state),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Submission failed')
      }
      const params = new URLSearchParams({
        shape: state.shape ?? '',
        qty: String(state.order.quantity),
        distillery: state.details.distillery,
      })
      router.push(`/custom/build/confirmation?${params.toString()}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
      setSubmitting(false)
    }
  }

  return (
    <div className="pt-28 pb-24 min-h-dvh">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="section-label mb-2">Custom Tag Builder</div>
          <h1 className="font-display text-white text-3xl tracking-wider">DESIGN YOUR TAG</h1>
        </div>

        <StepIndicator currentStep={step} />

        <div className="glass-card p-8">
          {step === 1 && <ShapeStep selected={state.shape} onChange={(shape) => update({ shape })} />}
          {step === 2 && <ColorsStep colors={state.colors} onChange={(colors) => update({ colors })} />}
          {step === 3 && <DetailsStep details={state.details} onChange={(details) => update({ details })} />}
          {step === 4 && <UploadsStep uploads={state.uploads} onChange={(uploads) => update({ uploads })} />}
          {step === 5 && <OrderStep order={state.order} onChange={(order) => update({ order })} />}

          {error && (
            <p className="mt-4 text-red-400 text-sm">{error}</p>
          )}

          <WizardNav
            step={step}
            totalSteps={TOTAL_STEPS}
            onBack={() => setStep(s => Math.max(1, s - 1))}
            onNext={handleNext}
            canNext={canNext}
            submitting={submitting}
          />
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/custom/build/page.tsx
git commit -m "feat: add wizard shell"
```

---

## Task 11: Confirmation page

**Files:**
- Create: `app/custom/build/confirmation/page.tsx`

- [ ] **Step 1: Write the confirmation page**

```typescript
// app/custom/build/confirmation/page.tsx
import Link from 'next/link'
import { CheckCircle } from 'lucide-react'
import { SHAPES } from '@/lib/custom-inquiry-types'

interface Props {
  searchParams: { shape?: string; qty?: string; distillery?: string }
}

export default function ConfirmationPage({ searchParams }: Props) {
  const shapeData = SHAPES.find(s => s.id === searchParams.shape)
  const qty = searchParams.qty ? parseInt(searchParams.qty) : null
  const distillery = searchParams.distillery ?? ''

  return (
    <div className="pt-28 pb-24 min-h-dvh flex items-center">
      <div className="max-w-lg mx-auto px-4 sm:px-6 text-center">
        <CheckCircle className="w-16 h-16 text-amber-bourbon mx-auto mb-6" />
        <div className="section-label mb-3">Request Received</div>
        <h1 className="font-display text-white text-3xl tracking-wider mb-4">WE'VE GOT YOUR ORDER</h1>
        <p className="text-steel-light leading-relaxed mb-8">
          We'll be in touch within 2 business days with a quote and any follow-up questions.
        </p>

        {(shapeData || qty || distillery) && (
          <div className="glass-card p-6 text-left mb-8 space-y-3">
            <p className="text-xs uppercase tracking-wider text-steel/60 mb-4">Your Request Summary</p>
            {shapeData && (
              <div className="flex justify-between text-sm">
                <span className="text-steel/60">Shape</span>
                <span className="text-white">{shapeData.label}</span>
              </div>
            )}
            {distillery && (
              <div className="flex justify-between text-sm">
                <span className="text-steel/60">Distillery</span>
                <span className="text-white">{distillery}</span>
              </div>
            )}
            {qty && (
              <div className="flex justify-between text-sm">
                <span className="text-steel/60">Quantity</span>
                <span className="text-white">{qty}</span>
              </div>
            )}
          </div>
        )}

        <Link href="/shop" className="btn-primary">
          Back to Shop
        </Link>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/custom/build/confirmation/page.tsx
git commit -m "feat: add confirmation page"
```

---

## Task 12: API route

**Files:**
- Create: `app/api/custom-inquiry/route.ts`

The route uses the existing Resend + Supabase pattern from `app/api/cron/send-review-emails/route.ts`. Study that file for HTML email style conventions before writing.

- [ ] **Step 1: Write the API route**

```typescript
// app/api/custom-inquiry/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { WizardState, SHAPES } from '@/lib/custom-inquiry-types'

export const dynamic = 'force-dynamic'

const resend = new Resend(process.env.RESEND_API_KEY)
const OWNER_EMAIL = 'thomas@tommyboydesigns.com'  // update to real owner email

export async function POST(req: NextRequest) {
  let body: WizardState
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { shape, colors, details, uploads, order } = body

  // Validate required fields
  if (!shape || !order?.quantity || !order?.name?.trim() || !order?.email?.trim()) {
    return NextResponse.json({ error: 'Missing required fields: shape, quantity, name, email' }, { status: 400 })
  }

  // Generate signed URLs for uploads (1-hour expiry, email only)
  const signedUrls: string[] = []
  for (const upload of uploads ?? []) {
    const { data } = await supabaseAdmin.storage
      .from('custom-inquiry-uploads')
      .createSignedUrl(upload.path, 3600)
    if (data?.signedUrl) signedUrls.push(data.signedUrl)
  }

  const shapeData = SHAPES.find(s => s.id === shape)

  // Run DB insert and email in parallel
  const [dbResult, emailResult] = await Promise.allSettled([
    supabaseAdmin.from('custom_inquiries').insert({
      shape,
      colors: colors ?? [],
      details: details ?? {},
      uploads: (uploads ?? []).map(u => u.path),
      quantity: order.quantity,
      contact: { name: order.name, email: order.email, phone: order.phone },
      notes: order.notes ?? '',
    }),
    resend.emails.send({
      from: 'TommyboyDesigns <orders@tommyboydesigns.com>',
      to: OWNER_EMAIL,
      subject: `New Custom Tag Inquiry — ${details?.distillery ?? 'Unknown'} (${order.name})`,
      html: buildEmailHtml(body, shapeData, signedUrls),
    }),
  ])

  if (dbResult.status === 'rejected') {
    console.error('Supabase insert failed:', dbResult.reason)
    return NextResponse.json({ error: 'Failed to save inquiry' }, { status: 500 })
  }

  if (emailResult.status === 'rejected') {
    console.error('Resend failed:', emailResult.reason)
    // Non-fatal — inquiry is saved in Supabase. KNOWN GAP: the owner will not know the
    // email failed unless they check server logs or Supabase Studio. Future improvement:
    // set a flag (e.g. email_sent: false) on the DB row so a dashboard can surface failures.
  }

  return NextResponse.json({ ok: true })
}

function buildEmailHtml(
  state: WizardState,
  shapeData: typeof SHAPES[number] | undefined,
  signedUrls: string[]
): string {
  const { shape, colors, details, uploads, order } = state

  const dims = shapeData
    ? (shapeData.isCircle ? `${shapeData.width}mm` : `${shapeData.width}mm × ${shapeData.height}mm`)
    : ''

  const colorSwatches = (colors ?? []).map(c =>
    `<span style="display:inline-flex;align-items:center;gap:6px;margin-right:12px;">
      <span style="display:inline-block;width:16px;height:16px;background:${c.hex};border-radius:3px;border:1px solid rgba(255,255,255,0.2);"></span>
      <span style="color:#D1D5DB;font-size:13px;">${c.hex}${c.label ? ` (${c.label})` : ''}</span>
    </span>`
  ).join('')

  const fileLinks = signedUrls.length > 0
    ? signedUrls.map((url, i) => `<li><a href="${url}" style="color:#D97706;">${uploads[i]?.name ?? `File ${i + 1}`}</a> (expires in 1 hour)</li>`).join('')
    : '<li style="color:#6B7280;">No files attached</li>'

  const additionalLines = (details?.additionalLines ?? []).filter(Boolean)

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#0A0F1E;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0A0F1E;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
        <tr><td style="padding-bottom:24px;">
          <p style="margin:0;color:#D97706;font-size:11px;letter-spacing:4px;text-transform:uppercase;">TOMMYBOY DESIGNS</p>
          <p style="margin:4px 0 0;color:#6B7280;font-size:10px;">New Custom Inquiry</p>
        </td></tr>
        <tr><td style="background:#111827;border:1px solid rgba(217,119,6,0.2);border-radius:8px;padding:36px;">

          <p style="margin:0 0 20px;color:#D97706;font-size:13px;letter-spacing:3px;text-transform:uppercase;">Inquiry from ${order.name}</p>

          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
            <tr>
              <td style="color:#9CA3AF;font-size:12px;text-transform:uppercase;letter-spacing:2px;padding-bottom:8px;" width="140">Shape</td>
              <td style="color:#D1D5DB;font-size:14px;padding-bottom:8px;">${shapeData?.label ?? shape} ${dims ? `— ${dims}` : ''}</td>
            </tr>
            <tr>
              <td style="color:#9CA3AF;font-size:12px;text-transform:uppercase;letter-spacing:2px;padding-bottom:8px;">Colors</td>
              <td style="padding-bottom:8px;">${colorSwatches || '<span style="color:#6B7280;">None specified</span>'}</td>
            </tr>
            <tr>
              <td style="color:#9CA3AF;font-size:12px;text-transform:uppercase;letter-spacing:2px;padding-bottom:8px;">Distillery</td>
              <td style="color:#D1D5DB;font-size:14px;padding-bottom:8px;">${details?.distillery ?? '—'}</td>
            </tr>
            ${details?.year ? `<tr><td style="color:#9CA3AF;font-size:12px;text-transform:uppercase;letter-spacing:2px;padding-bottom:8px;">Year</td><td style="color:#D1D5DB;font-size:14px;padding-bottom:8px;">${details.year}</td></tr>` : ''}
            ${details?.batchValue ? `<tr><td style="color:#9CA3AF;font-size:12px;text-transform:uppercase;letter-spacing:2px;padding-bottom:8px;">${details.batchType === 'store_pick' ? 'Store Pick' : 'Batch'}</td><td style="color:#D1D5DB;font-size:14px;padding-bottom:8px;">${details.batchValue}</td></tr>` : ''}
            ${additionalLines.length > 0 ? `<tr><td style="color:#9CA3AF;font-size:12px;text-transform:uppercase;letter-spacing:2px;padding-bottom:8px;">Extra Text</td><td style="color:#D1D5DB;font-size:14px;padding-bottom:8px;">${additionalLines.join('<br>')}</td></tr>` : ''}
            <tr>
              <td style="color:#9CA3AF;font-size:12px;text-transform:uppercase;letter-spacing:2px;padding-bottom:8px;">Quantity</td>
              <td style="color:#D1D5DB;font-size:14px;padding-bottom:8px;">${order.quantity}</td>
            </tr>
          </table>

          <p style="margin:0 0 8px;color:#9CA3AF;font-size:12px;text-transform:uppercase;letter-spacing:2px;">Reference Files</p>
          <ul style="margin:0 0 24px;padding-left:20px;color:#D1D5DB;font-size:14px;line-height:2;">${fileLinks}</ul>

          <p style="margin:0 0 8px;color:#9CA3AF;font-size:12px;text-transform:uppercase;letter-spacing:2px;">Contact</p>
          <p style="margin:0 0 4px;color:#D1D5DB;font-size:14px;">${order.name}</p>
          <p style="margin:0 0 4px;color:#D97706;font-size:14px;"><a href="mailto:${order.email}" style="color:#D97706;">${order.email}</a></p>
          ${order.phone ? `<p style="margin:0 0 4px;color:#D1D5DB;font-size:14px;">${order.phone}</p>` : ''}
          ${order.notes ? `<p style="margin:16px 0 0;color:#9CA3AF;font-size:13px;border-top:1px solid rgba(255,255,255,0.05);padding-top:16px;">${order.notes}</p>` : ''}

        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`.trim()
}
```

- [ ] **Step 2: Update OWNER_EMAIL**

Replace `thomas@tommyboydesigns.com` with the real owner email before deploying. Check what email address is used in `app/api/cron/send-review-emails/route.ts` as a reference (`from` field).

- [ ] **Step 3: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Smoke-test the API with curl (after `npm run dev`)**

```bash
curl -X POST http://localhost:3000/api/custom-inquiry \
  -H "Content-Type: application/json" \
  -d '{
    "shape": "shield",
    "colors": [{"slot":1,"hex":"#D97706","label":"background"}],
    "details": {"distillery":"Buffalo Trace","year":"2022","batchType":"batch","batchValue":"","additionalLines":[]},
    "uploads": [],
    "order": {"quantity":10,"name":"Test User","email":"test@example.com","phone":"","notes":""}
  }'
```

Expected: `{"ok":true}`

- [ ] **Step 5: Commit**

```bash
git add app/api/custom-inquiry/route.ts
git commit -m "feat: add custom inquiry API route"
```

---

## Task 13: Landing page

**Files:**
- Create: `app/custom/page.tsx`

This page reuses the product card pattern from `app/collections/[handle]/page.tsx`. Study that file before writing. It uses `getProducts()` from `lib/shopify.ts` filtered by the `custom` tag.

- [ ] **Step 1: Write the landing page**

```typescript
// app/custom/page.tsx
import { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { getProducts, formatMoney } from '@/lib/shopify'
import { SHAPES } from '@/lib/custom-inquiry-types'

export const metadata: Metadata = {
  title: 'Custom Neck Tags | TommyboyDesigns',
  description: 'Design a fully custom bourbon neck tag — choose your shape, colors, and text. Veteran owned & operated.',
}

export const dynamic = 'force-dynamic'

// SVG silhouettes for the shape preview grid (same paths as ShapeCard)
const SHAPE_PREVIEW_PATHS: Record<string, React.ReactNode> = {
  square:             <rect x="10" y="10" width="80" height="80" />,
  circle:             <circle cx="50" cy="50" r="40" />,
  rounded_square:     <rect x="10" y="10" width="80" height="80" rx="16" ry="16" />,
  shield:             <path d="M50 8 L88 24 L88 60 Q88 84 50 96 Q12 84 12 60 L12 24 Z" />,
  rounded_rectangle:  <rect x="30" y="10" width="40" height="80" rx="10" ry="10" />,
  oblong:             <rect x="25" y="11" width="50" height="78" rx="25" ry="25" />,
}

export default async function CustomPage() {
  const allProducts = await getProducts(250)
  const customProducts = allProducts.filter(p => p.tags.includes('custom'))

  return (
    <div className="pt-28 pb-24 min-h-dvh">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Hero */}
        <div className="relative glass-card overflow-hidden mb-16 p-8 lg:p-16 text-center">
          <div className="absolute top-0 inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-amber-bourbon to-transparent" />
          <div className="section-label mb-4">Custom Tags</div>
          <h1 className="section-title text-[clamp(2.5rem,6vw,5rem)] mb-4">DESIGN YOUR TAG</h1>
          <p className="text-steel-light max-w-2xl mx-auto leading-relaxed mb-10">
            Every bottle tells a story. We'll help you tell yours — fully custom neck tags with your shape, colors, and text, handcrafted by a veteran-owned small business.
          </p>
          <Link href="/custom/build" className="btn-primary text-base px-8 py-3">
            Start Building
          </Link>
        </div>

        {/* Shape preview grid */}
        <div className="mb-16">
          <h2 className="font-display text-white text-2xl tracking-wider text-center mb-2">AVAILABLE SHAPES</h2>
          <p className="text-steel/60 text-sm text-center mb-8">Choose from 6 precision-cut tag shapes.</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {SHAPES.map(shape => {
              const dims = shape.isCircle ? `${shape.width}mm` : `${shape.width}mm × ${shape.height}mm`
              return (
                <div key={shape.id} className="glass-card p-4 flex flex-col items-center gap-3">
                  <svg viewBox="0 0 100 100" className="w-12 h-12 text-amber-bourbon" fill="currentColor" aria-hidden="true">
                    {SHAPE_PREVIEW_PATHS[shape.id]}
                  </svg>
                  <div className="text-center">
                    <p className="text-white text-xs font-medium">{shape.label}</p>
                    <p className="text-steel/50 text-xs">{dims}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Existing custom products */}
        {customProducts.length > 0 && (
          <div>
            <h2 className="font-display text-white text-2xl tracking-wider mb-2">EXISTING CUSTOM DESIGNS</h2>
            <p className="text-steel/60 text-sm mb-8">Browse past custom work for inspiration — or order one as-is.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {customProducts.map(product => {
                const image = product.images.edges[0]?.node
                const price = product.priceRange.minVariantPrice
                const compareAt = product.compareAtPriceRange?.minVariantPrice
                const hasDiscount = compareAt && parseFloat(compareAt.amount) > parseFloat(price.amount)
                return (
                  <Link
                    key={product.id}
                    href={`/products/${product.handle}`}
                    className="group glass-card overflow-hidden hover:border-amber-bourbon/30 transition-all duration-300 hover:shadow-amber-glow"
                  >
                    <div className="relative aspect-square overflow-hidden bg-navy-700">
                      {image ? (
                        <Image
                          src={image.url}
                          alt={image.altText ?? product.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="font-display text-amber-bourbon/30 text-4xl">TBD</div>
                        </div>
                      )}
                      {hasDiscount && (
                        <div className="absolute top-3 left-3">
                          <span className="bg-amber-bourbon text-navy-900 text-xs font-bold px-2 py-0.5 rounded uppercase tracking-wide">Sale</span>
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="text-white text-sm font-medium group-hover:text-amber-bourbon transition-colors line-clamp-2 mb-2">
                        {product.title}
                      </h3>
                      <div className="flex items-center gap-2">
                        <span className="text-amber-bourbon font-semibold text-sm">
                          {formatMoney(price.amount, price.currencyCode)}
                        </span>
                        {hasDiscount && (
                          <span className="text-steel/50 text-xs line-through">
                            {formatMoney(compareAt.amount, compareAt.currencyCode)}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
```

- [ ] **Step 2: Type-check and lint**

```bash
npx tsc --noEmit && npm run lint
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/custom/page.tsx
git commit -m "feat: add /custom landing page"
```

---

## Task 14: End-to-end browser smoke test

No automated E2E framework is set up. Run `npm run dev` and manually verify:

- [ ] **Step 1: Nav link**
  - Click "Custom" in the header → lands on `/custom`
  - Verify shape grid appears and "Start Building" button is present

- [ ] **Step 2: Wizard flow**
  - Click "Start Building" → `/custom/build`
  - Step 1: Click a shape card → Next button enables → click Next
  - Step 2: Verify color slot 1 is pre-populated, add a color, remove it → Next
  - Step 3: Leave distillery blank → Next should be disabled. Fill it in → Next enables
  - Step 4: Drop a small PNG → progress indicator appears → file listed → Next
  - Step 5: Fill in name, email, quantity → Submit → spinner shows → redirect to `/custom/build/confirmation`

- [ ] **Step 3: Confirmation page**
  - Shape, distillery, and quantity appear in the summary
  - "Back to Shop" link works

- [ ] **Step 4: Verify Supabase record**
  - Open Supabase Dashboard → Table Editor → `custom_inquiries`
  - Confirm a new row exists with correct data

- [ ] **Step 5: Verify email**
  - Check owner inbox for the Resend notification
  - Confirm upload links are clickable (within 1 hour)

- [ ] **Step 6: Final commit**

```bash
git add .
git commit -m "feat: complete custom tag builder"
```

---

## Environment Checklist (before deploying to production)

- [ ] `NEXT_PUBLIC_SUPABASE_URL` set in Vercel / hosting env
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` set
- [ ] `SUPABASE_SERVICE_ROLE_KEY` set (server-only, not prefixed with `NEXT_PUBLIC_`)
- [ ] `RESEND_API_KEY` set (already present)
- [ ] Supabase migration run against production DB
- [ ] `custom-inquiry-uploads` storage bucket created in production Supabase project
- [ ] Storage RLS policy applied in production
- [ ] `OWNER_EMAIL` in `app/api/custom-inquiry/route.ts` updated to real address
- [ ] "2 business days" copy in confirmation page confirmed with owner

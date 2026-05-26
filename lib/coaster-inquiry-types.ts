// lib/coaster-inquiry-types.ts
import { ColorSlot, UploadedFile } from '@/lib/custom-inquiry-types'

export type { ColorSlot, UploadedFile }

export const COASTER_SHAPES = [
  { id: 'round',  label: 'Round'  },
  { id: 'square', label: 'Square' },
  { id: 'other',  label: 'Other'  },
] as const

export type CoasterShapeId = typeof COASTER_SHAPES[number]['id']

export const COASTER_SHAPE_SVG_PATHS: Record<CoasterShapeId, string> = {
  round:  '<circle cx="50" cy="50" r="40" />',
  square: '<rect x="10" y="10" width="80" height="80" />',
  other:  '<text x="50" y="58" text-anchor="middle" font-size="36" font-family="sans-serif">?</text>',
}

export interface CoasterOrderInfo {
  quantity: number
  name: string
  email: string
  phone: string
  notes: string
}

export interface CoasterWizardState {
  shape: CoasterShapeId | null
  otherShapeDescription: string
  colors: ColorSlot[]
  uploads: UploadedFile[]
  order: CoasterOrderInfo
}

export const INITIAL_COASTER_STATE: CoasterWizardState = {
  shape: null,
  otherShapeDescription: '',
  colors: [{ slot: 1, hex: '#D97706', name: '', label: '' }],
  uploads: [],
  order: {
    quantity: 1,
    name: '',
    email: '',
    phone: '',
    notes: '',
  },
}

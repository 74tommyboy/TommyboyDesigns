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
  slot: number
  hex: string
  label: string
}

export interface TagDetails {
  distillery: string
  year: string
  batchType: 'batch' | 'store_pick'
  batchValue: string
  additionalLines: string[]
}

export interface UploadedFile {
  path: string
  name: string
}

export interface OrderInfo {
  attachment: 'hemp_twine' | 'bead_chain'
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

export const INITIAL_WIZARD_STATE: WizardState = {
  shape: null,
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
    attachment: 'hemp_twine',
    quantity: 1,
    name: '',
    email: '',
    phone: '',
    notes: '',
  },
}

// SVG path strings for each shape — drawn in a 100×100 viewBox.
// Use with dangerouslySetInnerHTML inside an <svg> element.
export const SHAPE_SVG_PATHS: Record<ShapeId, string> = {
  square:            '<rect x="10" y="10" width="80" height="80" />',
  circle:            '<circle cx="50" cy="50" r="40" />',
  rounded_square:    '<rect x="10" y="10" width="80" height="80" rx="16" ry="16" />',
  shield:            '<path d="M50 8 L88 24 L88 60 Q88 84 50 96 Q12 84 12 60 L12 24 Z" />',
  rounded_rectangle: '<rect x="30" y="10" width="40" height="80" rx="10" ry="10" />',
  oblong:            '<rect x="25" y="11" width="50" height="78" rx="25" ry="25" />',
}

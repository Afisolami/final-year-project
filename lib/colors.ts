import { getCurrentTimeWindow } from './tokens'

const COLOR_SEQUENCE = [
  { name: 'Black',  hex: '#1a1a1a', text: '#ffffff' },
  { name: 'Red',    hex: '#dc2626', text: '#ffffff' },
  { name: 'Blue',   hex: '#2563eb', text: '#ffffff' },
  { name: 'Green',  hex: '#16a34a', text: '#ffffff' },
  { name: 'Purple', hex: '#9333ea', text: '#ffffff' },
  { name: 'Orange', hex: '#ea580c', text: '#ffffff' },
  { name: 'Brown',  hex: '#92400e', text: '#ffffff' },
] as const

export type ColorEntry = typeof COLOR_SEQUENCE[number]

export function getColorForWindow(timeWindow: number): ColorEntry {
  return COLOR_SEQUENCE[timeWindow % COLOR_SEQUENCE.length]
}

export function getCurrentColor(): ColorEntry {
  return getColorForWindow(getCurrentTimeWindow())
}

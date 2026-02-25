export interface Session {
  id: string
  lecture_name: string
  duration_minutes: number
  started_at: string
  ends_at: string
  expires_at: string
  status: 'active' | 'ended'
  secret: string
  created_at: string
}

export interface Attendee {
  id: string
  session_id: string
  full_name: string
  matric_number: string
  level: '100L' | '200L' | '300L' | '400L' | '500L' | 'Postgraduate'
  device_id: string
  submitted_at: string
}

export interface QRData {
  status: 'active' | 'ended'
  token: string
  color: string
  color_hex: string
  text_color: string
  qr_url: string
  window_expires_in_ms: number
}

export type Level = '100L' | '200L' | '300L' | '400L' | '500L' | 'Postgraduate'

export const LEVELS: Level[] = ['100L', '200L', '300L', '400L', '500L', 'Postgraduate']

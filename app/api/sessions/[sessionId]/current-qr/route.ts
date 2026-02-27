import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { generateToken, getWindowExpiresInMs, getCurrentTimeWindow } from '@/lib/tokens'
import { getColorForWindow } from '@/lib/colors'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const supabase = createServerClient()
  const { sessionId } = await params

  const { data: session, error } = await supabase
    .from('sessions')
    .select('id, secret, status, ends_at, expires_at')
    .eq('id', sessionId)
    .single()

  if (error || !session) {
    return NextResponse.json({ error: 'session_not_found' }, { status: 404 })
  }

  if (new Date(session.expires_at) < new Date()) {
    return NextResponse.json({ error: 'session_expired' }, { status: 410 })
  }

  // Auto-mark ended if time has passed
  if (session.status === 'active' && new Date(session.ends_at) < new Date()) {
    await supabase.from('sessions').update({ status: 'ended' }).eq('id', sessionId)
    return NextResponse.json({ status: 'ended' })
  }

  if (session.status === 'ended') {
    return NextResponse.json({ status: 'ended' })
  }

  const timeWindow = getCurrentTimeWindow()
  const token = generateToken(session.id, session.secret, 0)
  const color = getColorForWindow(timeWindow)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  return NextResponse.json({
    status: 'active',
    token,
    color: color.name,
    color_hex: color.hex,
    text_color: color.text,
    qr_url: `${appUrl}/attend/${sessionId}?t=${token}`,
    window_expires_in_ms: getWindowExpiresInMs(),
  })
}

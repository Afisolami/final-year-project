import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const supabase = createServerClient()
  const { sessionId } = await params

  const { data: session, error } = await supabase
    .from('sessions')
    .select('id, lecture_name, duration_minutes, started_at, ends_at, expires_at, status')
    .eq('id', sessionId)
    .single()

  if (error || !session) {
    return NextResponse.json({ error: 'session_not_found' }, { status: 404 })
  }

  // 24-hour retention window has passed
  if (new Date(session.expires_at) < new Date()) {
    return NextResponse.json({ error: 'session_expired' }, { status: 410 })
  }

  // Session time ran out — auto-mark as ended
  if (session.status === 'active' && new Date(session.ends_at) < new Date()) {
    await supabase
      .from('sessions')
      .update({ status: 'ended' })
      .eq('id', sessionId)
    session.status = 'ended'
  }

  return NextResponse.json(session)
}

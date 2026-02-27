import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const supabase = createServerClient()
  const { sessionId } = await params

  const { data: session, error: sessionError } = await supabase
    .from('sessions')
    .select('id, expires_at')
    .eq('id', sessionId)
    .single()

  if (sessionError || !session) {
    return NextResponse.json({ error: 'session_not_found' }, { status: 404 })
  }

  if (new Date(session.expires_at) < new Date()) {
    return NextResponse.json({ error: 'session_expired' }, { status: 410 })
  }

  const { data: attendees, error } = await supabase
    .from('attendees')
    .select('id, full_name, matric_number, level, submitted_at')
    .eq('session_id', sessionId)
    .order('submitted_at', { ascending: true })

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch attendees' }, { status: 500 })
  }

  return NextResponse.json({
    attendees: attendees ?? [],
    total: attendees?.length ?? 0,
  })
}

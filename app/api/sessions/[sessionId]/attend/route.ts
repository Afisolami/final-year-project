import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { validateToken } from '@/lib/tokens'
import { LEVELS } from '@/types'

export async function POST(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const { sessionId } = params
    const body = await request.json()
    const { token, full_name, matric_number, level, device_id } = body

    // Validate all required fields are present
    if (!token || !full_name || !matric_number || !level || !device_id) {
      return NextResponse.json({ error: 'missing_fields' }, { status: 400 })
    }

    if (!LEVELS.includes(level)) {
      return NextResponse.json({ error: 'invalid_level' }, { status: 400 })
    }

    const supabase = createServerClient()

    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select('id, secret, status, ends_at, expires_at')
      .eq('id', sessionId)
      .single()

    if (sessionError || !session) {
      return NextResponse.json({ error: 'session_not_found' }, { status: 404 })
    }

    if (new Date(session.expires_at) < new Date()) {
      return NextResponse.json({ error: 'session_expired' }, { status: 410 })
    }

    // Check if session has ended (by time or manually)
    if (session.status === 'ended' || new Date(session.ends_at) < new Date()) {
      return NextResponse.json({ error: 'session_ended' }, { status: 400 })
    }

    // Validate the QR token
    if (!validateToken(token, session.id, session.secret)) {
      return NextResponse.json({ error: 'qr_expired' }, { status: 400 })
    }

    // Insert attendance record
    const { error: insertError } = await supabase.from('attendees').insert({
      session_id: sessionId,
      full_name: full_name.trim(),
      matric_number: matric_number.trim().toUpperCase(),
      level,
      device_id,
    })

    if (insertError) {
      // Unique constraint: same matric number already submitted this session
      if (insertError.message.includes('unique_matric_per_session')) {
        return NextResponse.json({ error: 'duplicate_matric' }, { status: 409 })
      }
      // Unique constraint: same device already submitted this session
      if (insertError.message.includes('unique_device_per_session')) {
        return NextResponse.json({ error: 'duplicate_device' }, { status: 409 })
      }
      console.error('Failed to insert attendee:', insertError)
      return NextResponse.json({ error: 'Failed to record attendance' }, { status: 500 })
    }

    return NextResponse.json(
      { success: true, message: 'Attendance recorded successfully.' },
      { status: 201 }
    )
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}

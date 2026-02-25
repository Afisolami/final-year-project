import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { generateCSV, getCSVFilename } from '@/lib/csv'
import type { Session, Attendee } from '@/types'

export async function GET(
  _request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  const supabase = createServerClient()
  const { sessionId } = params

  const { data: session, error: sessionError } = await supabase
    .from('sessions')
    .select('*')
    .eq('id', sessionId)
    .single()

  if (sessionError || !session) {
    return NextResponse.json({ error: 'session_not_found' }, { status: 404 })
  }

  if (new Date(session.expires_at) < new Date()) {
    return NextResponse.json({ error: 'session_expired' }, { status: 410 })
  }

  const { data: attendees, error: attendeesError } = await supabase
    .from('attendees')
    .select('*')
    .eq('session_id', sessionId)
    .order('submitted_at', { ascending: true })

  if (attendeesError) {
    return NextResponse.json({ error: 'Failed to fetch attendees' }, { status: 500 })
  }

  const csv = generateCSV((attendees ?? []) as Attendee[], session as Session)
  const filename = getCSVFilename(session as Session)

  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}

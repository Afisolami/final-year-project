import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { sessionId: string; attendeeId: string } }
) {
  const supabase = createServerClient()
  const { sessionId, attendeeId } = params

  const { data, error } = await supabase
    .from('attendees')
    .delete()
    .eq('id', attendeeId)
    .eq('session_id', sessionId) // ensures the attendee belongs to this session
    .select('id')
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'attendee_not_found' }, { status: 404 })
  }

  return NextResponse.json({ success: true })
}

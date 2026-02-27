import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const supabase = createServerClient()
  const { sessionId } = await params

  const { data, error } = await supabase
    .from('sessions')
    .update({ status: 'ended' })
    .eq('id', sessionId)
    .select('id')
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'session_not_found' }, { status: 404 })
  }

  return NextResponse.json({ success: true })
}

import { NextRequest, NextResponse } from 'next/server'
import crypto from 'node:crypto'
import { createServerClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { lecture_name, duration_minutes } = body

    // Validate inputs
    if (!lecture_name || typeof lecture_name !== 'string' || lecture_name.trim() === '') {
      return NextResponse.json({ error: 'lecture_name is required' }, { status: 400 })
    }

    const duration = parseInt(duration_minutes, 10)
    if (isNaN(duration) || duration < 5 || duration > 240) {
      return NextResponse.json(
        { error: 'duration_minutes must be between 5 and 240' },
        { status: 400 }
      )
    }

    const supabase = createServerClient()

    const started_at = new Date()
    const ends_at = new Date(started_at.getTime() + duration * 60 * 1000)
    const expires_at = new Date(ends_at.getTime() + 24 * 60 * 60 * 1000)
    const secret = crypto.randomBytes(32).toString('hex')

    const { data, error } = await supabase
      .from('sessions')
      .insert({
        lecture_name: lecture_name.trim(),
        duration_minutes: duration,
        started_at: started_at.toISOString(),
        ends_at: ends_at.toISOString(),
        expires_at: expires_at.toISOString(),
        secret,
        status: 'active',
      })
      .select('id')
      .single()

    if (error) {
      return NextResponse.json({ error: 'supabase_error', msg: error.message, hint: error.hint, code: error.code }, { status: 500 })
    }
    if (!data) {
      return NextResponse.json({ error: 'no_data_returned' }, { status: 500 })
    }

    return NextResponse.json(
      {
        session_id: data.id,
        session_url: `/session/${data.id}`,
      },
      { status: 201 }
    )
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}

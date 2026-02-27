import { notFound } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import SessionPageClient from '@/components/session/SessionPageClient'
import type { Metadata } from 'next'

interface Props {
  params: Promise<{ sessionId: string }>
}

export async function generateMetadata(): Promise<Metadata> {
  return { title: `Session — QR Attendance` }
}

export default async function SessionPage({ params }: Props) {
  const { sessionId } = await params
  const supabase = createServerClient()

  const { data: session } = await supabase
    .from('sessions')
    .select('id, lecture_name, duration_minutes, started_at, ends_at, expires_at, status, created_at')
    .eq('id', sessionId)
    .single()

  if (!session) notFound()

  // Treat expired sessions as not found
  if (new Date(session.expires_at) < new Date()) notFound()

  // Auto-mark as ended if the time window has passed
  if (session.status === 'active' && new Date(session.ends_at) < new Date()) {
    await supabase
      .from('sessions')
      .update({ status: 'ended' })
      .eq('id', sessionId)
    session.status = 'ended'
  }

  const { data: attendees } = await supabase
    .from('attendees')
    .select('id, full_name, matric_number, level, submitted_at')
    .eq('session_id', sessionId)
    .order('submitted_at', { ascending: true })

  return (
    <SessionPageClient
      session={session}
      initialAttendees={attendees ?? []}
    />
  )
}

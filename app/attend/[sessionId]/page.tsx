import type { Metadata } from 'next'
import { createServerClient } from '@/lib/supabase/server'
import AttendanceFormClient from '@/components/attend/AttendanceFormClient'
import SubmissionResult from '@/components/attend/SubmissionResult'

export const metadata: Metadata = {
  title: 'Sign Attendance — QR Attendance',
}

interface Props {
  params: Promise<{ sessionId: string }>
  searchParams: Promise<{ t?: string }>
}

export default async function AttendPage({ params, searchParams }: Props) {
  const { sessionId } = await params
  const { t } = await searchParams
  const supabase = createServerClient()

  const { data: session } = await supabase
    .from('sessions')
    .select('id, lecture_name, status, ends_at, expires_at')
    .eq('id', sessionId)
    .single()

  // Session doesn't exist or 24hr window has passed
  if (!session || new Date(session.expires_at) < new Date()) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <SubmissionResult type="session_not_found" />
      </div>
    )
  }

  // Session ended (manually or timer expired)
  const isEnded = session.status === 'ended' || new Date(session.ends_at) < new Date()
  if (isEnded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <SubmissionResult type="session_ended" lectureName={session.lecture_name} />
      </div>
    )
  }

  // No token means they navigated to the URL directly (not via QR scan)
  if (!t) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <SubmissionResult type="qr_expired" lectureName={session.lecture_name} />
      </div>
    )
  }

  return (
    <AttendanceFormClient
      sessionId={session.id}
      lectureName={session.lecture_name}
      token={t}
    />
  )
}

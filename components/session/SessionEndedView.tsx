'use client'

import { useState } from 'react'
import { Download, Loader2, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import AttendeeTable from './AttendeeTable'
import type { Attendee, Session } from '@/types'

interface SessionEndedViewProps {
  session: Pick<Session, 'id' | 'lecture_name' | 'started_at' | 'ends_at'>
  attendees: Omit<Attendee, 'device_id' | 'session_id'>[]
}

export default function SessionEndedView({ session, attendees }: SessionEndedViewProps) {
  const [downloading, setDownloading] = useState(false)

  async function handleDownload() {
    setDownloading(true)
    try {
      const res = await fetch(`/api/sessions/${session.id}/export`)
      if (!res.ok) return

      const blob = await res.blob()
      const disposition = res.headers.get('Content-Disposition') ?? ''
      const filename = disposition.match(/filename="(.+)"/)?.[1] ?? 'attendance.csv'

      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } finally {
      setDownloading(false)
    }
  }

  const sessionDate = new Date(session.started_at).toLocaleDateString('en-GB', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl border p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="text-sm font-medium text-green-600">Session ended</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">{session.lecture_name}</h1>
              <p className="text-sm text-gray-500 mt-1">{sessionDate}</p>
            </div>
            <Button onClick={handleDownload} disabled={downloading} className="shrink-0">
              {downloading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Downloading...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Download CSV
                </>
              )}
            </Button>
          </div>

          <p className="text-xs text-gray-400 mt-4">
            Session data is available for 24 hours from when the session ended.
          </p>
        </div>

        {/* Attendee list — read only */}
        <AttendeeTable
          sessionId={session.id}
          initialAttendees={attendees}
          readOnly
        />
      </div>
    </div>
  )
}

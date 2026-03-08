'use client'

import { useState } from 'react'
import { Download, Loader2, CheckCircle, Plus, ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import AttendeeTable from './AttendeeTable'
import type { Attendee, Session } from '@/types'

interface SessionEndedViewProps {
  session: Pick<Session, 'id' | 'lecture_name' | 'started_at' | 'ends_at'>
  attendees: Omit<Attendee, 'device_id' | 'session_id'>[]
}

export default function SessionEndedView({ session, attendees }: SessionEndedViewProps) {
  const [downloading, setDownloading] = useState(false)
  const router = useRouter()

  async function handleDownload() {
    setDownloading(true)
    try {
      const { default: jsPDF } = await import('jspdf')
      const { default: autoTable } = await import('jspdf-autotable')

      const doc = new jsPDF()

      const sessionDate = new Date(session.started_at).toLocaleDateString('en-GB', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })

      // Title
      doc.setFontSize(16)
      doc.setFont('helvetica', 'bold')
      doc.text(session.lecture_name, 14, 20)

      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(100)
      doc.text(sessionDate, 14, 28)
      doc.text(`${attendees.length} student${attendees.length === 1 ? '' : 's'}`, 14, 34)
      doc.setTextColor(0)

      autoTable(doc, {
        startY: 42,
        head: [['#', 'Full Name', 'Matric No.', 'Level', 'Time Signed In']],
        body: attendees.map((a, i) => [
          i + 1,
          a.full_name,
          a.matric_number,
          a.level,
          new Date(a.submitted_at).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            second: '2-digit',
            hour12: true,
          }),
        ]),
        styles: { fontSize: 9 },
        headStyles: { fillColor: [30, 30, 30] },
      })

      const date = new Date(session.started_at).toISOString().split('T')[0]
      const safeName = session.lecture_name
        .replace(/[^a-zA-Z0-9]/g, '_')
        .replace(/_+/g, '_')
        .substring(0, 30)
      doc.save(`${safeName}_${date}.pdf`)
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
                  Download PDF
                </>
              )}
            </Button>
          </div>

          <p className="text-xs text-gray-400 mt-4">
            Session data is available for 24 hours from when the session ended.
          </p>

          {/* Navigation buttons */}
          <div className="flex gap-3 mt-4">
            <Button variant="outline" size="sm" onClick={() => router.push('/')}>
              <ArrowLeft className="mr-1.5 h-4 w-4" />
              Back to Home
            </Button>
            <Button size="sm" onClick={() => router.push('/')}>
              <Plus className="mr-1.5 h-4 w-4" />
              New Session
            </Button>
          </div>
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

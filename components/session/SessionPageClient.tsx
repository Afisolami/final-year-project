'use client'

import { useCallback, useRef, useState } from 'react'
import { StopCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import QRDisplay from './QRDisplay'
import CountdownTimer from './CountdownTimer'
import AttendeeTable from './AttendeeTable'
import SessionEndedView from './SessionEndedView'
import type { Attendee, Session } from '@/types'

interface SessionPageClientProps {
  session: Omit<Session, 'secret'>
  initialAttendees: Omit<Attendee, 'device_id' | 'session_id'>[]
}

export default function SessionPageClient({
  session,
  initialAttendees,
}: SessionPageClientProps) {
  const [status, setStatus] = useState<'active' | 'ended'>(session.status)
  const [endedAttendees, setEndedAttendees] = useState(initialAttendees)
  const [showEndDialog, setShowEndDialog] = useState(false)
  const [ending, setEnding] = useState(false)
  const sessionEndedRef = useRef(false)
  const { toast } = useToast()

  // Called by both CountdownTimer (time up) and QRDisplay (server says ended)
  const handleSessionEnd = useCallback(async () => {
    if (sessionEndedRef.current) return
    sessionEndedRef.current = true

    // Fetch final attendee list before switching view
    try {
      const res = await fetch(`/api/sessions/${session.id}/attendees`)
      const data = await res.json()
      if (res.ok) setEndedAttendees(data.attendees)
    } catch {
      // Use whatever we have in state
    }

    setStatus('ended')
    toast({ title: 'Session ended', description: 'Attendance is now closed.' })
  }, [session.id, toast])

  // Manual early end — requires confirmation
  async function handleConfirmEnd() {
    setEnding(true)
    try {
      await fetch(`/api/sessions/${session.id}/end`, { method: 'PATCH' })
    } catch {
      // continue regardless — UI will show ended state
    } finally {
      setEnding(false)
      setShowEndDialog(false)
      handleSessionEnd()
    }
  }

  if (status === 'ended') {
    return (
      <SessionEndedView
        session={session}
        attendees={endedAttendees}
      />
    )
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        {/* Top bar */}
        <div className="bg-white border-b px-4 py-3 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-lg font-bold text-gray-900 truncate">{session.lecture_name}</h1>
            <p className="text-xs text-gray-400">
              Started {new Date(session.started_at).toLocaleTimeString('en-GB', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <CountdownTimer endsAt={session.ends_at} onSessionEnd={handleSessionEnd} />
            <Button
              variant="outline"
              size="sm"
              className="text-red-600 border-red-200 hover:bg-red-50"
              onClick={() => setShowEndDialog(true)}
            >
              <StopCircle className="h-4 w-4 mr-1.5" />
              End Session
            </Button>
          </div>
        </div>

        {/* Main content */}
        <div className="max-w-3xl mx-auto p-4 md:p-8 space-y-8">
          {/* QR Code */}
          <div className="flex flex-col items-center">
            <QRDisplay sessionId={session.id} onSessionEnd={handleSessionEnd} />
          </div>

          {/* Live attendee list */}
          <AttendeeTable
            sessionId={session.id}
            initialAttendees={initialAttendees}
          />
        </div>
      </div>

      {/* End session confirmation dialog */}
      <Dialog open={showEndDialog} onOpenChange={setShowEndDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>End session early?</DialogTitle>
            <DialogDescription>
              No more attendance will be accepted after this. Students currently
              filling the form will not be able to submit.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowEndDialog(false)}
              disabled={ending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmEnd}
              disabled={ending}
            >
              {ending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Ending...
                </>
              ) : (
                'Yes, end session'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

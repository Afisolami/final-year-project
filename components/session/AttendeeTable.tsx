'use client'

import { useEffect, useRef, useState } from 'react'
import { Trash2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { getSupabaseClient } from '@/lib/supabase/client'
import type { Attendee } from '@/types'

interface AttendeeTableProps {
  sessionId: string
  initialAttendees: Omit<Attendee, 'device_id' | 'session_id'>[]
  readOnly?: boolean
}

export default function AttendeeTable({
  sessionId,
  initialAttendees,
  readOnly = false,
}: AttendeeTableProps) {
  const [attendees, setAttendees] = useState(initialAttendees)
  const [removingId, setRemovingId] = useState<string | null>(null)
  const { toast } = useToast()
  const channelRef = useRef<ReturnType<typeof getSupabaseClient>['channel'] | null>(null)

  // Set up Realtime subscription for live updates
  useEffect(() => {
    if (readOnly) return

    const supabase = getSupabaseClient()
    const channel = supabase
      .channel(`attendees:${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'attendees',
          filter: `session_id=eq.${sessionId}`,
        },
        payload => {
          const newAttendee = payload.new as Attendee
          setAttendees(prev => {
            // Guard against duplicates (optimistic updates)
            if (prev.some(a => a.id === newAttendee.id)) return prev
            return [...prev, newAttendee]
          })
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'attendees',
          filter: `session_id=eq.${sessionId}`,
        },
        payload => {
          const removed = payload.old as { id: string }
          setAttendees(prev => prev.filter(a => a.id !== removed.id))
        }
      )
      .subscribe()

    channelRef.current = channel as unknown as null

    return () => {
      supabase.removeChannel(channel)
    }
  }, [sessionId, readOnly])

  async function handleRemove(attendeeId: string, name: string) {
    setRemovingId(attendeeId)
    try {
      const res = await fetch(
        `/api/sessions/${sessionId}/attendees/${attendeeId}`,
        { method: 'DELETE' }
      )

      if (!res.ok) {
        toast({
          title: 'Failed to remove attendee',
          description: 'Please try again.',
          variant: 'destructive',
        })
        return
      }

      // Optimistic removal — Realtime DELETE event will be a no-op
      setAttendees(prev => prev.filter(a => a.id !== attendeeId))
      toast({ title: `${name} removed from attendance.` })
    } catch {
      toast({
        title: 'Something went wrong',
        description: 'Please try again.',
        variant: 'destructive',
      })
    } finally {
      setRemovingId(null)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
          Attendance
        </h2>
        <Badge variant="secondary" className="text-sm font-mono">
          {attendees.length} {attendees.length === 1 ? 'student' : 'students'}
        </Badge>
      </div>

      {attendees.length === 0 ? (
        <div className="text-center py-12 text-gray-400 text-sm border rounded-lg bg-white">
          No students have signed in yet.
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden bg-white">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="w-10">#</TableHead>
                <TableHead>Full Name</TableHead>
                <TableHead>Matric No.</TableHead>
                <TableHead>Level</TableHead>
                <TableHead>Time</TableHead>
                {!readOnly && <TableHead className="w-10" />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {attendees.map((attendee, index) => (
                <TableRow key={attendee.id}>
                  <TableCell className="text-gray-400 font-mono text-sm">
                    {index + 1}
                  </TableCell>
                  <TableCell className="font-medium">{attendee.full_name}</TableCell>
                  <TableCell className="font-mono text-sm">{attendee.matric_number}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{attendee.level}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-gray-500 font-mono">
                    {new Date(attendee.submitted_at).toLocaleTimeString('en-GB', {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })}
                  </TableCell>
                  {!readOnly && (
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-gray-400 hover:text-red-600"
                        onClick={() => handleRemove(attendee.id, attendee.full_name)}
                        disabled={removingId === attendee.id}
                      >
                        {removingId === attendee.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2 } from 'lucide-react'
import SubmissionResult from './SubmissionResult'
import { LEVELS } from '@/types'

type SubmissionState =
  | 'idle'
  | 'submitting'
  | 'success'
  | 'duplicate_matric'
  | 'duplicate_device'
  | 'qr_expired'
  | 'session_ended'
  | 'error'

interface AttendanceFormClientProps {
  sessionId: string
  lectureName: string
  token: string
}

export default function AttendanceFormClient({
  sessionId,
  lectureName,
  token,
}: AttendanceFormClientProps) {
  const [fullName, setFullName] = useState('')
  const [matricNumber, setMatricNumber] = useState('')
  const [level, setLevel] = useState('')
  const [deviceId, setDeviceId] = useState('')
  const [submissionState, setSubmissionState] = useState<SubmissionState>('idle')

  // Get or create a persistent device ID in localStorage
  useEffect(() => {
    let id = localStorage.getItem('qr_attendance_device_id')
    if (!id) {
      id = crypto.randomUUID()
      localStorage.setItem('qr_attendance_device_id', id)
    }
    setDeviceId(id)
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!deviceId) return

    setSubmissionState('submitting')

    try {
      const res = await fetch(`/api/sessions/${sessionId}/attend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          full_name: fullName.trim(),
          matric_number: matricNumber.trim(),
          level,
          device_id: deviceId,
        }),
      })

      const data = await res.json()

      if (res.ok) {
        setSubmissionState('success')
        return
      }

      // Map API error codes to submission states
      const errorMap: Record<string, SubmissionState> = {
        duplicate_matric: 'duplicate_matric',
        duplicate_device: 'duplicate_device',
        qr_expired: 'qr_expired',
        session_ended: 'session_ended',
        session_expired: 'session_ended',
      }

      setSubmissionState(errorMap[data.error] ?? 'error')
    } catch {
      setSubmissionState('error')
    }
  }

  // Show result screen after submission
  if (submissionState !== 'idle' && submissionState !== 'submitting') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <SubmissionResult type={submissionState} lectureName={lectureName} />
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <div className="bg-gray-900 text-white px-5 py-5">
        <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Signing attendance for</p>
        <h1 className="text-lg font-bold leading-tight">{lectureName}</h1>
      </div>

      {/* Form */}
      <div className="flex-1 px-5 py-7">
        <form onSubmit={handleSubmit} className="space-y-6 max-w-md mx-auto">
          <div className="space-y-2">
            <Label htmlFor="full-name" className="text-base">
              Full Name
            </Label>
            <Input
              id="full-name"
              placeholder="e.g. Adebayo Johnson"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              required
              disabled={submissionState === 'submitting'}
              className="h-12 text-base"
              autoComplete="name"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="matric-number" className="text-base">
              Matric Number
            </Label>
            <Input
              id="matric-number"
              placeholder="e.g. CSC/2021/045"
              value={matricNumber}
              onChange={e => setMatricNumber(e.target.value)}
              required
              disabled={submissionState === 'submitting'}
              className="h-12 text-base font-mono"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="characters"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="level" className="text-base">
              Level
            </Label>
            <Select
              value={level}
              onValueChange={setLevel}
              disabled={submissionState === 'submitting'}
              required
            >
              <SelectTrigger id="level" className="h-12 text-base">
                <SelectValue placeholder="Select your level" />
              </SelectTrigger>
              <SelectContent>
                {LEVELS.map(l => (
                  <SelectItem key={l} value={l} className="text-base py-3">
                    {l}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            type="submit"
            className="w-full h-12 text-base mt-4"
            disabled={
              submissionState === 'submitting' ||
              !fullName.trim() ||
              !matricNumber.trim() ||
              !level ||
              !deviceId
            }
          >
            {submissionState === 'submitting' ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Submitting...
              </>
            ) : (
              'Submit Attendance'
            )}
          </Button>
        </form>
      </div>
    </main>
  )
}

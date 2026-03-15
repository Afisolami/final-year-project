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
import { Loader2, MapPin, CheckCircle2, AlertCircle } from 'lucide-react'
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
  | 'location_denied'
  | 'out_of_range'
  | 'error'

type LocationState = 'idle' | 'requesting' | 'granted' | 'denied'

interface AttendanceFormClientProps {
  sessionId: string
  lectureName: string
  token: string
  geoEnabled: boolean
}

export default function AttendanceFormClient({
  sessionId,
  lectureName,
  token,
  geoEnabled,
}: AttendanceFormClientProps) {
  const [fullName, setFullName] = useState('')
  const [matricNumber, setMatricNumber] = useState('')
  const [level, setLevel] = useState('')
  const [deviceId, setDeviceId] = useState('')
  const [submissionState, setSubmissionState] = useState<SubmissionState>('idle')

  // Geo state
  const [locationState, setLocationState] = useState<LocationState>('idle')
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [outOfRangeInfo, setOutOfRangeInfo] = useState<{ distance: number; radius: number } | null>(null)

  // Get or create a persistent device ID in localStorage
  useEffect(() => {
    let id = localStorage.getItem('qr_attendance_device_id')
    if (!id) {
      id = crypto.randomUUID()
      localStorage.setItem('qr_attendance_device_id', id)
    }
    setDeviceId(id)
  }, [])

  // Request location on mount if geo is required
  useEffect(() => {
    if (!geoEnabled) return
    setLocationState('requesting')
    navigator.geolocation.getCurrentPosition(
      pos => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setLocationState('granted')
      },
      () => setLocationState('denied'),
      { timeout: 10000, maximumAge: 60000, enableHighAccuracy: true }
    )
  }, [geoEnabled])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!deviceId) return

    if (geoEnabled && locationState === 'denied') {
      setSubmissionState('location_denied')
      return
    }

    setSubmissionState('submitting')

    try {
      const body: Record<string, unknown> = {
        token,
        full_name: fullName.trim(),
        matric_number: matricNumber.trim(),
        level,
        device_id: deviceId,
      }

      if (geoEnabled && coords) {
        body.latitude = coords.lat
        body.longitude = coords.lng
      }

      const res = await fetch(`/api/sessions/${sessionId}/attend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const data = await res.json()

      if (res.ok) {
        setSubmissionState('success')
        return
      }

      if (data.error === 'out_of_range') {
        setOutOfRangeInfo({ distance: data.distance_m, radius: data.radius_m })
        setSubmissionState('out_of_range')
        return
      }

      const errorMap: Record<string, SubmissionState> = {
        duplicate_matric: 'duplicate_matric',
        duplicate_device: 'duplicate_device',
        qr_expired: 'qr_expired',
        session_ended: 'session_ended',
        session_expired: 'session_ended',
        location_denied: 'location_denied',
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
        <SubmissionResult
          type={submissionState}
          lectureName={lectureName}
          outOfRangeInfo={outOfRangeInfo ?? undefined}
        />
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

      {/* Location status banner */}
      {geoEnabled && (
        <div className={`px-5 py-2.5 text-sm flex items-center gap-2 ${
          locationState === 'granted'
            ? 'bg-green-50 text-green-700'
            : locationState === 'denied'
            ? 'bg-red-50 text-red-700'
            : 'bg-gray-50 text-gray-500'
        }`}>
          {locationState === 'requesting' && (
            <><Loader2 className="h-4 w-4 animate-spin" /> Getting your location…</>
          )}
          {locationState === 'granted' && (
            <><CheckCircle2 className="h-4 w-4" /> Location verified</>
          )}
          {locationState === 'denied' && (
            <><AlertCircle className="h-4 w-4" /> Location access denied — you cannot submit without it</>
          )}
          {locationState === 'idle' && (
            <><MapPin className="h-4 w-4" /> Location required for this session</>
          )}
        </div>
      )}

      {/* Form */}
      <div className="flex-1 px-5 py-7">
        <form onSubmit={handleSubmit} className="space-y-6 max-w-md mx-auto">
          <div className="space-y-2">
            <Label htmlFor="full-name" className="text-base">Full Name</Label>
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
            <Label htmlFor="matric-number" className="text-base">Matric Number</Label>
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
            <Label htmlFor="level" className="text-base">Level</Label>
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
              !deviceId ||
              (geoEnabled && locationState === 'denied')
            }
          >
            {submissionState === 'submitting' ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                {geoEnabled && locationState === 'requesting' ? 'Getting location…' : 'Submitting…'}
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

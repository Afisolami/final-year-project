'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, MapPin, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react'

const DURATION_OPTIONS = [
  { label: '30 minutes', value: '30' },
  { label: '45 minutes', value: '45' },
  { label: '1 hour', value: '60' },
  { label: '1 hour 30 minutes', value: '90' },
  { label: '2 hours', value: '120' },
  { label: '3 hours', value: '180' },
  { label: '4 hours', value: '240' },
]

const RADIUS_OPTIONS = [
  { label: '50 m', value: '50' },
  { label: '100 m (recommended)', value: '100' },
  { label: '200 m', value: '200' },
  { label: '500 m', value: '500' },
]

type LocationStatus = 'idle' | 'capturing' | 'captured' | 'error'

export default function CreateSessionForm() {
  const router = useRouter()
  const [lectureName, setLectureName] = useState('')
  const [duration, setDuration] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Geo-fencing state
  const [geoEnabled, setGeoEnabled] = useState(false)
  const [radius, setRadius] = useState('100')
  const [locationStatus, setLocationStatus] = useState<LocationStatus>('idle')
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null)

  function captureLocation() {
    setLocationStatus('capturing')
    setCoords(null)
    navigator.geolocation.getCurrentPosition(
      pos => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setLocationStatus('captured')
      },
      () => setLocationStatus('error'),
      { timeout: 10000, maximumAge: 0, enableHighAccuracy: true }
    )
  }

  function handleGeoToggle(e: React.ChangeEvent<HTMLInputElement>) {
    const enabled = e.target.checked
    setGeoEnabled(enabled)
    if (enabled && locationStatus === 'idle') {
      captureLocation()
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!lectureName.trim()) {
      setError('Please enter a lecture name.')
      return
    }
    if (!duration) {
      setError('Please select a duration.')
      return
    }
    if (geoEnabled && locationStatus !== 'captured') {
      setError('Please allow location access to enable geo-fencing.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lecture_name: lectureName.trim(),
          duration_minutes: parseInt(duration, 10),
          geo_enabled: geoEnabled,
          latitude: geoEnabled ? coords?.lat : undefined,
          longitude: geoEnabled ? coords?.lng : undefined,
          radius_meters: geoEnabled ? parseInt(radius, 10) : undefined,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        if (data.error === 'supabase_error') {
          setError(data.msg ?? 'Database error. Please try again.')
        } else {
          setError(data.error ?? 'Failed to create session. Please try again.')
        }
        return
      }

      router.push(data.session_url)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg">Start a New Session</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="lecture-name">Lecture Name</Label>
            <Input
              id="lecture-name"
              placeholder="e.g. MTH 301 — Calculus"
              value={lectureName}
              onChange={e => setLectureName(e.target.value)}
              disabled={loading}
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="duration">Session Duration</Label>
            <Select value={duration} onValueChange={setDuration} disabled={loading}>
              <SelectTrigger id="duration">
                <SelectValue placeholder="Select duration" />
              </SelectTrigger>
              <SelectContent>
                {DURATION_OPTIONS.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Geo-fencing toggle */}
          <div className="border rounded-lg p-4 space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={geoEnabled}
                onChange={handleGeoToggle}
                disabled={loading}
                className="w-4 h-4 accent-gray-900"
              />
              <div>
                <p className="text-sm font-medium text-gray-900">Require location verification</p>
                <p className="text-xs text-gray-500">Only students physically present can sign in</p>
              </div>
            </label>

            {geoEnabled && (
              <div className="space-y-3 pl-7">
                {locationStatus === 'capturing' && (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Getting your location…
                  </div>
                )}
                {locationStatus === 'captured' && (
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <CheckCircle2 className="h-4 w-4" />
                    Location captured
                  </div>
                )}
                {locationStatus === 'error' && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-red-600">
                      <AlertCircle className="h-4 w-4" />
                      Could not get location. Check browser permissions.
                    </div>
                    <button
                      type="button"
                      onClick={captureLocation}
                      className="flex items-center gap-1.5 text-xs text-gray-600 underline underline-offset-2"
                    >
                      <RefreshCw className="h-3 w-3" />
                      Try again
                    </button>
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label className="text-xs text-gray-600 flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    Allowed radius
                  </Label>
                  <Select value={radius} onValueChange={setRadius} disabled={loading}>
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {RADIUS_OPTIONS.map(opt => (
                        <SelectItem key={opt.value} value={opt.value} className="text-sm">
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating session...
              </>
            ) : (
              'Generate QR Code'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

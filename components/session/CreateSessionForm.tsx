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
import { Loader2 } from 'lucide-react'

const DURATION_OPTIONS = [
  { label: '30 minutes', value: '30' },
  { label: '45 minutes', value: '45' },
  { label: '1 hour', value: '60' },
  { label: '1 hour 30 minutes', value: '90' },
  { label: '2 hours', value: '120' },
  { label: '3 hours', value: '180' },
  { label: '4 hours', value: '240' },
]

export default function CreateSessionForm() {
  const router = useRouter()
  const [lectureName, setLectureName] = useState('')
  const [duration, setDuration] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

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

    setLoading(true)
    try {
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lecture_name: lectureName.trim(),
          duration_minutes: parseInt(duration, 10),
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

          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}

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

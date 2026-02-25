'use client'

import { useEffect, useState } from 'react'
import { Clock } from 'lucide-react'

interface CountdownTimerProps {
  endsAt: string
  onSessionEnd: () => void
}

function formatTime(ms: number): string {
  if (ms <= 0) return '00:00'
  const totalSeconds = Math.floor(ms / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  if (hours > 0) {
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  }
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

export default function CountdownTimer({ endsAt, onSessionEnd }: CountdownTimerProps) {
  const [msRemaining, setMsRemaining] = useState(() =>
    Math.max(0, new Date(endsAt).getTime() - Date.now())
  )
  const [ended, setEnded] = useState(false)

  useEffect(() => {
    // Compute inline so msRemaining state is not a dependency of this effect
    const initialRemaining = Math.max(0, new Date(endsAt).getTime() - Date.now())
    if (initialRemaining <= 0) {
      if (!ended) {
        setEnded(true)
        onSessionEnd()
      }
      return
    }

    const interval = setInterval(() => {
      const remaining = Math.max(0, new Date(endsAt).getTime() - Date.now())
      setMsRemaining(remaining)

      if (remaining <= 0) {
        clearInterval(interval)
        if (!ended) {
          setEnded(true)
          onSessionEnd()
        }
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [endsAt, ended, onSessionEnd])

  const isUrgent = msRemaining <= 5 * 60 * 1000 && msRemaining > 0 // last 5 minutes

  return (
    <div className={`flex items-center gap-2 font-mono text-2xl font-bold tabular-nums
      ${isUrgent ? 'text-red-600' : 'text-gray-800'}`}
    >
      <Clock className={`h-5 w-5 ${isUrgent ? 'text-red-500' : 'text-gray-500'}`} />
      {ended ? (
        <span className="text-gray-500">00:00</span>
      ) : (
        <span>{formatTime(msRemaining)}</span>
      )}
    </div>
  )
}

'use client'

import { useEffect, useRef, useState } from 'react'
import QRCode from 'react-qr-code'
import { Loader2 } from 'lucide-react'
import type { QRData } from '@/types'

interface QRDisplayProps {
  sessionId: string
  onSessionEnd: () => void
}

export default function QRDisplay({ sessionId, onSessionEnd }: QRDisplayProps) {
  const [qrData, setQrData] = useState<QRData | null>(null)
  const [fetchError, setFetchError] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const endedRef = useRef(false)

  const fetchQRData = async () => {
    try {
      const res = await fetch(`/api/sessions/${sessionId}/current-qr`)
      const data = await res.json()

      if (data.status === 'ended') {
        if (!endedRef.current) {
          endedRef.current = true
          onSessionEnd()
        }
        return
      }

      setFetchError(false)
      setQrData(data)

      // Schedule next fetch precisely when the current window expires
      timeoutRef.current = setTimeout(fetchQRData, data.window_expires_in_ms + 100)
    } catch {
      setFetchError(true)
      // Retry after 5 seconds on network error
      timeoutRef.current = setTimeout(fetchQRData, 5000)
    }
  }

  useEffect(() => {
    fetchQRData()
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId])

  if (fetchError) {
    return (
      <div className="flex flex-col items-center justify-center h-80 text-gray-400 gap-3">
        <p className="text-sm">Connection issue — retrying...</p>
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    )
  }

  if (!qrData) {
    return (
      <div className="flex items-center justify-center h-80">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Colored background — the visual rotation cue */}
      <div
        className="p-6 rounded-2xl transition-colors duration-500 shadow-lg"
        style={{ backgroundColor: qrData.color_hex }}
      >
        {/* QR code stays black on white for maximum scannability */}
        <div className="bg-white p-4 rounded-xl">
          <QRCode
            value={qrData.qr_url}
            size={260}
            bgColor="#ffffff"
            fgColor="#000000"
            level="H"
          />
        </div>

        {/* Color label for students to verbally confirm */}
        <p
          className="text-center mt-4 text-base font-semibold tracking-wide uppercase"
          style={{ color: qrData.text_color }}
        >
          {qrData.color}
        </p>
      </div>

      <p className="text-sm text-gray-500">
        Code refreshes every 30 seconds. Color confirms the latest code.
      </p>
    </div>
  )
}

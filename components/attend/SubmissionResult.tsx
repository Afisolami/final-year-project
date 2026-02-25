'use client'

import { CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react'

type ResultType =
  | 'success'
  | 'duplicate_matric'
  | 'duplicate_device'
  | 'qr_expired'
  | 'session_ended'
  | 'session_not_found'
  | 'error'

interface SubmissionResultProps {
  type: ResultType
  lectureName?: string
}

const RESULT_CONFIG: Record<
  ResultType,
  { icon: React.ReactNode; title: string; description: string; color: string }
> = {
  success: {
    icon: <CheckCircle className="h-14 w-14 text-green-500" />,
    title: 'Attendance recorded',
    description: 'You have been signed in successfully.',
    color: 'text-green-600',
  },
  duplicate_matric: {
    icon: <XCircle className="h-14 w-14 text-red-500" />,
    title: 'Already submitted',
    description: 'Your matric number has already been recorded for this session.',
    color: 'text-red-600',
  },
  duplicate_device: {
    icon: <XCircle className="h-14 w-14 text-red-500" />,
    title: 'Already submitted',
    description: 'Attendance has already been recorded from this device for this session.',
    color: 'text-red-600',
  },
  qr_expired: {
    icon: <Clock className="h-14 w-14 text-orange-500" />,
    title: 'QR code expired',
    description: 'This code is no longer valid. Ask your lecturer for the current QR code and scan again.',
    color: 'text-orange-600',
  },
  session_ended: {
    icon: <Clock className="h-14 w-14 text-gray-400" />,
    title: 'Session has ended',
    description: 'This attendance session is closed. No more submissions are being accepted.',
    color: 'text-gray-600',
  },
  session_not_found: {
    icon: <AlertTriangle className="h-14 w-14 text-gray-400" />,
    title: 'Invalid link',
    description: 'This QR code is not valid or the session no longer exists.',
    color: 'text-gray-600',
  },
  error: {
    icon: <AlertTriangle className="h-14 w-14 text-red-500" />,
    title: 'Something went wrong',
    description: 'Could not record your attendance. Please try scanning the QR code again.',
    color: 'text-red-600',
  },
}

export default function SubmissionResult({ type, lectureName }: SubmissionResultProps) {
  const config = RESULT_CONFIG[type]

  return (
    <div className="flex flex-col items-center justify-center text-center px-6 py-16 gap-4">
      {config.icon}
      <div className="space-y-2">
        <h2 className={`text-xl font-bold ${config.color}`}>{config.title}</h2>
        {lectureName && (
          <p className="text-sm font-medium text-gray-700">{lectureName}</p>
        )}
        <p className="text-sm text-gray-500 max-w-xs">{config.description}</p>
      </div>
    </div>
  )
}

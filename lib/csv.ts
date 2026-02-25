import type { Attendee, Session } from '@/types'

export function generateCSV(attendees: Attendee[], session: Session): string {
  const headers = [
    '#',
    'Full Name',
    'Matric Number',
    'Level',
    'Time Signed In',
    'Lecture Name',
    'Session Date',
  ]

  const rows = attendees.map((a, i) => [
    i + 1,
    `"${a.full_name.replace(/"/g, '""')}"`,
    a.matric_number,
    a.level,
    new Date(a.submitted_at).toLocaleTimeString('en-GB'),
    `"${session.lecture_name.replace(/"/g, '""')}"`,
    new Date(session.started_at).toLocaleDateString('en-GB'),
  ])

  return [headers, ...rows].map(row => row.join(',')).join('\r\n')
}

export function getCSVFilename(session: Session): string {
  const date = new Date(session.started_at).toISOString().split('T')[0]
  const safeName = session.lecture_name
    .replace(/[^a-zA-Z0-9]/g, '_')
    .replace(/_+/g, '_')
    .substring(0, 30)
  return `${safeName}_${date}.csv`
}

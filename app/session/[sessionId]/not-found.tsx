import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function SessionNotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center space-y-4">
        <h1 className="text-2xl font-bold text-gray-900">Session not found</h1>
        <p className="text-gray-500 max-w-sm">
          This session doesn&apos;t exist, has expired, or the link is incorrect.
          Sessions are available for 24 hours after they end.
        </p>
        <Button asChild>
          <Link href="/">Start a new session</Link>
        </Button>
      </div>
    </main>
  )
}

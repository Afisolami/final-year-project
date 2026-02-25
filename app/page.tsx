import CreateSessionForm from '@/components/session/CreateSessionForm'

export default function HomePage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">QR Attendance</h1>
          <p className="text-gray-500 mt-2">
            Generate a QR code for your class and let students sign in instantly.
          </p>
        </div>
        <CreateSessionForm />
      </div>
    </main>
  )
}

import crypto from 'node:crypto'

// Generates a 16-char HMAC token for a given session and 30-second time window.
// windowOffset: 0 = current window, -1 = previous window (for grace period)
export function generateToken(
  sessionId: string,
  secret: string,
  windowOffset = 0
): string {
  const timeWindow = Math.floor(Date.now() / 30000) + windowOffset
  return crypto
    .createHmac('sha256', secret)
    .update(`${sessionId}:${timeWindow}`)
    .digest('hex')
    .substring(0, 16)
}

// Validates a token against the current window AND the previous window.
// The previous window grace period handles students who scanned just before rotation.
export function validateToken(
  token: string,
  sessionId: string,
  secret: string
): boolean {
  const candidates = [
    generateToken(sessionId, secret, 0),  // current window
    generateToken(sessionId, secret, -1), // previous window (grace period)
  ]

  return candidates.some(candidate => {
    try {
      return crypto.timingSafeEqual(
        Buffer.from(token.padEnd(16, '0').substring(0, 16)),
        Buffer.from(candidate.padEnd(16, '0').substring(0, 16))
      )
    } catch {
      return false
    }
  })
}

// Returns milliseconds until the next 30-second window boundary.
export function getWindowExpiresInMs(): number {
  return 30000 - (Date.now() % 30000)
}

// Returns the current 30-second time window index.
export function getCurrentTimeWindow(): number {
  return Math.floor(Date.now() / 30000)
}

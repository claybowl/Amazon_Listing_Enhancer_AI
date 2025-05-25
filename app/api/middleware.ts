import type { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Rate limiting store (in production, use Redis or similar)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

// Rate limiting configuration
const RATE_LIMIT = {
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 100, // 100 requests per minute per IP
}

export function rateLimit(request: NextRequest): boolean {
  const ip = request.ip || request.headers.get("x-forwarded-for") || "unknown"
  const now = Date.now()
  const key = `rate_limit:${ip}`

  const current = rateLimitStore.get(key)

  if (!current || now > current.resetTime) {
    // Reset or initialize
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + RATE_LIMIT.windowMs,
    })
    return true
  }

  if (current.count >= RATE_LIMIT.maxRequests) {
    return false
  }

  current.count++
  return true
}

export function securityHeaders(response: NextResponse): NextResponse {
  // Add security headers
  response.headers.set("X-Content-Type-Options", "nosniff")
  response.headers.set("X-Frame-Options", "DENY")
  response.headers.set("X-XSS-Protection", "1; mode=block")
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin")

  return response
}

export function validateInput(data: any, requiredFields: string[]): string | null {
  for (const field of requiredFields) {
    if (!data[field] || typeof data[field] !== "string" || data[field].trim().length === 0) {
      return `Missing or invalid field: ${field}`
    }
  }
  return null
}

export function sanitizeInput(input: string): string {
  // Basic input sanitization
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "") // Remove script tags
    .replace(/javascript:/gi, "") // Remove javascript: protocols
    .replace(/on\w+\s*=/gi, "") // Remove event handlers
    .trim()
}

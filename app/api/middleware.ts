import { type NextRequest, NextResponse } from "next/server"

export function middleware(request: NextRequest) {
  // This middleware doesn't modify the request
  // It's just here to catch any errors that might occur in the API routes
  return NextResponse.next()
}

export function onError(error: Error, request: NextRequest) {
  console.error("API route error caught by middleware:", error)

  // Return a JSON response with the error
  return NextResponse.json({ error: `Server error: ${error.message || "An unknown error occurred"}` }, { status: 500 })
}

export const config = {
  matcher: "/api/:path*",
}

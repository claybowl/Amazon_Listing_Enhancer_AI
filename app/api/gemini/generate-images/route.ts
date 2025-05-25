import { type NextRequest, NextResponse } from "next/server"

// Get API key from environment variables
const GEMINI_API_KEY = process.env.GEMINI_API_KEY

export async function HEAD(request: NextRequest) {
  // Simple HEAD request handler to check if the route exists
  return new NextResponse(null, { status: 200 })
}

export async function POST(request: NextRequest) {
  try {
    // Check if API key is configured
    if (!GEMINI_API_KEY) {
      console.error("Gemini API Key not found in environment variables")
      return NextResponse.json({ error: "Gemini API Key not configured on the server." }, { status: 500 })
    }

    // Parse request body
    let body
    try {
      body = await request.json()
    } catch (e) {
      console.error("Failed to parse request body:", e)
      return NextResponse.json({ error: "Invalid JSON in request body" }, { status: 400 })
    }

    const { prompt, numberOfImages = 1, modelId = "imagen-3" } = body

    if (!prompt) {
      return NextResponse.json({ error: "Missing required field: prompt" }, { status: 400 })
    }

    if (numberOfImages < 1 || numberOfImages > 4) {
      return NextResponse.json({ error: "Number of images must be between 1 and 4." }, { status: 400 })
    }

    // Note: Gemini's image generation API might not be available through the standard SDK
    // or might require a different approach. For now, we'll return an error indicating this.
    console.error("Gemini image generation is not currently supported through the standard SDK")
    return NextResponse.json(
      {
        error:
          "Gemini image generation is not currently available. Please use a different provider like OpenAI or Stability AI for image generation.",
      },
      { status: 501 },
    )
  } catch (error: any) {
    console.error("Unexpected error in Gemini generate-images API route:", error)
    console.error("Error stack:", error.stack)
    return NextResponse.json(
      { error: `Server error: ${error.message || "An unknown error occurred"}` },
      { status: 500 },
    )
  }
}

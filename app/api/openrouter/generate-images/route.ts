import { type NextRequest, NextResponse } from "next/server"

// Get API key from environment variables
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY

export async function HEAD(request: NextRequest) {
  // Simple HEAD request handler to check if the route exists
  return new NextResponse(null, { status: 200 })
}

export async function POST(request: NextRequest) {
  try {
    // Check if API key is configured
    if (!OPENROUTER_API_KEY) {
      return NextResponse.json({ error: "OpenRouter API Key not configured on the server." }, { status: 500 })
    }

    // Parse request body
    let body
    try {
      body = await request.json()
    } catch (e) {
      return NextResponse.json({ error: "Invalid JSON in request body" }, { status: 400 })
    }

    const { prompt, numberOfImages = 1, modelId = "openai/dall-e-3" } = body

    if (!prompt) {
      return NextResponse.json({ error: "Missing required field: prompt" }, { status: 400 })
    }

    if (numberOfImages < 1 || numberOfImages > 4) {
      return NextResponse.json({ error: "Number of images must be between 1 and 4." }, { status: 400 })
    }

    // OpenRouter doesn't support direct image generation for most models
    // We'll return an error message suggesting to use other providers
    return NextResponse.json(
      {
        error:
          "OpenRouter doesn't support image generation. Please use OpenAI, Stability AI, or Replicate for image generation.",
      },
      { status: 400 },
    )
  } catch (error) {
    console.error("Error in OpenRouter generate-images API route:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "An unknown error occurred" },
      { status: 500 },
    )
  }
}

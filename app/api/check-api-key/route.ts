import { type NextRequest, NextResponse } from "next/server"
import { AIProvider } from "../../../types/models"

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    let body
    try {
      body = await request.json()
    } catch (e) {
      return NextResponse.json({ error: "Invalid JSON in request body" }, { status: 400 })
    }

    const { provider } = body

    if (!provider) {
      return NextResponse.json({ error: "Missing required field: provider" }, { status: 400 })
    }

    // Check if the provider is valid
    if (!Object.values(AIProvider).includes(provider)) {
      return NextResponse.json({ error: "Invalid provider" }, { status: 400 })
    }

    // Check if the API key is configured for the provider
    let hasApiKey = false

    switch (provider) {
      case AIProvider.OpenAI:
        hasApiKey = !!process.env.OPENAI_API_KEY
        break
      case AIProvider.Gemini:
        hasApiKey = !!process.env.GEMINI_API_KEY
        break
      case AIProvider.Stability:
        hasApiKey = !!process.env.STABILITY_API_KEY
        break
      case AIProvider.Replicate:
        hasApiKey = !!(process.env.REPLICATE_API_KEY || "r8_0HPEdTSBtwh0fJUGVNHD5v1bh4e7DoH2KdX4S")
        break
      case AIProvider.OpenRouter:
        hasApiKey = !!process.env.OPENROUTER_API_KEY
        break
      default:
        hasApiKey = false
    }

    return NextResponse.json({ hasApiKey })
  } catch (error) {
    console.error("Error in check-api-key API route:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "An unknown error occurred" },
      { status: 500 },
    )
  }
}

import { type NextRequest, NextResponse } from "next/server"
import { AIProvider } from "../../../types/models"

export async function POST(request: NextRequest) {
  try {
    // Parse request body with error handling
    let body
    try {
      body = await request.json()
    } catch (e) {
      console.error("Failed to parse request body:", e)
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

    try {
      switch (provider) {
        case AIProvider.OpenAI:
          hasApiKey = !!process.env.OPENAI_API_KEY
          break
        case AIProvider.Gemini:
          hasApiKey = !!(process.env.GEMINI_API_KEY || process.env.GOOGLE_GEN_AI_API_KEY || process.env.API_KEY)
          break
        case AIProvider.Stability:
          hasApiKey = !!process.env.STABILITY_API_KEY
          break
        case AIProvider.Replicate:
          hasApiKey = !!process.env.REPLICATE_API_KEY
          break
        case AIProvider.OpenRouter:
          hasApiKey = !!process.env.OPENROUTER_API_KEY
          break
        case AIProvider.Groq:
          hasApiKey = !!process.env.GROQ_API_KEY
          break
        case AIProvider.XAI:
          hasApiKey = !!process.env.XAI_API_KEY
          break
        default:
          hasApiKey = false
      }

      console.log(`Checking ${provider} API key: ${hasApiKey ? "found" : "not found"}`)

      return NextResponse.json({ hasApiKey })
    } catch (envError) {
      console.error(`Error checking environment variables for ${provider}:`, envError)
      return NextResponse.json({ hasApiKey: false })
    }
  } catch (error) {
    console.error("Error in check-api-key API route:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "An unknown error occurred", hasApiKey: false },
      { status: 500 },
    )
  }
}

import { type NextRequest, NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

// Get API key from environment variables
const API_KEY = process.env.API_KEY || process.env.GEMINI_API_KEY

// Initialize the Google Generative AI client
const genAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : null
const IMAGE_MODEL_NAME = "imagen-3.0-generate-002"

export async function POST(request: NextRequest) {
  try {
    // Check if API key is configured
    if (!API_KEY || !genAI) {
      return NextResponse.json({ error: "Gemini API Key not configured on the server." }, { status: 500 })
    }

    // Parse request body
    const { prompt, numberOfImages = 1 } = await request.json()

    if (!prompt) {
      return NextResponse.json({ error: "Missing required field: prompt" }, { status: 400 })
    }

    if (numberOfImages < 1 || numberOfImages > 4) {
      return NextResponse.json({ error: "Number of images must be between 1 and 4." }, { status: 400 })
    }

    // Gemini doesn't support image generation through the standard API
    return NextResponse.json(
      {
        error:
          "Image generation is not currently supported by Gemini through this API. Please use a different provider like OpenAI, Stability AI, or Replicate for image generation.",
      },
      { status: 501 },
    )
  } catch (error) {
    console.error("Error in generate-images API route:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "An unknown error occurred" },
      { status: 500 },
    )
  }
}

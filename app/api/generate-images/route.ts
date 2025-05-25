import { type NextRequest, NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generativeai"

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

    const fullPrompt = `**VERY IMPORTANT: Read all instructions carefully.**
You are an AI image generator tasked with creating a product image for an Amazon listing.

**Product to Depict (Primary Focus):**
The core task is to accurately render the product described in the "Product Context" below. The product's appearance, features, and details as described MUST be depicted as faithfully and identically as possible. Do NOT alter the product itself from how it is described.

**Product Context (This describes the product you must render accurately):**
---
${prompt}
---

**Image Style and Scene (Secondary - This is what you change around the product):**
While the product depiction MUST remain true to the "Product Context", the surrounding scene and environment SHOULD be changed to be:
- Highly appealing and fashionable.
- Professional and commercial quality, suitable for a premium Amazon listing.
- Well-lit, clear, and high-resolution.
- The goal is to present the *exact same product* (as per "Product Context") in a *new, enhanced, stylish setting* that makes it look highly desirable.

**Key Rule: Do not change the product's described features. Only change the scene, background, and styling around the product.**
Generate an image that makes this specific product look highly desirable in its new fashionable environment.`

    // Note: Google's Imagen model might not be available via the standard SDK
    // You may need to use a different approach or model for image generation
    return NextResponse.json(
      {
        error: "Gemini image generation requires Imagen API access which may not be available through the standard SDK",
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

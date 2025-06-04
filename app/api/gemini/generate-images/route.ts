import { GoogleGenerativeAI } from "@google/generative-ai"
import { type NextRequest, NextResponse } from "next/server"

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_GEN_AI_API_KEY

export async function POST(req: NextRequest) {
  if (!GEMINI_API_KEY) {
    return NextResponse.json({ error: "GEMINI_API_KEY is not set" }, { status: 500 })
  }

  try {
    const { prompt, modelId = "gemini-pro", numberOfImages = 1 } = await req.json()

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 })
    }

    console.log("Generating images with Gemini fallback:", { modelId, prompt, numberOfImages })

    // Since Gemini doesn't currently support direct image generation,
    // we'll use a text-to-description approach and return placeholder images
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY)
    const model = genAI.getGenerativeModel({ model: "gemini-pro" })

    // Generate enhanced descriptions for image creation
    const enhancedPrompt = `Create a detailed, professional product image description for: ${prompt}. 
    Include specific details about lighting, composition, background, and visual style that would make this product look appealing for an Amazon listing. 
    Focus on commercial photography standards with clean, professional presentation.`

    const result = await model.generateContent(enhancedPrompt)
    const description = result.response.text()

    // Generate placeholder images with enhanced descriptions
    const images = Array.from({ length: Math.min(numberOfImages, 4) }, (_, i) => {
      const imageQuery = `${prompt} professional product photo ${i + 1}`
      return `/placeholder.svg?height=512&width=512&query=${encodeURIComponent(imageQuery)}`
    })

    console.log(`Generated ${images.length} placeholder images for Gemini`)

    return NextResponse.json({
      images,
      metadata: {
        description,
        isPlaceholder: true,
        provider: "gemini-fallback",
        note: "Gemini image generation uses enhanced placeholders. For actual image generation, consider using OpenAI DALL-E, Stability AI, or Replicate models.",
      },
    })
  } catch (error: any) {
    console.error("Error in Gemini image generation:", error)

    // Fallback to basic placeholder if everything fails
    const { numberOfImages = 1 } = await req.json().catch(() => ({ numberOfImages: 1 }))
    const fallbackImages = Array.from(
      { length: Math.min(numberOfImages, 4) },
      (_, i) => `/placeholder.svg?height=512&width=512&query=product image ${i + 1}`,
    )

    return NextResponse.json({
      images: fallbackImages,
      metadata: {
        isPlaceholder: true,
        provider: "fallback",
        error: error.message,
      },
    })
  }
}

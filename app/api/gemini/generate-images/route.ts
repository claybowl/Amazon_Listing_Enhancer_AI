import { GoogleGenerativeAI } from "@google/generativeai"
import { type NextRequest, NextResponse } from "next/server"

const GEMINI_API_KEY = process.env.GEMINI_API_KEY

export async function POST(req: NextRequest) {
  if (!GEMINI_API_KEY) {
    return NextResponse.json({ error: "GEMINI_API_KEY is not set" }, { status: 500 })
  }

  const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null

  if (!genAI) {
    return NextResponse.json({ error: "Failed to initialize Gemini" }, { status: 500 })
  }

  try {
    const { prompt } = await req.json()

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 })
    }

    // Gemini doesn't actually support image generation through the standard SDK
    return NextResponse.json(
      {
        error:
          "Image generation is not supported by Gemini through this route. Please use a different service or method.",
      },
      { status: 500 },
    )

    // const model = genAI.getGenerativeModel({ model: "gemini-pro-vision" }) // Or another appropriate model

    // const result = await model.generateContent({
    //   prompt,
    // })

    // const response = await result.response
    // const text = response.text()

    // return NextResponse.json({ data: text })
  } catch (error: any) {
    console.error("Error generating image:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

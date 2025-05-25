import { GoogleGenerativeAI } from "@google/generative-ai"
import { type NextRequest, NextResponse } from "next/server"

const GEMINI_API_KEY = process.env.GEMINI_API_KEY

const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null

const model = genAI?.getGenerativeModel({ model: "gemini-1.5-pro" })

export async function POST(req: NextRequest) {
  try {
    if (!model) {
      return NextResponse.json({
        success: false,
        message: "Gemini API key not configured.",
      })
    }

    const { description } = await req.json()

    if (!description) {
      return NextResponse.json({
        success: false,
        message: "No description provided.",
      })
    }

    const prompt = `Improve the following product description to be more engaging and persuasive. Focus on highlighting the key benefits and features in a way that resonates with potential customers. Keep the tone professional and appealing.
      Description: ${description}`

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        responseMimeType: "application/json",
      },
    })

    const response = result.response
    const enhancedDescription = response.text()

    return NextResponse.json({ success: true, data: enhancedDescription })
  } catch (error: any) {
    console.error("Error enhancing description:", error)
    return NextResponse.json({ success: false, message: error.message })
  }
}

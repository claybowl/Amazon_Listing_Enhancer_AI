import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  console.log(
    "Attempting to read GEMINI_API_KEY from Vercel env:",
    process.env.GEMINI_API_KEY ? "Key Found (masked)" : "Key NOT Found",
  )
  console.log(
    "Attempting to read GOOGLE_GEN_AI_API_KEY from Vercel env:",
    process.env.GOOGLE_GEN_AI_API_KEY ? "Key Found (masked)" : "Key NOT Found",
  )

  // Add a masked log if the key is found
  if (process.env.GEMINI_API_KEY) {
    console.log("GEMINI_API_KEY starts with:", process.env.GEMINI_API_KEY.substring(0, 5))
  }
  if (process.env.GOOGLE_GEN_AI_API_KEY) {
    console.log("GOOGLE_GEN_AI_API_KEY starts with:", process.env.GOOGLE_GEN_AI_API_KEY.substring(0, 5))
  }

  try {
    // Check if API key is configured
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GEN_AI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: "Gemini API Key not configured on the server." }, { status: 500 })
    }

    // Parse request body
    const { originalDescription, productName, modelId } = await request.json()

    if (!originalDescription || !productName) {
      return NextResponse.json(
        { error: "Missing required fields: originalDescription or productName" },
        { status: 400 },
      )
    }

    // Import Google Generative AI dynamically
    const { GoogleGenerativeAI } = await import("@google/generative-ai")
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: modelId || "gemini-1.5-pro" })

    const originalCharCount = originalDescription.length
    const originalWordCount = originalDescription.trim().split(/\s+/).filter(Boolean).length

    const prompt = `You are an expert Amazon listing copywriter.
Your task is to rewrite the provided product description for "${productName}" and provide context for your changes.

Original Product Name: "${productName}"
Original Description:
---
${originalDescription}
---

Original Description Length:
- Characters: ${originalCharCount}
- Words: ${originalWordCount}

Instructions:
1. Rewrite the "Original Description" to be highly compelling, benefit-driven, and optimized for Amazon.
2. The "enhanced_description" MUST be plain text only, without any markdown formatting (e.g., no \`\`\`, *, #).
3. The length (character and word count) of your "enhanced_description" should be in a similar range to the "Original Description Length" provided above. Aim for approximately the same number of words.
4. Focus on:
  - Clear and concise language.
  - Highlighting key benefits and unique selling points from the original.
  - Engaging tone that encourages purchase.
  - Persuasive and professional language.
5. Provide a brief "generation_context" (around 20-50 words) explaining your approach, key changes made, or focus areas during the rewrite.

Output ONLY a valid JSON object with the following exact schema:
{
"enhanced_description": "string",
"generation_context": "string"
}

Do NOT include any other text, explanations, or markdown formatting outside of this JSON object. Just the JSON.`

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.6,
        topK: 40,
        topP: 0.95,
        responseMimeType: "application/json",
      },
    })

    const response = result.response
    const jsonStr = response.text()

    let jsonStrTrimmed = jsonStr.trim()
    const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s
    const match = jsonStrTrimmed.match(fenceRegex)
    if (match && match[2]) {
      jsonStrTrimmed = match[2].trim()
    }

    let parsedData
    try {
      parsedData = JSON.parse(jsonStrTrimmed)
    } catch (e) {
      console.error("Failed to parse JSON response:", jsonStrTrimmed, e)
      return NextResponse.json(
        { error: "Failed to parse AI response as JSON. The response may not be in the expected format." },
        { status: 500 },
      )
    }

    if (!parsedData.enhanced_description || typeof parsedData.generation_context === "undefined") {
      console.error("Parsed JSON is missing required fields:", parsedData)
      return NextResponse.json(
        { error: "AI response JSON is missing 'enhanced_description' or 'generation_context'." },
        { status: 500 },
      )
    }

    return NextResponse.json({
      enhancedDescription: parsedData.enhanced_description.trim(),
      generationContext: parsedData.generation_context.trim(),
    })
  } catch (error) {
    console.error("Error in Gemini enhance-description API route:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "An unknown error occurred" },
      { status: 500 },
    )
  }
}

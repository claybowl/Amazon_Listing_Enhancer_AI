import { type NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"

// Get API key from environment variables
const OPENAI_API_KEY = process.env.OPENAI_API_KEY

// Initialize the OpenAI client
const openai = OPENAI_API_KEY ? new OpenAI({ apiKey: OPENAI_API_KEY }) : null

export async function HEAD(request: NextRequest) {
  // Simple HEAD request handler to check if the route exists
  return new NextResponse(null, { status: 200 })
}

export async function POST(request: NextRequest) {
  try {
    // Check if API key is configured
    if (!OPENAI_API_KEY || !openai) {
      return NextResponse.json({ error: "OpenAI API Key not configured on the server." }, { status: 500 })
    }

    // Parse request body
    let body
    try {
      body = await request.json()
    } catch (e) {
      return NextResponse.json({ error: "Invalid JSON in request body" }, { status: 400 })
    }

    const { originalDescription, productName } = body

    if (!originalDescription || !productName) {
      return NextResponse.json(
        { error: "Missing required fields: originalDescription or productName" },
        { status: 400 },
      )
    }

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
5. Provide a brief "generation_context" (around 20-50 words) explaining your approach, key changes made, or focus areas during the rewrite. For example, "Focused on making the tone more benefit-driven and restructuring for clarity while maintaining a similar length."

Output ONLY a valid JSON object with the following exact schema:
{
  "enhanced_description": "string",
  "generation_context": "string"
}

Do NOT include any other text, explanations, or markdown formatting outside of this JSON object. Just the JSON.`

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert Amazon listing copywriter that outputs only valid JSON.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: { type: "json_object" },
    })

    const content = response.choices[0]?.message?.content

    if (!content) {
      return NextResponse.json({ error: "No content returned from OpenAI" }, { status: 500 })
    }

    let parsedData
    try {
      parsedData = JSON.parse(content)
    } catch (e) {
      console.error("Failed to parse JSON response:", content, e)
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
    console.error("Error in OpenAI enhance-description API route:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "An unknown error occurred" },
      { status: 500 },
    )
  }
}

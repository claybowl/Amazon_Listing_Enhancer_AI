import { type NextRequest, NextResponse } from "next/server"

// Get API key from environment variables
const API_KEY = process.env.API_KEY || process.env.GEMINI_API_KEY

export async function POST(request: NextRequest) {
  try {
    // Check if API key is configured
    if (!API_KEY) {
      return NextResponse.json({ error: "API Key not configured on the server." }, { status: 500 })
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

    try {
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

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${API_KEY}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: prompt,
                  },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.6,
              topP: 0.95,
              topK: 40,
              maxOutputTokens: 1024,
              responseMimeType: "application/json",
            },
          }),
        },
      )

      if (!response.ok) {
        const errorData = await response.json()
        return NextResponse.json(
          { error: errorData.error?.message || "API request failed" },
          { status: response.status },
        )
      }

      const data = await response.json()
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text

      if (!content) {
        return NextResponse.json({ error: "No content returned from API" }, { status: 500 })
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
    } catch (apiError: any) {
      console.error("API error:", apiError)
      return NextResponse.json(
        {
          error: `API error: ${apiError.message || "Unknown error from API"}`,
        },
        { status: 500 },
      )
    }
  } catch (error: any) {
    console.error("Error in enhance-description API route:", error)
    return NextResponse.json(
      { error: `Server error: ${error.message || "An unknown error occurred"}` },
      { status: 500 },
    )
  }
}

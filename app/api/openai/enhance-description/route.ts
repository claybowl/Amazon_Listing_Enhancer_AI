import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  console.log(
    "Attempting to read OPENAI_API_KEY from Vercel env:",
    process.env.OPENAI_API_KEY ? "Key Found (masked)" : "Key NOT Found",
  )
  // Add a masked log if the key is found to avoid exposing it fully in logs
  if (process.env.OPENAI_API_KEY) {
    console.log("OPENAI_API_KEY starts with:", process.env.OPENAI_API_KEY.substring(0, 5))
  }

  try {
    // Check if API key is configured
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: "OpenAI API Key not configured on the server." }, { status: 500 })
    }

    // Parse request body
    const { originalDescription, productName, modelId } = await request.json()

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
5. Provide a brief "generation_context" (around 20-50 words) explaining your approach, key changes made, or focus areas during the rewrite.

Output ONLY a valid JSON object with the following exact schema:
{
"enhanced_description": "string",
"generation_context": "string"
}

Do NOT include any other text, explanations, or markdown formatting outside of this JSON object. Just the JSON.`

    // Use fetch API directly instead of OpenAI SDK to avoid browser environment issues
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: modelId || "gpt-4o",
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
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("OpenAI API error:", response.status, errorText)
      return NextResponse.json({ error: `OpenAI API error: ${response.status} ${errorText}` }, { status: 500 })
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content

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

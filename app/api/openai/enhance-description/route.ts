import { type NextRequest, NextResponse } from "next/server"

// Get API key from environment variables
const OPENAI_API_KEY = process.env.OPENAI_API_KEY

export async function HEAD(request: NextRequest) {
  // Simple HEAD request handler to check if the route exists
  return new NextResponse(null, { status: 200 })
}

export async function POST(request: NextRequest) {
  try {
    console.log("OpenAI enhance-description API route called")

    // Check if API key is configured
    if (!OPENAI_API_KEY) {
      console.log("OpenAI API Key not configured on the server")
      return NextResponse.json({ error: "OpenAI API Key not configured on the server." }, { status: 500 })
    }

    // Parse request body
    let body
    try {
      body = await request.json()
    } catch (e) {
      console.error("Failed to parse request body:", e)
      return NextResponse.json({ error: "Invalid JSON in request body" }, { status: 400 })
    }

    const { originalDescription, productName, modelId = "gpt-4o" } = body

    if (!originalDescription || !productName) {
      console.log("Missing required fields in request")
      return NextResponse.json(
        { error: "Missing required fields: originalDescription or productName" },
        { status: 400 },
      )
    }

    console.log(`Processing request for product: ${productName}`)

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

    try {
      console.log("Calling OpenAI API using fetch...")

      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: modelId,
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
          max_tokens: 2000,
          temperature: 0.7,
        }),
      })

      console.log("OpenAI API response status:", response.status)

      if (!response.ok) {
        const errorData = await response.json()
        console.error("OpenAI API error response:", errorData)

        if (response.status === 401) {
          return NextResponse.json({ error: "Invalid OpenAI API key" }, { status: 401 })
        }

        if (response.status === 429) {
          return NextResponse.json({ error: "OpenAI rate limit exceeded. Please try again later." }, { status: 429 })
        }

        return NextResponse.json(
          { error: errorData.error?.message || "OpenAI API request failed" },
          { status: response.status },
        )
      }

      const data = await response.json()
      console.log("OpenAI API response received successfully")

      const content = data.choices?.[0]?.message?.content

      if (!content) {
        console.error("No content returned from OpenAI")
        return NextResponse.json({ error: "No content returned from OpenAI" }, { status: 500 })
      }

      console.log("Parsing OpenAI response content")
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

      console.log("Successfully processed OpenAI response")
      return NextResponse.json({
        enhancedDescription: parsedData.enhanced_description.trim(),
        generationContext: parsedData.generation_context.trim(),
      })
    } catch (fetchError: any) {
      console.error("Error calling OpenAI API:", fetchError)
      console.error("Error details:", fetchError.message, fetchError.stack)

      return NextResponse.json(
        {
          error: `Failed to call OpenAI API: ${fetchError.message || "Unknown error"}`,
        },
        { status: 500 },
      )
    }
  } catch (error: any) {
    console.error("Unexpected error in OpenAI enhance-description API route:", error)
    console.error("Error stack:", error.stack)

    // Ensure we always return a JSON response
    return NextResponse.json(
      { error: `Server error: ${error.message || "An unknown error occurred"}` },
      { status: 500 },
    )
  }
}

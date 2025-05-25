// Groq service for text generation
export async function groqTextGeneration(
  modelId: string,
  originalDescription: string,
  productName: string,
  apiKey?: string,
): Promise<{ enhancedDescription: string; generationContext: string }> {
  try {
    // Use server-side API route if no API key provided
    if (!apiKey) {
      const response = await fetch("/api/groq/enhance-description", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          modelId,
          originalDescription,
          productName,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }

      return await response.json()
    }

    // Client-side API call with user's API key
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

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: modelId,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.6,
        max_tokens: 1024,
        response_format: { type: "json_object" },
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error?.message || `HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content

    if (!content) {
      throw new Error("No content returned from Groq API")
    }

    const parsedData = JSON.parse(content)

    if (!parsedData.enhanced_description || typeof parsedData.generation_context === "undefined") {
      throw new Error("AI response JSON is missing required fields")
    }

    return {
      enhancedDescription: parsedData.enhanced_description.trim(),
      generationContext: parsedData.generation_context.trim(),
    }
  } catch (error) {
    console.error("Groq API error:", error)
    throw error
  }
}

// Gemini provider implementation

import { GoogleGenerativeAI } from "@google/generative-ai"

export async function geminiTextGeneration(
  modelId: string,
  originalDescription: string,
  productName: string,
  apiKey?: string,
): Promise<{ enhancedDescription: string; generationContext: string }> {
  try {
    // First try to use the server API endpoint
    let serverResponse
    try {
      serverResponse = await fetch("/api/gemini/enhance-description", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          originalDescription,
          productName,
          modelId,
        }),
      })
    } catch (error) {
      console.error("Network error when calling server API:", error)
      // If we can't reach the server API, fall back to client-side implementation
      return await clientSideGeminiTextGeneration(modelId, originalDescription, productName, apiKey)
    }

    // Check if the response is JSON
    const contentType = serverResponse.headers.get("content-type")
    if (!contentType || !contentType.includes("application/json")) {
      console.error("Server returned non-JSON response")
      return await clientSideGeminiTextGeneration(modelId, originalDescription, productName, apiKey)
    }

    // Parse the JSON response
    const data = await serverResponse.json()

    // If server responds with success, use that response
    if (serverResponse.ok) {
      return data
    }

    // If server error is not related to missing API key, throw the error
    if (!data.error?.includes("API Key not configured")) {
      throw new Error(data.error || "Server error")
    }

    // If we're here, the server doesn't have an API key configured
    // Fall back to client-side implementation
    return await clientSideGeminiTextGeneration(modelId, originalDescription, productName, apiKey)
  } catch (error) {
    console.error("Error in geminiTextGeneration:", error)
    throw new Error(`Failed to generate text: ${error instanceof Error ? error.message : String(error)}`)
  }
}

export async function geminiImageGeneration(
  modelId: string,
  prompt: string,
  numberOfImages = 1,
  apiKey?: string,
): Promise<string[]> {
  try {
    // First try to use the server API endpoint
    let serverResponse
    try {
      serverResponse = await fetch("/api/gemini/generate-images", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt,
          numberOfImages,
          modelId,
        }),
      })
    } catch (error) {
      console.error("Network error when calling server API:", error)
      // If we can't reach the server API, fall back to client-side implementation
      return await clientSideGeminiImageGeneration(modelId, prompt, numberOfImages, apiKey)
    }

    // Check if the response is JSON
    const contentType = serverResponse.headers.get("content-type")
    if (!contentType || !contentType.includes("application/json")) {
      console.error("Server returned non-JSON response")
      return await clientSideGeminiImageGeneration(modelId, prompt, numberOfImages, apiKey)
    }

    // Parse the JSON response
    const data = await serverResponse.json()

    // If server responds with success, use that response
    if (serverResponse.ok) {
      return data.images
    }

    // If server error is not related to missing API key, throw the error
    if (!data.error?.includes("API Key not configured")) {
      throw new Error(data.error || "Server error")
    }

    // If we're here, the server doesn't have an API key configured
    // Fall back to client-side implementation
    return await clientSideGeminiImageGeneration(modelId, prompt, numberOfImages, apiKey)
  } catch (error) {
    console.error("Error in geminiImageGeneration:", error)
    throw new Error(`Failed to generate images: ${error instanceof Error ? error.message : String(error)}`)
  }
}

// Helper function for client-side text generation
async function clientSideGeminiTextGeneration(
  modelId: string,
  originalDescription: string,
  productName: string,
  apiKey?: string,
): Promise<{ enhancedDescription: string; generationContext: string }> {
  if (!apiKey) {
    throw new Error("No API key available. Please provide your Gemini API key.")
  }

  // Import GoogleGenAI dynamically only when needed for client-side fallback
  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({ model: modelId })

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
  let jsonStr = response.text()

  // Handle potential markdown code blocks in the response
  const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s
  const match = jsonStr.match(fenceRegex)
  if (match && match[2]) {
    jsonStr = match[2].trim()
  }

  let parsedData
  try {
    parsedData = JSON.parse(jsonStr)
  } catch (e) {
    console.error("Failed to parse JSON response:", jsonStr, e)
    throw new Error("Failed to parse AI response as JSON. The response may not be in the expected format.")
  }

  if (!parsedData.enhanced_description || typeof parsedData.generation_context === "undefined") {
    console.error("Parsed JSON is missing required fields:", parsedData)
    throw new Error("AI response JSON is missing 'enhanced_description' or 'generation_context'.")
  }

  return {
    enhancedDescription: parsedData.enhanced_description.trim(),
    generationContext: parsedData.generation_context.trim(),
  }
}

// Helper function for client-side image generation
async function clientSideGeminiImageGeneration(
  modelId: string,
  prompt: string,
  numberOfImages = 1,
  apiKey?: string,
): Promise<string[]> {
  if (!apiKey) {
    throw new Error("No API key available. Please provide your Gemini API key.")
  }

  try {
    // Import GoogleGenAI dynamically only when needed for client-side fallback
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: "gemini-pro" })

    if (numberOfImages < 1 || numberOfImages > 4) {
      throw new Error("Number of images must be between 1 and 4.")
    }

    // Since Gemini doesn't support direct image generation, create enhanced descriptions
    const enhancedPrompt = `Create a detailed, professional product image description for: ${prompt}. 
    Include specific details about lighting, composition, background, and visual style that would make this product look appealing for an Amazon listing. 
    Focus on commercial photography standards with clean, professional presentation.`

    const result = await model.generateContent(enhancedPrompt)
    const description = result.response.text()

    console.log("Generated image description with Gemini:", description)

    // Return placeholder images with enhanced queries
    const images = Array.from({ length: numberOfImages }, (_, i) => {
      const imageQuery = `${prompt} professional product photo style ${i + 1}`
      return `/placeholder.svg?height=512&width=512&query=${encodeURIComponent(imageQuery)}`
    })

    return images
  } catch (error) {
    console.error("Error in Gemini image generation:", error)

    // Return basic placeholders as final fallback
    return Array.from(
      { length: numberOfImages },
      (_, i) => `/placeholder.svg?height=512&width=512&query=${encodeURIComponent(prompt)} ${i + 1}`,
    )
  }
}

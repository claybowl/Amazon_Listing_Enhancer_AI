// This file now acts as a client-side service that calls our server API endpoints

// Variable to store the user's API key for client-side fallback
let clientApiKey = ""

export const setApiKey = (key: string) => {
  clientApiKey = key
}

export const getApiKey = () => {
  return clientApiKey
}

export const rewriteProductDescription = async (
  originalDescription: string,
  productName: string,
): Promise<{ enhancedDescription: string; generationContext: string }> => {
  try {
    // First try to use the server API endpoint
    const serverResponse = await fetch("/api/enhance-description", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ originalDescription, productName }),
    })

    // If server responds with success, use that response
    if (serverResponse.ok) {
      return await serverResponse.json()
    }

    // If server error is not related to missing API key, throw the error
    const errorData = await serverResponse.json()
    if (!errorData.error?.includes("API Key not configured")) {
      throw new Error(errorData.error || "Server error")
    }

    // If we're here, the server doesn't have an API key configured
    // Fall back to client-side implementation if user has provided their own key
    if (!clientApiKey) {
      throw new Error("No API key available. Please provide your Gemini API key.")
    }

    // Import the GoogleGenAI dynamically only when needed for client-side fallback
    const { GoogleGenAI } = await import("@google/genai")
    const ai = new GoogleGenAI({ apiKey: clientApiKey })
    const TEXT_MODEL_NAME = "gemini-2.5-flash-preview-04-17"

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

    const response = await ai.models.generateContent({
      model: TEXT_MODEL_NAME,
      contents: prompt,
      config: {
        temperature: 0.6,
        topP: 0.95,
        topK: 40,
        responseMimeType: "application/json",
      },
    })

    let jsonStr = response.text.trim()
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
  } catch (error) {
    console.error("Error in rewriteProductDescription:", error)
    throw new Error(`Failed to rewrite description: ${error instanceof Error ? error.message : String(error)}`)
  }
}

export const generateProductImages = async (prompt: string, numberOfImages = 1): Promise<string[]> => {
  try {
    // First try to use the server API endpoint
    const serverResponse = await fetch("/api/generate-images", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prompt, numberOfImages }),
    })

    // If server responds with success, use that response
    if (serverResponse.ok) {
      const data = await serverResponse.json()
      return data.images
    }

    // If server error is not related to missing API key, throw the error
    const errorData = await serverResponse.json()
    if (!errorData.error?.includes("API Key not configured")) {
      throw new Error(errorData.error || "Server error")
    }

    // If we're here, the server doesn't have an API key configured
    // Fall back to client-side implementation if user has provided their own key
    if (!clientApiKey) {
      throw new Error("No API key available. Please provide your Gemini API key.")
    }

    // Import the GoogleGenAI dynamically only when needed for client-side fallback
    const { GoogleGenAI } = await import("@google/genai")
    const ai = new GoogleGenAI({ apiKey: clientApiKey })
    const IMAGE_MODEL_NAME = "imagen-3.0-generate-002"

    if (numberOfImages < 1 || numberOfImages > 4) {
      throw new Error("Number of images must be between 1 and 4.")
    }

    const fullPrompt = `**VERY IMPORTANT: Read all instructions carefully.**
You are an AI image generator tasked with creating a product image for an Amazon listing.

**Product to Depict (Primary Focus):**
The core task is to accurately render the product described in the "Product Context" below. The product's appearance, features, and details as described MUST be depicted as faithfully and identically as possible. Do NOT alter the product itself from how it is described.

**Product Context (This describes the product you must render accurately):**
---
${prompt}
---

**Image Style and Scene (Secondary - This is what you change around the product):**
While the product depiction MUST remain true to the "Product Context", the surrounding scene and environment SHOULD be changed to be:
- Highly appealing and fashionable.
- Professional and commercial quality, suitable for a premium Amazon listing.
- Well-lit, clear, and high-resolution.
- The goal is to present the *exact same product* (as per "Product Context") in a *new, enhanced, stylish setting* that makes it look highly desirable.

**Key Rule: Do not change the product's described features. Only change the scene, background, and styling around the product.**
Generate an image that makes this specific product look highly desirable in its new fashionable environment.`

    const response = await ai.models.generateImages({
      model: IMAGE_MODEL_NAME,
      prompt: fullPrompt,
      config: {
        numberOfImages: numberOfImages,
        outputMimeType: "image/jpeg",
      },
    })

    if (!response.generatedImages || response.generatedImages.length === 0) {
      throw new Error("No images generated by API.")
    }

    return response.generatedImages.map((img) => img.image.imageBytes) // imageBytes is base64
  } catch (error) {
    console.error("Error in generateProductImages:", error)
    throw new Error(`Failed to generate images: ${error instanceof Error ? error.message : String(error)}`)
  }
}

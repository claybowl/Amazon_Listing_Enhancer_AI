// OpenRouter provider implementation

export async function openRouterTextGeneration(
  modelId: string,
  originalDescription: string,
  productName: string,
  apiKey?: string,
): Promise<{ enhancedDescription: string; generationContext: string }> {
  try {
    // First try to use the server API endpoint
    let serverResponse
    try {
      serverResponse = await fetch("/api/openrouter/enhance-description", {
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
      return await clientSideOpenRouterTextGeneration(modelId, originalDescription, productName, apiKey)
    }

    // Check if the response is JSON
    const contentType = serverResponse.headers.get("content-type")
    if (!contentType || !contentType.includes("application/json")) {
      console.error("Server returned non-JSON response")
      return await clientSideOpenRouterTextGeneration(modelId, originalDescription, productName, apiKey)
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
    return await clientSideOpenRouterTextGeneration(modelId, originalDescription, productName, apiKey)
  } catch (error) {
    console.error("Error in openRouterTextGeneration:", error)
    throw new Error(`Failed to generate text: ${error instanceof Error ? error.message : String(error)}`)
  }
}

export async function openRouterImageGeneration(
  modelId: string,
  prompt: string,
  numberOfImages = 1,
  apiKey?: string,
): Promise<string[]> {
  try {
    // First try to use the server API endpoint
    let serverResponse
    try {
      serverResponse = await fetch("/api/openrouter/generate-images", {
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
      return await clientSideOpenRouterImageGeneration(modelId, prompt, numberOfImages, apiKey)
    }

    // Check if the response is JSON
    const contentType = serverResponse.headers.get("content-type")
    if (!contentType || !contentType.includes("application/json")) {
      console.error("Server returned non-JSON response")
      return await clientSideOpenRouterImageGeneration(modelId, prompt, numberOfImages, apiKey)
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
    return await clientSideOpenRouterImageGeneration(modelId, prompt, numberOfImages, apiKey)
  } catch (error) {
    console.error("Error in openRouterImageGeneration:", error)
    throw new Error(`Failed to generate images: ${error instanceof Error ? error.message : String(error)}`)
  }
}

// Helper function for client-side text generation
async function clientSideOpenRouterTextGeneration(
  modelId: string,
  originalDescription: string,
  productName: string,
  apiKey?: string,
): Promise<{ enhancedDescription: string; generationContext: string }> {
  if (!apiKey) {
    throw new Error("No API key available. Please provide your OpenRouter API key.")
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

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": window.location.origin,
        "X-Title": "Amazon Listing Enhancer AI",
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
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error?.message || "Failed to generate text with OpenRouter")
    }

    const data = await response.json()
    const content = data.choices[0]?.message?.content

    if (!content) {
      throw new Error("No content returned from OpenRouter")
    }

    let parsedData
    try {
      parsedData = JSON.parse(content)
    } catch (e) {
      console.error("Failed to parse JSON response:", content, e)
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
    console.error("Error in clientSideOpenRouterTextGeneration:", error)
    throw new Error(`Failed to generate text: ${error instanceof Error ? error.message : String(error)}`)
  }
}

// Helper function for client-side image generation
async function clientSideOpenRouterImageGeneration(
  modelId: string,
  prompt: string,
  numberOfImages = 1,
  apiKey?: string,
): Promise<string[]> {
  if (!apiKey) {
    throw new Error("No API key available. Please provide your OpenRouter API key.")
  }

  try {
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

    // For image generation with OpenRouter, we'll use different approaches based on the model
    // Some models support direct image generation, others might need to use text-to-image capabilities

    // For SDXL and similar models
    if (modelId.includes("sdxl") || modelId.includes("stability")) {
      const imagePromises = []

      // Create the specified number of images
      for (let i = 0; i < numberOfImages; i++) {
        imagePromises.push(
          fetch("https://openrouter.ai/api/v1/images/generations", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${apiKey}`,
              "HTTP-Referer": window.location.origin,
              "X-Title": "Amazon Listing Enhancer AI",
            },
            body: JSON.stringify({
              model: modelId,
              prompt: fullPrompt,
              n: 1,
              size: "1024x1024",
              response_format: "b64_json",
            }),
          }).then((res) => res.json()),
        )
      }

      // Wait for all image generation to complete
      const results = await Promise.all(imagePromises)

      // Check for errors in any of the results
      for (const result of results) {
        if (result.error) {
          throw new Error(result.error.message || "Failed to generate images with OpenRouter")
        }
      }

      // Extract base64 images from results
      const images = results.flatMap((result) => result.data.map((img: any) => img.b64_json)).filter(Boolean)

      if (images.length === 0) {
        throw new Error("No images generated by OpenRouter")
      }

      return images
    } else {
      // For models that don't support direct image generation, we'll use a text-to-image approach
      // This is a simplified implementation and might need to be adjusted based on the specific model
      throw new Error(`Direct image generation not supported for model ${modelId}. Please use a different model.`)
    }
  } catch (error) {
    console.error("Error in clientSideOpenRouterImageGeneration:", error)
    throw new Error(`Failed to generate images: ${error instanceof Error ? error.message : String(error)}`)
  }
}

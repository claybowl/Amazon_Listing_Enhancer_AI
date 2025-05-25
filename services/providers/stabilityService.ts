// Stability AI provider implementation

export async function stabilityImageGeneration(
  modelId: string,
  prompt: string,
  numberOfImages = 1,
  apiKey?: string,
): Promise<string[]> {
  try {
    // First try to use the server API endpoint
    let serverResponse
    try {
      serverResponse = await fetch("/api/stability/generate-images", {
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
      return await clientSideStabilityImageGeneration(modelId, prompt, numberOfImages, apiKey)
    }

    // Check if the response is JSON
    const contentType = serverResponse.headers.get("content-type")
    if (!contentType || !contentType.includes("application/json")) {
      console.error("Server returned non-JSON response")
      return await clientSideStabilityImageGeneration(modelId, prompt, numberOfImages, apiKey)
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
    return await clientSideStabilityImageGeneration(modelId, prompt, numberOfImages, apiKey)
  } catch (error) {
    console.error("Error in stabilityImageGeneration:", error)
    throw new Error(`Failed to generate images: ${error instanceof Error ? error.message : String(error)}`)
  }
}

// Helper function for client-side image generation
async function clientSideStabilityImageGeneration(
  modelId: string,
  prompt: string,
  numberOfImages = 1,
  apiKey?: string,
): Promise<string[]> {
  if (!apiKey) {
    throw new Error("No API key available. Please provide your Stability AI API key.")
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

    const response = await fetch(`https://api.stability.ai/v1/generation/${modelId}/text-to-image`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        Accept: "application/json",
      },
      body: JSON.stringify({
        text_prompts: [
          {
            text: fullPrompt,
            weight: 1,
          },
        ],
        cfg_scale: 7,
        height: 1024,
        width: 1024,
        samples: numberOfImages,
        steps: 30,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || "Failed to generate images with Stability AI")
    }

    const data = await response.json()

    // Extract base64 images from the response
    const images = data.artifacts.map((artifact: any) => artifact.base64)

    return images
  } catch (error) {
    console.error("Error generating images with Stability AI:", error)
    throw new Error(`Failed to generate images: ${error instanceof Error ? error.message : String(error)}`)
  }
}

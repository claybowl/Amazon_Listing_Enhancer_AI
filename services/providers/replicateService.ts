// Replicate provider implementation

export async function replicateImageGeneration(
  modelId: string,
  prompt: string,
  numberOfImages = 1,
  apiKey?: string,
): Promise<string[]> {
  try {
    // First try to use the server API endpoint
    let serverResponse
    try {
      serverResponse = await fetch("/api/replicate/generate-images", {
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
      return await clientSideReplicateImageGeneration(modelId, prompt, numberOfImages, apiKey)
    }

    // Check if the response is JSON
    const contentType = serverResponse.headers.get("content-type")
    if (!contentType || !contentType.includes("application/json")) {
      console.error("Server returned non-JSON response")
      return await clientSideReplicateImageGeneration(modelId, prompt, numberOfImages, apiKey)
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
    return await clientSideReplicateImageGeneration(modelId, prompt, numberOfImages, apiKey)
  } catch (error) {
    console.error("Error in replicateImageGeneration:", error)
    throw new Error(`Failed to generate images: ${error instanceof Error ? error.message : String(error)}`)
  }
}

// Helper function for client-side image generation
async function clientSideReplicateImageGeneration(
  modelId: string,
  prompt: string,
  numberOfImages = 1,
  apiKey?: string,
): Promise<string[]> {
  if (!apiKey) {
    throw new Error("No API key available. Please provide your Replicate API key.")
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

    // Create an array to store base64 images
    const base64Images = []

    // Generate the specified number of images
    for (let i = 0; i < numberOfImages; i++) {
      // Start the prediction
      const startResponse = await fetch("https://api.replicate.com/v1/predictions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${apiKey}`,
        },
        body: JSON.stringify({
          version: modelId,
          input: {
            prompt: fullPrompt,
            negative_prompt:
              "low quality, blurry, distorted, deformed, disfigured, bad anatomy, watermark, signature, text",
            width: 1024,
            height: 1024,
          },
        }),
      })

      if (!startResponse.ok) {
        const error = await startResponse.json()
        throw new Error(error.detail || "Failed to start prediction with Replicate")
      }

      const prediction = await startResponse.json()

      // Poll for the prediction result
      let result
      let status = prediction.status

      while (status !== "succeeded" && status !== "failed" && status !== "canceled") {
        // Wait for 1 second before polling again
        await new Promise((resolve) => setTimeout(resolve, 1000))

        const pollResponse = await fetch(`https://api.replicate.com/v1/predictions/${prediction.id}`, {
          headers: {
            Authorization: `Token ${apiKey}`,
          },
        })

        if (!pollResponse.ok) {
          const error = await pollResponse.json()
          throw new Error(error.detail || "Failed to poll prediction with Replicate")
        }

        result = await pollResponse.json()
        status = result.status
      }

      if (status === "failed" || status === "canceled") {
        throw new Error(result.error || "Prediction failed or was canceled")
      }

      // The output is an array of image URLs
      // We need to fetch each image and convert it to base64
      const imageUrls = result.output
      if (!imageUrls || !Array.isArray(imageUrls) || imageUrls.length === 0) {
        throw new Error("No image URLs returned from Replicate")
      }

      // Fetch and convert the image to base64
      const imageUrl = imageUrls[0] // Get the first image URL
      const imageResponse = await fetch(imageUrl)

      if (!imageResponse.ok) {
        throw new Error("Failed to fetch image from URL")
      }

      const imageBlob = await imageResponse.blob()

      // Convert blob to base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onloadend = () => {
          const base64data = reader.result as string
          // Extract the base64 part (remove the data URL prefix)
          const base64 = base64data.split(",")[1]
          resolve(base64)
        }
        reader.onerror = reject
        reader.readAsDataURL(imageBlob)
      })

      base64Images.push(base64)
    }

    return base64Images
  } catch (error) {
    console.error("Error generating images with Replicate:", error)
    throw new Error(`Failed to generate images: ${error instanceof Error ? error.message : String(error)}`)
  }
}

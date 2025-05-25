// OpenAI provider implementation

export async function openAITextGeneration(
  modelId: string,
  originalDescription: string,
  productName: string,
  apiKey?: string,
): Promise<{ enhancedDescription: string; generationContext: string }> {
  try {
    console.log("Starting openAITextGeneration with model:", modelId)

    // First try to use the server API endpoint
    let serverResponse
    try {
      console.log("Calling server API endpoint for text generation")
      serverResponse = await fetch("/api/openai/enhance-description", {
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

      console.log("Server response status:", serverResponse.status)
    } catch (error) {
      console.error("Network error when calling server API:", error)
      // If we can't reach the server API, fall back to client-side implementation
      return await clientSideOpenAITextGeneration(modelId, originalDescription, productName, apiKey)
    }

    // Check if the response is JSON
    const contentType = serverResponse.headers.get("content-type")
    console.log("Response content type:", contentType)

    if (!contentType || !contentType.includes("application/json")) {
      console.error("Server returned non-JSON response with status:", serverResponse.status)

      // Try to get the response text for debugging
      try {
        const text = await serverResponse.text()
        console.error("Response text:", text.substring(0, 500) + (text.length > 500 ? "..." : ""))
      } catch (e) {
        console.error("Could not read response text:", e)
      }

      // Fall back to client-side implementation
      return await clientSideOpenAITextGeneration(modelId, originalDescription, productName, apiKey)
    }

    // Parse the JSON response
    let data
    try {
      data = await serverResponse.json()
      console.log("Server response parsed successfully")
    } catch (error) {
      console.error("Error parsing JSON response:", error)
      return await clientSideOpenAITextGeneration(modelId, originalDescription, productName, apiKey)
    }

    // If server responds with success, use that response
    if (serverResponse.ok) {
      console.log("Server returned successful response")
      return data
    }

    console.error("Server returned error:", data)

    // If server error is not related to missing API key, throw the error
    if (!data.error?.includes("API Key not configured")) {
      throw new Error(data.error || "Server error")
    }

    // If we're here, the server doesn't have an API key configured
    // Fall back to client-side implementation
    console.log("Falling back to client-side implementation")
    return await clientSideOpenAITextGeneration(modelId, originalDescription, productName, apiKey)
  } catch (error) {
    console.error("Error in openAITextGeneration:", error)
    throw new Error(`Failed to generate text: ${error instanceof Error ? error.message : String(error)}`)
  }
}

export async function openAIImageGeneration(
  modelId: string,
  prompt: string,
  numberOfImages = 1,
  apiKey?: string,
): Promise<string[]> {
  try {
    console.log("Starting openAIImageGeneration with model:", modelId)

    // First try to use the server API endpoint
    let serverResponse
    try {
      console.log("Calling server API endpoint for image generation")
      serverResponse = await fetch("/api/openai/generate-images", {
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

      console.log("Server response status:", serverResponse.status)
    } catch (error) {
      console.error("Network error when calling server API:", error)
      // If we can't reach the server API, fall back to client-side implementation
      return await clientSideOpenAIImageGeneration(modelId, prompt, numberOfImages, apiKey)
    }

    // Check if the response is JSON
    const contentType = serverResponse.headers.get("content-type")
    console.log("Response content type:", contentType)

    if (!contentType || !contentType.includes("application/json")) {
      console.error("Server returned non-JSON response with status:", serverResponse.status)

      // Try to get the response text for debugging
      try {
        const text = await serverResponse.text()
        console.error("Response text:", text.substring(0, 500) + (text.length > 500 ? "..." : ""))
      } catch (e) {
        console.error("Could not read response text:", e)
      }

      // Fall back to client-side implementation
      return await clientSideOpenAIImageGeneration(modelId, prompt, numberOfImages, apiKey)
    }

    // Parse the JSON response
    let data
    try {
      data = await serverResponse.json()
      console.log("Server response parsed successfully")
    } catch (error) {
      console.error("Error parsing JSON response:", error)
      return await clientSideOpenAIImageGeneration(modelId, prompt, numberOfImages, apiKey)
    }

    // If server responds with success, use that response
    if (serverResponse.ok) {
      console.log("Server returned successful response")
      return data.images
    }

    console.error("Server returned error:", data)

    // If server error is not related to missing API key, throw the error
    if (!data.error?.includes("API Key not configured")) {
      throw new Error(data.error || "Server error")
    }

    // If we're here, the server doesn't have an API key configured
    // Fall back to client-side implementation
    console.log("Falling back to client-side implementation")
    return await clientSideOpenAIImageGeneration(modelId, prompt, numberOfImages, apiKey)
  } catch (error) {
    console.error("Error in openAIImageGeneration:", error)
    throw new Error(`Failed to generate images: ${error instanceof Error ? error.message : String(error)}`)
  }
}

// Helper function for client-side text generation
async function clientSideOpenAITextGeneration(
  modelId: string,
  originalDescription: string,
  productName: string,
  apiKey?: string,
): Promise<{ enhancedDescription: string; generationContext: string }> {
  console.log("Using client-side OpenAI text generation")

  if (!apiKey) {
    throw new Error("No API key available. Please provide your OpenAI API key.")
  }

  try {
    // Import OpenAI dynamically only when needed for client-side fallback
    const { OpenAI } = await import("openai")
    const openai = new OpenAI({ apiKey, dangerouslyAllowBrowser: true })

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

    console.log("Calling OpenAI API from client-side")

    const response = await openai.chat.completions.create({
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
    })

    console.log("OpenAI client-side API response received")

    const content = response.choices[0]?.message?.content

    if (!content) {
      throw new Error("No content returned from OpenAI")
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
    console.error("Error in client-side OpenAI text generation:", error)
    throw new Error(`Failed to generate text: ${error instanceof Error ? error.message : String(error)}`)
  }
}

// Helper function for client-side image generation
async function clientSideOpenAIImageGeneration(
  modelId: string,
  prompt: string,
  numberOfImages = 1,
  apiKey?: string,
): Promise<string[]> {
  console.log("Using client-side OpenAI image generation")

  if (!apiKey) {
    throw new Error("No API key available. Please provide your OpenAI API key.")
  }

  try {
    // Import OpenAI dynamically only when needed for client-side fallback
    const { OpenAI } = await import("openai")
    const openai = new OpenAI({ apiKey, dangerouslyAllowBrowser: true })

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

    console.log("Calling OpenAI image API from client-side")

    // Create an array to store promises for image generation
    const imagePromises = []

    // Create the specified number of images
    for (let i = 0; i < numberOfImages; i++) {
      imagePromises.push(
        openai.images.generate({
          model: modelId,
          prompt: fullPrompt,
          n: 1,
          size: "1024x1024",
          response_format: "b64_json",
        }),
      )
    }

    // Wait for all image generation to complete
    const results = await Promise.all(imagePromises)

    // Extract base64 images from results
    const images = results.flatMap((result) => result.data.map((img) => img.b64_json)).filter(Boolean)

    if (images.length === 0) {
      throw new Error("No images generated by API.")
    }

    return images
  } catch (error) {
    console.error("Error in client-side OpenAI image generation:", error)
    throw new Error(`Failed to generate images: ${error instanceof Error ? error.message : String(error)}`)
  }
}

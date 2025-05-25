// Gemini provider implementation

export async function geminiTextGeneration(
  modelId: string,
  originalDescription: string,
  productName: string,
  apiKey?: string,
): Promise<{ enhancedDescription: string; generationContext: string }> {
  try {
    // Only use server API endpoint - no client-side fallback
    console.log("Calling Gemini server API for text generation")
    const serverResponse = await fetch("/api/gemini/enhance-description", {
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

    // Log response details for debugging
    console.log("Server response status:", serverResponse.status)

    // Check if the response is JSON
    const contentType = serverResponse.headers.get("content-type")
    if (!contentType || !contentType.includes("application/json")) {
      console.error("Server returned non-JSON response with status:", serverResponse.status)
      console.error("Content-Type:", contentType)

      // Try to get the response text for debugging
      try {
        const text = await serverResponse.text()
        console.error("Response text:", text.substring(0, 500) + (text.length > 500 ? "..." : ""))
      } catch (e) {
        console.error("Could not read response text:", e)
      }

      // Instead of falling back to client-side, recommend using a different provider
      throw new Error("Gemini API is currently unavailable. Please try using OpenAI or OpenRouter models instead.")
    }

    // Parse the JSON response
    let data
    try {
      data = await serverResponse.json()
    } catch (error) {
      console.error("Error parsing JSON response:", error)
      throw new Error("Failed to parse server response. Please try using OpenAI or OpenRouter models instead.")
    }

    // If server responds with success, use that response
    if (serverResponse.ok) {
      return data
    }

    // Log error details
    console.error("Server returned error:", data)

    // If server error is not related to missing API key, throw the error
    throw new Error(data.error || "Server error. Please try using OpenAI or OpenRouter models instead.")
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
  // Gemini image generation is not currently supported
  throw new Error(
    "Gemini image generation is not currently available. Please use a different provider like OpenAI or Stability AI for image generation.",
  )
}

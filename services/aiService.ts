import { type AIModel, AIProvider, ModelType } from "../types/models"
import type { SourceImageOptions } from "../types" // Import the common type

// Text generation service - now only uses server-side endpoints
export async function generateEnhancedDescription(
  model: AIModel,
  originalDescription: string,
  productName: string,
  tone?: string,
  style?: string,
): Promise<{ enhancedDescription: string; generationContext: string }> {
  if (model.type !== ModelType.Text) {
    throw new Error(`Model ${model.id} is not a text generation model`)
  }

  let endpoint: string
  switch (model.provider) {
    case AIProvider.OpenAI:
      endpoint = "/api/openai/enhance-description"
      break
    case AIProvider.Gemini:
      endpoint = "/api/gemini/enhance-description"
      break
    case AIProvider.OpenRouter:
      endpoint = "/api/openrouter/enhance-description"
      break
    case AIProvider.Groq:
      endpoint = "/api/groq/enhance-description"
      break
    case AIProvider.XAI:
      endpoint = "/api/xai/enhance-description"
      break
    default:
      throw new Error(`Provider ${model.provider} is not supported for text generation`)
  }

  try {
    console.log(`Making request to: ${endpoint}`)
    console.log(`Request payload:`, { modelId: model.id, originalDescription, productName, tone, style })

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        modelId: model.id,
        originalDescription,
        productName,
        tone,
        style,
      }),
    })

    console.log(`API Response Status: ${response.status}`)
    console.log(`API Response Content-Type: ${response.headers.get("content-type")}`)

    // Get the response text first
    const responseText = await response.text()
    console.log(`Raw response text:`, responseText)

    if (!response.ok) {
      // Try to parse as JSON first, fallback to text
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`

      if (responseText) {
        try {
          const errorData = JSON.parse(responseText)
          errorMessage = errorData.error || errorMessage
        } catch (parseError) {
          // If JSON parsing fails, use the raw text
          errorMessage = responseText || errorMessage
        }
      }

      throw new Error(errorMessage)
    }

    // Parse the successful response
    try {
      const data = JSON.parse(responseText)
      return data
    } catch (parseError) {
      console.error("Failed to parse successful response as JSON:", parseError)
      throw new Error(`Server returned invalid JSON response: ${responseText}`)
    }
  } catch (error) {
    console.error("Error in generateEnhancedDescription:", error)
    if (error instanceof Error) {
      throw error
    }
    throw new Error(`Failed to generate enhanced description: ${String(error)}`)
  }
}

// Image generation service - now only uses server-side endpoints
export async function generateProductImages(
  model: AIModel,
  prompt: string,
  numberOfImages = 1,
  sourceImageOptions?: SourceImageOptions, // Use imported type
): Promise<string[]> {
  if (model.type !== ModelType.Image) {
    throw new Error(`Model ${model.id} is not an image generation model`)
  }

  let endpoint: string
  switch (model.provider) {
    case AIProvider.OpenAI:
      endpoint = "/api/openai/generate-images"
      break
    case AIProvider.Gemini:
      endpoint = "/api/gemini/generate-images"
      break
    case AIProvider.Stability:
      endpoint = "/api/stability/generate-images"
      break
    case AIProvider.Replicate:
      endpoint = "/api/replicate/generate-images"
      break
    case AIProvider.OpenRouter:
      endpoint = "/api/openrouter/generate-images"
      break
    default:
      throw new Error(`Provider ${model.provider} is not supported for image generation`)
  }

  try {
    console.log(`Making image request to: ${endpoint}`)

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        modelId: model.id,
        prompt,
        numberOfImages,
        ...(sourceImageOptions?.sourceImage && { sourceImage: sourceImageOptions.sourceImage }),
        ...(sourceImageOptions?.imageStrength !== undefined && { imageStrength: sourceImageOptions.imageStrength }),
      }),
    })

    console.log(`Image API Response Status: ${response.status}`)

    // Get the response text first
    const responseText = await response.text()
    console.log(`Raw image response text:`, responseText)

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`

      if (responseText) {
        try {
          const errorData = JSON.parse(responseText)
          errorMessage = errorData.error || errorMessage
        } catch (parseError) {
          errorMessage = responseText || errorMessage
        }
      }

      throw new Error(errorMessage)
    }

    // Parse the successful response
    try {
      const data = JSON.parse(responseText)
      return data.images || []
    } catch (parseError) {
      console.error("Failed to parse successful image response as JSON:", parseError)
      throw new Error(`Server returned invalid JSON response: ${responseText}`)
    }
  } catch (error) {
    console.error("Error in generateProductImages:", error)
    if (error instanceof Error) {
      throw error
    }
    throw new Error(`Failed to generate images: ${String(error)}`)
  }
}

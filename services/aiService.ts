import { type AIModel, AIProvider, ModelType } from "../types/models"

// Text generation service - now only uses server-side endpoints
export async function generateEnhancedDescription(
  model: AIModel,
  originalDescription: string,
  productName: string,
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

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      modelId: model.id,
      originalDescription,
      productName,
    }),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
    throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
  }

  return await response.json()
}

// Image generation service - now only uses server-side endpoints
export async function generateProductImages(model: AIModel, prompt: string, numberOfImages = 1): Promise<string[]> {
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

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      modelId: model.id,
      prompt,
      numberOfImages,
    }),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
    throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
  }

  const data = await response.json()
  return data.images || []
}

import { type AIModel, AIProvider, ModelType } from "../types/models"
import { openAITextGeneration, openAIImageGeneration } from "./providers/openaiService"
import { geminiTextGeneration, geminiImageGeneration } from "./providers/geminiService"
import { stabilityImageGeneration } from "./providers/stabilityService"
import { replicateImageGeneration } from "./providers/replicateService"
import { openRouterTextGeneration, openRouterImageGeneration } from "./providers/openrouterService"

// Text generation service
export async function generateEnhancedDescription(
  model: AIModel,
  originalDescription: string,
  productName: string,
  apiKey?: string,
): Promise<{ enhancedDescription: string; generationContext: string }> {
  if (model.type !== ModelType.Text) {
    throw new Error(`Model ${model.id} is not a text generation model`)
  }

  switch (model.provider) {
    case AIProvider.OpenAI:
      return await openAITextGeneration(model.id, originalDescription, productName, apiKey)
    case AIProvider.Gemini:
      return await geminiTextGeneration(model.id, originalDescription, productName, apiKey)
    case AIProvider.OpenRouter:
      return await openRouterTextGeneration(model.id, originalDescription, productName, apiKey)
    default:
      throw new Error(`Provider ${model.provider} is not supported for text generation`)
  }
}

// Image generation service
export async function generateProductImages(
  model: AIModel,
  prompt: string,
  numberOfImages = 1,
  apiKey?: string,
): Promise<string[]> {
  if (model.type !== ModelType.Image) {
    throw new Error(`Model ${model.id} is not an image generation model`)
  }

  switch (model.provider) {
    case AIProvider.OpenAI:
      return await openAIImageGeneration(model.id, prompt, numberOfImages, apiKey)
    case AIProvider.Gemini:
      return await geminiImageGeneration(model.id, prompt, numberOfImages, apiKey)
    case AIProvider.Stability:
      return await stabilityImageGeneration(model.id, prompt, numberOfImages, apiKey)
    case AIProvider.Replicate:
      return await replicateImageGeneration(model.id, prompt, numberOfImages, apiKey)
    case AIProvider.OpenRouter:
      return await openRouterImageGeneration(model.id, prompt, numberOfImages, apiKey)
    default:
      throw new Error(`Provider ${model.provider} is not supported for image generation`)
  }
}

// Check if API key is valid
export async function checkApiKey(provider: AIProvider, apiKey: string): Promise<boolean> {
  try {
    switch (provider) {
      case AIProvider.OpenAI:
        // Make a minimal API call to check if the key is valid
        const openaiResponse = await fetch("https://api.openai.com/v1/models", {
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
        })
        return openaiResponse.ok

      case AIProvider.Gemini:
        // For Gemini, we'll make a minimal API call
        const geminiResponse = await fetch("https://generativelanguage.googleapis.com/v1beta/models?key=" + apiKey)
        return geminiResponse.ok

      case AIProvider.Stability:
        // For Stability AI
        const stabilityResponse = await fetch("https://api.stability.ai/v1/engines/list", {
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
        })
        return stabilityResponse.ok

      case AIProvider.Replicate:
        // For Replicate
        const replicateResponse = await fetch("https://api.replicate.com/v1/models", {
          headers: {
            Authorization: `Token ${apiKey}`,
          },
        })
        return replicateResponse.ok

      case AIProvider.OpenRouter:
        // For OpenRouter
        const openRouterResponse = await fetch("https://openrouter.ai/api/v1/models", {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "HTTP-Referer": window.location.origin,
            "X-Title": "Amazon Listing Enhancer AI",
          },
        })
        return openRouterResponse.ok

      default:
        return false
    }
  } catch (error) {
    console.error(`Error checking API key for ${provider}:`, error)
    return false
  }
}

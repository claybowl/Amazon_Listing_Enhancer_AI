import { AIProvider } from "../types/models"

export interface ImageProviderCapabilities {
  supportsDirectGeneration: boolean
  maxImages: number
  supportedAspectRatios: string[]
  supportedStyles: string[]
  requiresApiKey: boolean
}

export const IMAGE_PROVIDER_CAPABILITIES: Record<AIProvider, ImageProviderCapabilities> = {
  [AIProvider.OpenAI]: {
    supportsDirectGeneration: true,
    maxImages: 4,
    supportedAspectRatios: ["1:1", "16:9", "9:16"],
    supportedStyles: ["natural", "vivid"],
    requiresApiKey: true,
  },
  [AIProvider.Stability]: {
    supportsDirectGeneration: true,
    maxImages: 4,
    supportedAspectRatios: ["1:1", "16:9", "9:16", "21:9", "2:3", "3:2"],
    supportedStyles: ["photographic", "digital-art", "cinematic", "anime", "fantasy-art"],
    requiresApiKey: true,
  },
  [AIProvider.Replicate]: {
    supportsDirectGeneration: true,
    maxImages: 4,
    supportedAspectRatios: ["1:1", "16:9", "9:16", "4:3", "3:4"],
    supportedStyles: ["realistic", "artistic", "anime", "cartoon"],
    requiresApiKey: true,
  },
  [AIProvider.Gemini]: {
    supportsDirectGeneration: false, // Currently not supported
    maxImages: 4,
    supportedAspectRatios: ["1:1"],
    supportedStyles: ["placeholder"],
    requiresApiKey: true,
  },
  [AIProvider.OpenRouter]: {
    supportsDirectGeneration: true,
    maxImages: 1,
    supportedAspectRatios: ["1:1", "16:9", "9:16"],
    supportedStyles: ["natural"],
    requiresApiKey: true,
  },
  [AIProvider.Groq]: {
    supportsDirectGeneration: false,
    maxImages: 0,
    supportedAspectRatios: [],
    supportedStyles: [],
    requiresApiKey: true,
  },
  [AIProvider.XAI]: {
    supportsDirectGeneration: false,
    maxImages: 0,
    supportedAspectRatios: [],
    supportedStyles: [],
    requiresApiKey: true,
  },
}

export function getImageProviderCapabilities(provider: AIProvider): ImageProviderCapabilities {
  return IMAGE_PROVIDER_CAPABILITIES[provider]
}

export function getRecommendedImageProviders(): AIProvider[] {
  return Object.entries(IMAGE_PROVIDER_CAPABILITIES)
    .filter(([_, capabilities]) => capabilities.supportsDirectGeneration)
    .map(([provider]) => provider as AIProvider)
    .sort((a, b) => {
      // Sort by capability (max images, then by provider preference)
      const capA = IMAGE_PROVIDER_CAPABILITIES[a]
      const capB = IMAGE_PROVIDER_CAPABILITIES[b]
      return capB.maxImages - capA.maxImages
    })
}

export function validateImageGenerationRequest(
  provider: AIProvider,
  numberOfImages: number,
  aspectRatio?: string,
  style?: string,
): { isValid: boolean; error?: string } {
  const capabilities = getImageProviderCapabilities(provider)

  if (!capabilities.supportsDirectGeneration) {
    return {
      isValid: false,
      error: `${provider} does not support direct image generation. Consider using ${getRecommendedImageProviders().join(", ")} instead.`,
    }
  }

  if (numberOfImages > capabilities.maxImages) {
    return {
      isValid: false,
      error: `${provider} supports maximum ${capabilities.maxImages} images per request.`,
    }
  }

  if (aspectRatio && !capabilities.supportedAspectRatios.includes(aspectRatio)) {
    return {
      isValid: false,
      error: `${provider} does not support aspect ratio ${aspectRatio}. Supported ratios: ${capabilities.supportedAspectRatios.join(", ")}`,
    }
  }

  if (style && !capabilities.supportedStyles.includes(style)) {
    return {
      isValid: false,
      error: `${provider} does not support style ${style}. Supported styles: ${capabilities.supportedStyles.join(", ")}`,
    }
  }

  return { isValid: true }
}

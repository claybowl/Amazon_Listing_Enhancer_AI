// Model types and interfaces

export interface AIModel {
  id: string
  name: string
  provider: AIProvider
  type: ModelType
  description: string
  capabilities: string[]
  isAvailable: boolean
  apiKeyRequired: boolean
  defaultModel?: boolean
}

export enum AIProvider {
  OpenAI = "openai",
  Gemini = "gemini",
  Stability = "stability",
  Replicate = "replicate",
  OpenRouter = "openrouter",
  Groq = "groq",
  XAI = "xai",
}

export enum ModelType {
  Text = "text",
  Image = "image",
}

export interface AIProviderConfig {
  id: AIProvider
  name: string
  description: string
  docsUrl: string
  apiKeyName: string
  apiKeyPlaceholder: string
}

// Define available AI providers
export const AI_PROVIDERS: Record<AIProvider, AIProviderConfig> = {
  [AIProvider.OpenAI]: {
    id: AIProvider.OpenAI,
    name: "OpenAI",
    description: "Powerful AI models for text and image generation",
    docsUrl: "https://platform.openai.com/docs/api-reference",
    apiKeyName: "OpenAI API Key",
    apiKeyPlaceholder: "sk-...",
  },
  [AIProvider.Gemini]: {
    id: AIProvider.Gemini,
    name: "Google Gemini",
    description: "Google's advanced AI models for text and image generation",
    docsUrl: "https://ai.google.dev/",
    apiKeyName: "Gemini API Key",
    apiKeyPlaceholder: "AIza...",
  },
  [AIProvider.Stability]: {
    id: AIProvider.Stability,
    name: "Stability AI",
    description: "Specialized in high-quality image generation",
    docsUrl: "https://platform.stability.ai/docs/api-reference",
    apiKeyName: "Stability AI API Key",
    apiKeyPlaceholder: "sk-...",
  },
  [AIProvider.Replicate]: {
    id: AIProvider.Replicate,
    name: "Replicate",
    description: "Run open-source models with a simple API",
    docsUrl: "https://replicate.com/docs",
    apiKeyName: "Replicate API Key",
    apiKeyPlaceholder: "r8_...",
  },
  [AIProvider.OpenRouter]: {
    id: AIProvider.OpenRouter,
    name: "OpenRouter",
    description: "Access to multiple AI models through a unified API",
    docsUrl: "https://openrouter.ai/docs",
    apiKeyName: "OpenRouter API Key",
    apiKeyPlaceholder: "sk-or-v1-...",
  },
  [AIProvider.Groq]: {
    id: AIProvider.Groq,
    name: "Groq",
    description: "Ultra-fast AI inference with open-source models",
    docsUrl: "https://console.groq.com/docs",
    apiKeyName: "Groq API Key",
    apiKeyPlaceholder: "gsk_...",
  },
  [AIProvider.XAI]: {
    id: AIProvider.XAI,
    name: "Grok (xAI)",
    description: "Elon Musk's xAI Grok models for text generation",
    docsUrl: "https://docs.x.ai/",
    apiKeyName: "xAI API Key",
    apiKeyPlaceholder: "xai-...",
  },
}

// Define available AI models
export const AI_MODELS: AIModel[] = [
  // Text Models - OpenAI
  {
    id: "gpt-4o",
    name: "GPT-4o",
    provider: AIProvider.OpenAI,
    type: ModelType.Text,
    description: "OpenAI's most advanced model, optimized for both quality and speed",
    capabilities: ["High-quality text generation", "Nuanced understanding", "Creative writing"],
    isAvailable: true,
    apiKeyRequired: true,
    defaultModel: true,
  },
  {
    id: "gpt-4-turbo",
    name: "GPT-4 Turbo",
    provider: AIProvider.OpenAI,
    type: ModelType.Text,
    description: "Powerful model with a good balance of quality and cost",
    capabilities: ["High-quality text generation", "Detailed responses", "Good context handling"],
    isAvailable: true,
    apiKeyRequired: true,
  },
  {
    id: "gpt-3.5-turbo",
    name: "GPT-3.5 Turbo",
    provider: AIProvider.OpenAI,
    type: ModelType.Text,
    description: "Fast and cost-effective model for most text generation tasks",
    capabilities: ["Fast responses", "Cost-effective", "Good for most tasks"],
    isAvailable: true,
    apiKeyRequired: true,
  },

  // Text Models - Gemini
  {
    id: "gemini-1.5-pro",
    name: "Gemini 1.5 Pro",
    provider: AIProvider.Gemini,
    type: ModelType.Text,
    description: "Google's advanced model with strong reasoning capabilities",
    capabilities: ["High-quality text generation", "Long context window", "Multimodal understanding"],
    isAvailable: true,
    apiKeyRequired: true,
    defaultModel: true,
  },
  {
    id: "gemini-1.5-flash",
    name: "Gemini 1.5 Flash",
    provider: AIProvider.Gemini,
    type: ModelType.Text,
    description: "Faster version of Gemini optimized for efficiency",
    capabilities: ["Fast responses", "Cost-effective", "Good quality outputs"],
    isAvailable: true,
    apiKeyRequired: true,
  },

  // Image Models - OpenAI
  {
    id: "dall-e-3",
    name: "DALL-E 3",
    provider: AIProvider.OpenAI,
    type: ModelType.Image,
    description: "OpenAI's advanced image generation model",
    capabilities: ["High-quality images", "Detailed prompt following", "Creative compositions"],
    isAvailable: true,
    apiKeyRequired: true,
    defaultModel: true,
  },
  {
    id: "dall-e-2",
    name: "DALL-E 2",
    provider: AIProvider.OpenAI,
    type: ModelType.Image,
    description: "OpenAI's previous generation image model",
    capabilities: ["Good quality images", "Faster generation", "Lower cost"],
    isAvailable: true,
    apiKeyRequired: true,
  },

  // Image Models - Gemini
  {
    id: "imagen-3.0-generate-002",
    name: "Imagen 3",
    provider: AIProvider.Gemini,
    type: ModelType.Image,
    description: "Google's latest and most advanced image generation model with enhanced quality and style control",
    capabilities: [
      "High-quality images",
      "Advanced style control",
      "Multiple aspect ratios",
      "Post-processing options",
    ],
    isAvailable: true,
    apiKeyRequired: true,
    defaultModel: true,
  },
  {
    id: "gemini-2.0-flash-preview-image-generation",
    name: "Gemini 2.0 Flash Image Generation",
    provider: AIProvider.Gemini,
    type: ModelType.Image,
    description: "Conversational image generation and editing with Gemini 2.0 Flash (Free tier available)",
    capabilities: [
      "Conversational image generation",
      "Image editing",
      "Contextual understanding",
      "Free tier available",
    ],
    isAvailable: true,
    apiKeyRequired: true,
  },
  {
    id: "imagen-2",
    name: "Imagen 2",
    provider: AIProvider.Gemini,
    type: ModelType.Image,
    description: "Google's previous generation image model",
    capabilities: ["Good quality images", "Reliable generation", "Fast processing"],
    isAvailable: true,
    apiKeyRequired: true,
  },

  // Image Models - Stability AI
  {
    id: "stable-diffusion-xl-1024-v1-0",
    name: "Stable Diffusion XL 1024",
    provider: AIProvider.Stability,
    type: ModelType.Image,
    description: "Stability AI's flagship SDXL model for high-quality 1024x1024 images",
    capabilities: ["High-quality images", "1024x1024 resolution", "Detailed control"],
    isAvailable: true,
    apiKeyRequired: true,
  },
  {
    id: "stable-diffusion-v1-6",
    name: "Stable Diffusion v1.6",
    provider: AIProvider.Stability,
    type: ModelType.Image,
    description: "Classic Stable Diffusion model for reliable image generation",
    capabilities: ["Reliable generation", "Good quality", "Fast processing"],
    isAvailable: true,
    apiKeyRequired: true,
  },
  {
    id: "stable-diffusion-512-v2-1",
    name: "Stable Diffusion 512 v2.1",
    provider: AIProvider.Stability,
    type: ModelType.Image,
    description: "Stable Diffusion v2.1 optimized for 512x512 images",
    capabilities: ["512x512 resolution", "Good quality", "Efficient processing"],
    isAvailable: true,
    apiKeyRequired: true,
  },

  // Image Models - Replicate
  {
    id: "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
    name: "Stable Diffusion XL (via Replicate)",
    provider: AIProvider.Replicate,
    type: ModelType.Image,
    description: "Stability AI's SDXL model accessed through Replicate",
    capabilities: ["High-quality images", "Artistic styles", "Detailed control"],
    isAvailable: true,
    apiKeyRequired: true,
  },
  {
    id: "lucataco/sdxl-lightning:652d4b24c87aba0c45f021c9b6b1b8a16d157e2d2d8e3f9a8c0c0e19c5ce0698",
    name: "SDXL Lightning (via Replicate)",
    provider: AIProvider.Replicate,
    type: ModelType.Image,
    description: "Fast version of SDXL, accessed through Replicate",
    capabilities: ["Fast generation", "Good quality", "Efficient processing"],
    isAvailable: true,
    apiKeyRequired: true,
  },
  {
    id: "fofr/sdxl-emoji:dee76b5afde21b0f01ed7925f0665b7e472d4277474fb4266c0f0089cb6e9358",
    name: "SDXL Emoji (via Replicate)",
    provider: AIProvider.Replicate,
    type: ModelType.Image,
    description: "Generate emoji-style product images",
    capabilities: ["Emoji style", "Cute designs", "Stylized representations"],
    isAvailable: true,
    apiKeyRequired: true,
  },
  {
    id: "cjwbw/realistic-vision-v5:9e6701a09bd8a0f4a3d13f4fedafef8a2259b812af0f5eb0918c38e9c7fc4c75",
    name: "Realistic Vision V5 (via Replicate)",
    provider: AIProvider.Replicate,
    type: ModelType.Image,
    description: "Highly realistic image generation model",
    capabilities: ["Photorealistic images", "Detailed textures", "Lifelike lighting"],
    isAvailable: true,
    apiKeyRequired: true,
  },

  // Text Models - OpenRouter
  {
    id: "openai/gpt-4-turbo",
    name: "GPT-4 Turbo (via OpenRouter)",
    provider: AIProvider.OpenRouter,
    type: ModelType.Text,
    description: "OpenAI's GPT-4 Turbo accessed through OpenRouter",
    capabilities: ["High-quality text generation", "Detailed responses", "Good context handling"],
    isAvailable: true,
    apiKeyRequired: true,
  },
  {
    id: "anthropic/claude-3-opus",
    name: "Claude 3 Opus (via OpenRouter)",
    provider: AIProvider.OpenRouter,
    type: ModelType.Text,
    description: "Anthropic's most capable model, accessed through OpenRouter",
    capabilities: ["High-quality text generation", "Nuanced understanding", "Thoughtful responses"],
    isAvailable: true,
    apiKeyRequired: true,
  },
  {
    id: "anthropic/claude-3-sonnet",
    name: "Claude 3 Sonnet (via OpenRouter)",
    provider: AIProvider.OpenRouter,
    type: ModelType.Text,
    description: "Anthropic's balanced model for quality and speed, accessed through OpenRouter",
    capabilities: ["High-quality text generation", "Fast responses", "Good reasoning"],
    isAvailable: true,
    apiKeyRequired: true,
  },
  {
    id: "meta-llama/llama-3-70b-instruct",
    name: "Llama 3 70B (via OpenRouter)",
    provider: AIProvider.OpenRouter,
    type: ModelType.Text,
    description: "Meta's Llama 3 70B model, accessed through OpenRouter",
    capabilities: ["High-quality text generation", "Open-source foundation", "Instruction following"],
    isAvailable: true,
    apiKeyRequired: true,
  },

  // Text Models - Groq
  {
    id: "llama-3.1-70b-versatile",
    name: "Llama 3.1 70B Versatile",
    provider: AIProvider.Groq,
    type: ModelType.Text,
    description: "Meta's Llama 3.1 70B model optimized for speed on Groq",
    capabilities: ["Ultra-fast inference", "High-quality text generation", "Versatile applications"],
    isAvailable: true,
    apiKeyRequired: true,
  },
  {
    id: "llama-3.1-8b-instant",
    name: "Llama 3.1 8B Instant",
    provider: AIProvider.Groq,
    type: ModelType.Text,
    description: "Lightweight Llama model for instant responses",
    capabilities: ["Instant responses", "Cost-effective", "Good for simple tasks"],
    isAvailable: true,
    apiKeyRequired: true,
  },
  {
    id: "mixtral-8x7b-32768",
    name: "Mixtral 8x7B",
    provider: AIProvider.Groq,
    type: ModelType.Text,
    description: "Mistral's mixture of experts model on Groq",
    capabilities: ["Fast inference", "High-quality outputs", "Large context window"],
    isAvailable: true,
    apiKeyRequired: true,
  },

  // Text Models - XAI (Grok)
  {
    id: "grok-beta",
    name: "Grok Beta",
    provider: AIProvider.XAI,
    type: ModelType.Text,
    description: "xAI's Grok model with real-time knowledge and wit",
    capabilities: ["Real-time information", "Witty responses", "Current events awareness"],
    isAvailable: true,
    apiKeyRequired: true,
  },
]

// Helper functions to get models by type and provider
export function getModelsByType(type: ModelType): AIModel[] {
  return AI_MODELS.filter((model) => model.type === type && model.isAvailable)
}

export function getModelsByProvider(provider: AIProvider): AIModel[] {
  return AI_MODELS.filter((model) => model.provider === provider && model.isAvailable)
}

export function getModelsByTypeAndProvider(type: ModelType, provider: AIProvider): AIModel[] {
  return AI_MODELS.filter((model) => model.type === type && model.provider === provider && model.isAvailable)
}

export function getDefaultModel(type: ModelType): AIModel | undefined {
  return AI_MODELS.find((model) => model.type === type && model.defaultModel)
}

export function getModelById(id: string): AIModel | undefined {
  return AI_MODELS.find((model) => model.id === id)
}

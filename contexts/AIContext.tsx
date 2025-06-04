"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { type AIModel, AIProvider, ModelType, getDefaultModel, getModelById, getModelsByType } from "../types/models"

interface AIContextType {
  // Selected Models
  selectedTextModel: AIModel | null
  selectedImageModel: AIModel | null
  setSelectedTextModel: (model: AIModel) => void
  setSelectedImageModel: (model: AIModel) => void

  // Server API Keys Status
  serverApiKeys: Record<AIProvider, boolean>
  isCheckingServerKeys: boolean
  refreshServerKeys: () => Promise<void>

  // AI Models
  aiModels: {
    text: AIModel[]
    image: AIModel[]
  }
}

const AIContext = createContext<AIContextType | undefined>(undefined)

export function AIContextProvider({ children }: { children: ReactNode }) {
  // Selected Models state
  const [selectedTextModel, setSelectedTextModel] = useState<AIModel | null>(null)
  const [selectedImageModel, setSelectedImageModel] = useState<AIModel | null>(null)

  // Server API Keys state
  const [serverApiKeys, setServerApiKeys] = useState<Record<AIProvider, boolean>>({
    [AIProvider.OpenAI]: false,
    [AIProvider.Gemini]: false,
    [AIProvider.Stability]: false,
    [AIProvider.Replicate]: false,
    [AIProvider.OpenRouter]: false,
    [AIProvider.Groq]: false,
    [AIProvider.XAI]: false,
  })
  const [isCheckingServerKeys, setIsCheckingServerKeys] = useState(true)

  // Get AI models by type
  const aiModels = {
    text: getModelsByType(ModelType.Text),
    image: getModelsByType(ModelType.Image),
  }

  // Check if server has API keys configured
  const checkServerApiKeys = async () => {
    setIsCheckingServerKeys(true)

    try {
      const providers = Object.values(AIProvider)
      const responses = await Promise.all(
        providers.map(async (provider) => {
          try {
            console.log(`Checking API key for provider: ${provider}`)

            const response = await fetch("/api/check-api-key", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ provider }),
            })

            console.log(`Response status for ${provider}: ${response.status}`)
            console.log(`Response content-type: ${response.headers.get("content-type")}`)

            // Get response as text first
            const responseText = await response.text()
            console.log(`Raw response for ${provider}:`, responseText)

            if (!response.ok) {
              console.error(`API key check failed for ${provider}: ${response.status} ${response.statusText}`)
              return { provider, hasApiKey: false }
            }

            // Try to parse as JSON
            let data
            try {
              data = JSON.parse(responseText)
            } catch (parseError) {
              console.error(`Failed to parse JSON response for ${provider}:`, parseError)
              console.error(`Response text was:`, responseText)
              return { provider, hasApiKey: false }
            }

            return { provider, hasApiKey: data.hasApiKey || false }
          } catch (error) {
            console.error(`Error checking ${provider} API key:`, error)
            return { provider, hasApiKey: false }
          }
        }),
      )

      const newServerApiKeys = responses.reduce(
        (acc, { provider, hasApiKey }) => {
          acc[provider] = hasApiKey
          return acc
        },
        {} as Record<AIProvider, boolean>,
      )

      console.log("Final server API keys status:", newServerApiKeys)
      setServerApiKeys(newServerApiKeys)

      // Debug: Log available models for each provider
      Object.entries(newServerApiKeys).forEach(([provider, hasKey]) => {
        if (hasKey) {
          const models = getModelsByProvider(provider as AIProvider)
          console.log(`${provider} models available:`, models.map(m => m.name))
        }
      })

      // Auto-select best available models based on server configuration
      if (!selectedTextModel) {
        const availableTextModels = [
          getModelById("gpt-4o"), // OpenAI GPT-4o
          getModelById("llama-3.1-70b-versatile"), // Groq Llama
          getModelById("gemini-1.5-pro"), // Gemini Pro
          getDefaultModel(ModelType.Text), // Fallback
        ].filter((model) => model && newServerApiKeys[model.provider])

        if (availableTextModels[0]) {
          console.log("Auto-selecting text model:", availableTextModels[0].name)
          setSelectedTextModel(availableTextModels[0])
        }
      }

      if (!selectedImageModel) {
        const availableImageModels = [
          getModelById("dall-e-3"), // OpenAI DALL-E 3
          getModelById("stable-diffusion-xl-1024-v1-0"), // Stability AI
          getModelById("gemini-2.0-flash-preview-image-generation"), // Gemini 2.0 Flash (Free)
          getModelById("imagen-3.0-generate-002"), // Gemini Imagen (Paid)
          getDefaultModel(ModelType.Image), // Fallback
        ].filter((model) => model && newServerApiKeys[model.provider])

        if (availableImageModels[0]) {
          console.log("Auto-selecting image model:", availableImageModels[0].name)
          setSelectedImageModel(availableImageModels[0])
        }
      }
    } catch (error) {
      console.error("Error checking server API keys:", error)
    } finally {
      setIsCheckingServerKeys(false)
    }
  }

  // Load default models and check server keys on mount
  useEffect(() => {
    checkServerApiKeys()
  }, [])

  const value = {
    selectedTextModel,
    selectedImageModel,
    setSelectedTextModel,
    setSelectedImageModel,
    serverApiKeys,
    isCheckingServerKeys,
    refreshServerKeys: checkServerApiKeys,
    aiModels,
  }

  return <AIContext.Provider value={value}>{children}</AIContext.Provider>
}

export function useAI() {
  const context = useContext(AIContext)
  if (context === undefined) {
    throw new Error("useAI must be used within an AIProvider")
  }
  return context
}

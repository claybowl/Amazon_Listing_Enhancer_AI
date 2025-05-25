"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { type AIModel, AIProvider, ModelType, getDefaultModel, getModelById } from "../types/models"

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

  // Check if server has API keys configured
  const checkServerApiKeys = async () => {
    setIsCheckingServerKeys(true)

    try {
      const providers = Object.values(AIProvider)
      const responses = await Promise.all(
        providers.map(async (provider) => {
          try {
            const response = await fetch("/api/check-api-key", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ provider }),
            })
            const data = await response.json()
            return { provider, hasApiKey: data.hasApiKey }
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

      setServerApiKeys(newServerApiKeys)

      // Auto-select best available models based on server configuration
      if (!selectedTextModel) {
        const availableTextModels = [
          getModelById("gpt-4o"), // OpenAI GPT-4o
          getModelById("llama-3.1-70b-versatile"), // Groq Llama
          getModelById("gemini-1.5-pro"), // Gemini Pro
          getDefaultModel(ModelType.Text), // Fallback
        ].filter((model) => model && newServerApiKeys[model.provider])

        if (availableTextModels[0]) {
          setSelectedTextModel(availableTextModels[0])
        }
      }

      if (!selectedImageModel) {
        const availableImageModels = [
          getModelById("dall-e-3"), // OpenAI DALL-E 3
          getModelById("stable-diffusion-xl"), // Stability AI
          getModelById("imagen-3"), // Gemini Imagen
          getDefaultModel(ModelType.Image), // Fallback
        ].filter((model) => model && newServerApiKeys[model.provider])

        if (availableImageModels[0]) {
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

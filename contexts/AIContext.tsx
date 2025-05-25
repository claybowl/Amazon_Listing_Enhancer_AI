"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { type AIModel, AIProvider, ModelType, getDefaultModel } from "../types/models"

interface AIContextType {
  // API Keys
  apiKeys: Record<AIProvider, string>
  setApiKey: (provider: AIProvider, key: string) => void
  hasApiKey: (provider: AIProvider) => boolean
  clearApiKey: (provider: AIProvider) => void

  // Selected Models
  selectedTextModel: AIModel | null
  selectedImageModel: AIModel | null
  setSelectedTextModel: (model: AIModel) => void
  setSelectedImageModel: (model: AIModel) => void

  // Server API Keys
  serverApiKeys: Record<AIProvider, boolean>
  isCheckingServerKeys: boolean
}

const AIContext = createContext<AIContextType | undefined>(undefined)

export function AIContextProvider({ children }: { children: ReactNode }) {
  // API Keys state
  const [apiKeys, setApiKeys] = useState<Record<AIProvider, string>>({
    [AIProvider.OpenAI]: "",
    [AIProvider.Gemini]: "",
    [AIProvider.Stability]: "",
    [AIProvider.Replicate]: "",
    [AIProvider.OpenRouter]: "",
  })

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
  })
  const [isCheckingServerKeys, setIsCheckingServerKeys] = useState(true)

  // Load API keys from localStorage on mount
  useEffect(() => {
    const loadApiKeys = () => {
      const keys: Record<AIProvider, string> = {
        [AIProvider.OpenAI]: localStorage.getItem(`${AIProvider.OpenAI}_api_key`) || "",
        [AIProvider.Gemini]: localStorage.getItem(`${AIProvider.Gemini}_api_key`) || "",
        [AIProvider.Stability]: localStorage.getItem(`${AIProvider.Stability}_api_key`) || "",
        [AIProvider.Replicate]: localStorage.getItem(`${AIProvider.Replicate}_api_key`) || "",
        [AIProvider.OpenRouter]: localStorage.getItem(`${AIProvider.OpenRouter}_api_key`) || "",
      }

      // Set the OpenRouter API key provided by the user if not already set
      if (!keys[AIProvider.OpenRouter]) {
        keys[AIProvider.OpenRouter] = "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"
        localStorage.setItem(`${AIProvider.OpenRouter}_api_key`, keys[AIProvider.OpenRouter])
      }

      setApiKeys(keys)
    }

    loadApiKeys()

    // Set default models
    const defaultTextModel = getDefaultModel(ModelType.Text)
    const defaultImageModel = getDefaultModel(ModelType.Image)

    if (defaultTextModel) setSelectedTextModel(defaultTextModel)
    if (defaultImageModel) setSelectedImageModel(defaultImageModel)

    // Check for server API keys
    checkServerApiKeys()
  }, [])

  // Check if server has API keys configured
  const checkServerApiKeys = async () => {
    setIsCheckingServerKeys(true)

    try {
      // Check OpenAI API key
      const openaiResponse = await fetch("/api/check-api-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: AIProvider.OpenAI }),
      })

      const openaiData = await openaiResponse.json()

      // Check Gemini API key
      const geminiResponse = await fetch("/api/check-api-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: AIProvider.Gemini }),
      })

      const geminiData = await geminiResponse.json()

      // Check Replicate API key
      const replicateResponse = await fetch("/api/check-api-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: AIProvider.Replicate }),
      })

      const replicateData = await replicateResponse.json()

      // Check OpenRouter API key
      const openRouterResponse = await fetch("/api/check-api-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: AIProvider.OpenRouter }),
      })

      const openRouterData = await openRouterResponse.json()

      // Check Stability API key
      const stabilityResponse = await fetch("/api/check-api-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: AIProvider.Stability }),
      })

      const stabilityData = await stabilityResponse.json()

      // Update server API keys state
      setServerApiKeys({
        ...serverApiKeys,
        [AIProvider.OpenAI]: openaiData.hasApiKey,
        [AIProvider.Gemini]: geminiData.hasApiKey,
        [AIProvider.OpenRouter]: openRouterData.hasApiKey,
        [AIProvider.Replicate]: replicateData.hasApiKey,
        [AIProvider.Stability]: stabilityData.hasApiKey,
      })
    } catch (error) {
      console.error("Error checking server API keys:", error)
    } finally {
      setIsCheckingServerKeys(false)
    }
  }

  // Set API key
  const setApiKey = (provider: AIProvider, key: string) => {
    setApiKeys((prev) => ({ ...prev, [provider]: key }))
    localStorage.setItem(`${provider}_api_key`, key)
  }

  // Check if API key exists
  const hasApiKey = (provider: AIProvider): boolean => {
    return serverApiKeys[provider] || !!apiKeys[provider]
  }

  // Clear API key
  const clearApiKey = (provider: AIProvider) => {
    setApiKeys((prev) => ({ ...prev, [provider]: "" }))
    localStorage.removeItem(`${provider}_api_key`)
  }

  const value = {
    apiKeys,
    setApiKey,
    hasApiKey,
    clearApiKey,
    selectedTextModel,
    selectedImageModel,
    setSelectedTextModel,
    setSelectedImageModel,
    serverApiKeys,
    isCheckingServerKeys,
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

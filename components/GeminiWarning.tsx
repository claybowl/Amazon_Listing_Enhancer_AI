import type React from "react"
import { useAI } from "../contexts/AIContext"
import { AIProvider } from "../types/models"

const GeminiWarning: React.FC = () => {
  const { selectedTextModel, selectedImageModel } = useAI()

  const isGeminiSelected =
    (selectedTextModel && selectedTextModel.provider === AIProvider.Gemini) ||
    (selectedImageModel && selectedImageModel.provider === AIProvider.Gemini)

  if (!isGeminiSelected) {
    return null
  }

  return (
    <div className="mb-6 p-4 bg-amber-500/20 text-amber-300 border border-amber-500 rounded-lg" role="alert">
      <p className="font-semibold">⚠️ Gemini API Notice:</p>
      <p>
        We're currently experiencing issues with the Gemini API. For the best experience, please use OpenAI or
        OpenRouter models instead.
      </p>
    </div>
  )
}

export default GeminiWarning

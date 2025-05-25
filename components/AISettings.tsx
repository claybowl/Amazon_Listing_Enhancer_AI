"use client"

import type React from "react"
import { useState } from "react"
import { AIProvider, ModelType } from "../types/models"
import { useAI } from "../contexts/AIContext"
import AIKeyManager from "./AIKeyManager"
import ModelSelector from "./ModelSelector"
import { CogIcon } from "./icons"

const AISettings: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false)
  const { isCheckingServerKeys } = useAI()

  if (isCheckingServerKeys) {
    return (
      <div className="mb-6 p-4 bg-slate-700/50 rounded-lg">
        <div className="flex items-center justify-center">
          <svg
            className="animate-spin h-5 w-5 text-indigo-400 mr-2"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <span>Checking AI configuration...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="mb-6">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 bg-slate-700/50 rounded-lg hover:bg-slate-700/70 transition-colors"
      >
        <div className="flex items-center">
          <CogIcon className="w-5 h-5 text-indigo-400 mr-2" />
          <span className="font-medium">AI Settings & API Keys</span>
        </div>
        <span className="text-sm text-slate-400">{isOpen ? "Hide" : "Configure"}</span>
      </button>

      {isOpen && (
        <div className="mt-2 p-4 bg-slate-700/30 rounded-lg border border-slate-600">
          <h3 className="text-lg font-medium text-slate-200 mb-4">Model Selection</h3>

          <ModelSelector modelType={ModelType.Text} />
          <ModelSelector modelType={ModelType.Image} />

          <h3 className="text-lg font-medium text-slate-200 mt-6 mb-4">API Keys</h3>

          <div className="space-y-4">
            <AIKeyManager provider={AIProvider.OpenAI} />
            <AIKeyManager provider={AIProvider.Gemini} />
            <AIKeyManager provider={AIProvider.OpenRouter} />
            <AIKeyManager provider={AIProvider.Stability} />
            <AIKeyManager provider={AIProvider.Replicate} />
          </div>
        </div>
      )}
    </div>
  )
}

export default AISettings

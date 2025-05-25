"use client"

import type React from "react"
import { useState } from "react"
import { KeyIcon, EyeIcon, EyeSlashIcon, TrashIcon } from "./icons"

interface OpenAiKeyManagerProps {
  onApiKeyChange: (apiKey: string | null) => void
  hasApiKey: boolean
}

const OpenAiKeyManager: React.FC<OpenAiKeyManagerProps> = ({ onApiKeyChange, hasApiKey }) => {
  const [apiKey, setApiKey] = useState("")
  const [showApiKey, setShowApiKey] = useState(false)
  const [isEditing, setIsEditing] = useState(!hasApiKey)

  const handleSaveApiKey = () => {
    if (apiKey.trim()) {
      localStorage.setItem("openai_api_key", apiKey.trim())
      onApiKeyChange(apiKey.trim())
      setIsEditing(false)
    } else {
      alert("Please enter a valid API key")
    }
  }

  const handleRemoveApiKey = () => {
    if (confirm("Are you sure you want to remove your API key?")) {
      localStorage.removeItem("openai_api_key")
      setApiKey("")
      onApiKeyChange(null)
      setIsEditing(true)
    }
  }

  if (!isEditing && hasApiKey) {
    return (
      <div className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg mb-4">
        <div className="flex items-center">
          <KeyIcon className="w-5 h-5 text-green-400 mr-2" />
          <span className="text-green-400 text-sm">OpenAI API Key is set</span>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setIsEditing(true)}
            className="px-3 py-1 text-xs bg-slate-600 hover:bg-slate-500 rounded-md text-slate-200 transition-colors"
          >
            Update
          </button>
          <button
            onClick={handleRemoveApiKey}
            className="px-3 py-1 text-xs bg-red-600/30 hover:bg-red-600/50 rounded-md text-red-200 transition-colors"
          >
            <TrashIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 bg-slate-700/50 rounded-lg mb-6 border border-yellow-500/50">
      <div className="flex items-center mb-3">
        <KeyIcon className="w-5 h-5 text-yellow-400 mr-2" />
        <h3 className="text-lg font-medium text-yellow-400">OpenAI API Key Required</h3>
      </div>

      <p className="text-slate-300 text-sm mb-4">
        To use this application, you need to provide your OpenAI API key. Your key will be stored locally in your
        browser and is never sent to our servers.
      </p>

      <div className="relative">
        <input
          type={showApiKey ? "text" : "password"}
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="Enter your OpenAI API key"
          className="w-full p-3 pr-10 bg-slate-800 border border-slate-600 rounded-md text-slate-200 focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
        />
        <button
          type="button"
          onClick={() => setShowApiKey(!showApiKey)}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-300"
          aria-label={showApiKey ? "Hide API key" : "Show API key"}
        >
          {showApiKey ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
        </button>
      </div>

      <div className="mt-2 text-xs text-slate-400">
        <a
          href="https://platform.openai.com/api-keys"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-400 hover:text-blue-300 underline"
        >
          Get an OpenAI API key from your account
        </a>
      </div>

      <button
        onClick={handleSaveApiKey}
        disabled={!apiKey.trim()}
        className="mt-4 w-full py-2 bg-yellow-600 hover:bg-yellow-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-md transition-colors"
      >
        Save API Key
      </button>
    </div>
  )
}

export default OpenAiKeyManager

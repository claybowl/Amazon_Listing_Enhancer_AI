"use client"

import type React from "react"
import { useState } from "react"
import { type AIProvider, AI_PROVIDERS } from "../types/models"
import { useAI } from "../contexts/AIContext"
import { KeyIcon, EyeIcon, EyeSlashIcon, TrashIcon, CheckIcon } from "./icons"

interface AIKeyManagerProps {
  provider: AIProvider
}

const AIKeyManager: React.FC<AIKeyManagerProps> = ({ provider }) => {
  const { apiKeys, setApiKey, clearApiKey, serverApiKeys } = useAI()
  const [apiKey, setApiKeyState] = useState("")
  const [showApiKey, setShowApiKey] = useState(false)
  const [isEditing, setIsEditing] = useState(!apiKeys[provider])

  const providerConfig = AI_PROVIDERS[provider]
  const hasServerKey = serverApiKeys[provider]
  const hasClientKey = !!apiKeys[provider]

  // If server has the API key, show a message and don't allow editing
  if (hasServerKey && !isEditing) {
    return (
      <div className="flex items-center p-3 bg-green-900/30 rounded-lg mb-4 border border-green-500/30">
        <CheckIcon className="w-5 h-5 text-green-400 mr-2" />
        <span className="text-green-400 text-sm">
          {providerConfig.name} API is configured on the server. You can use models from {providerConfig.name} without
          providing your own API key.
        </span>
      </div>
    )
  }

  // If client has the API key and not editing, show a message with edit/remove options
  if (hasClientKey && !isEditing) {
    return (
      <div className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg mb-4">
        <div className="flex items-center">
          <KeyIcon className="w-5 h-5 text-green-400 mr-2" />
          <span className="text-green-400 text-sm">{providerConfig.name} API Key is set</span>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setIsEditing(true)}
            className="px-3 py-1 text-xs bg-slate-600 hover:bg-slate-500 rounded-md text-slate-200 transition-colors"
          >
            Update
          </button>
          <button
            onClick={() => {
              if (confirm(`Are you sure you want to remove your ${providerConfig.name} API key?`)) {
                clearApiKey(provider)
                setIsEditing(true)
              }
            }}
            className="px-3 py-1 text-xs bg-red-600/30 hover:bg-red-600/50 rounded-md text-red-200 transition-colors"
          >
            <TrashIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    )
  }

  // Otherwise, show the API key input form
  return (
    <div className="p-4 bg-slate-700/50 rounded-lg mb-6 border border-yellow-500/50">
      <div className="flex items-center mb-3">
        <KeyIcon className="w-5 h-5 text-yellow-400 mr-2" />
        <h3 className="text-lg font-medium text-yellow-400">{providerConfig.name} API Key Required</h3>
      </div>

      <p className="text-slate-300 text-sm mb-4">
        To use {providerConfig.name} models, you need to provide your API key. Your key will be stored locally in your
        browser and is never sent to our servers.
      </p>

      <div className="relative">
        <input
          type={showApiKey ? "text" : "password"}
          value={apiKey}
          onChange={(e) => setApiKeyState(e.target.value)}
          placeholder={providerConfig.apiKeyPlaceholder}
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
          href={providerConfig.docsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-400 hover:text-blue-300 underline"
        >
          Get a {providerConfig.name} API key
        </a>
      </div>

      <div className="flex space-x-3 mt-4">
        <button
          onClick={() => {
            if (apiKey.trim()) {
              setApiKey(provider, apiKey.trim())
              setIsEditing(false)
            } else {
              alert("Please enter a valid API key")
            }
          }}
          disabled={!apiKey.trim()}
          className="flex-1 py-2 bg-yellow-600 hover:bg-yellow-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-md transition-colors"
        >
          Save API Key
        </button>

        {hasClientKey && (
          <button
            onClick={() => setIsEditing(false)}
            className="px-4 py-2 bg-slate-600 hover:bg-slate-500 text-slate-200 rounded-md transition-colors"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  )
}

export default AIKeyManager

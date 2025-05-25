"use client"

import type React from "react"
import { useState } from "react"
import { type AIProvider, ModelType, AI_PROVIDERS } from "../types/models"
import { useAI } from "../contexts/AIContext"
import ModelSelector from "./ModelSelector"
import { CogIcon, CheckIcon, XIcon, RefreshIcon, ShieldIcon } from "./icons"

const AISettings: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false)
  const { serverApiKeys, isCheckingServerKeys, refreshServerKeys } = useAI()

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
          <span className="text-slate-300">Checking AI configuration...</span>
        </div>
      </div>
    )
  }

  const availableProviders = Object.entries(serverApiKeys).filter(([_, hasKey]) => hasKey).length
  const totalProviders = Object.keys(serverApiKeys).length

  return (
    <div className="mb-6">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 bg-slate-700/50 rounded-lg hover:bg-slate-700/70 transition-colors border border-slate-600"
      >
        <div className="flex items-center">
          <CogIcon className="w-5 h-5 text-indigo-400 mr-3" />
          <div className="text-left">
            <span className="font-medium text-slate-200">AI Configuration</span>
            <p className="text-xs text-slate-400 mt-0.5">
              {availableProviders}/{totalProviders} providers configured
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-slate-400">{isOpen ? "Hide" : "Show"}</span>
          <svg
            className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {isOpen && (
        <div className="mt-2 p-6 bg-slate-700/30 rounded-lg border border-slate-600">
          {/* Security Notice */}
          <div className="mb-6 p-4 bg-blue-900/30 border border-blue-500/30 rounded-lg">
            <div className="flex items-start">
              <ShieldIcon className="w-5 h-5 text-blue-400 mr-3 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-blue-400 text-sm font-medium">Enterprise Security</p>
                <p className="text-blue-300 text-xs mt-1">
                  All API keys are securely managed on the server. No sensitive credentials are exposed to the client.
                  Rate limiting and authentication are enforced server-side.
                </p>
              </div>
            </div>
          </div>

          {/* Model Selection */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-slate-200">Model Selection</h3>
              <button
                onClick={refreshServerKeys}
                disabled={isCheckingServerKeys}
                className="flex items-center px-3 py-1.5 text-xs bg-slate-600 hover:bg-slate-500 disabled:bg-slate-700 disabled:cursor-not-allowed rounded-md text-slate-200 transition-colors"
              >
                <RefreshIcon className={`w-4 h-4 mr-1 ${isCheckingServerKeys ? "animate-spin" : ""}`} />
                Refresh
              </button>
            </div>

            <ModelSelector modelType={ModelType.Text} />
            <ModelSelector modelType={ModelType.Image} />
          </div>

          {/* Provider Status */}
          <div>
            <h3 className="text-lg font-medium text-slate-200 mb-4">Provider Status</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {Object.entries(AI_PROVIDERS).map(([provider, config]) => {
                const hasKey = serverApiKeys[provider as AIProvider]
                return (
                  <div
                    key={provider}
                    className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                      hasKey
                        ? "bg-green-900/20 border-green-500/30 hover:bg-green-900/30"
                        : "bg-red-900/20 border-red-500/30 hover:bg-red-900/30"
                    }`}
                  >
                    <div className="flex items-center">
                      {hasKey ? (
                        <CheckIcon className="w-4 h-4 text-green-400 mr-3" />
                      ) : (
                        <XIcon className="w-4 h-4 text-red-400 mr-3" />
                      )}
                      <div>
                        <span className={`text-sm font-medium ${hasKey ? "text-green-400" : "text-red-400"}`}>
                          {config.name}
                        </span>
                        <p className="text-xs text-slate-400 mt-0.5">{config.description}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span
                        className={`text-xs px-2 py-1 rounded-full font-medium ${
                          hasKey
                            ? "bg-green-500/20 text-green-400 border border-green-500/30"
                            : "bg-red-500/20 text-red-400 border border-red-500/30"
                        }`}
                      >
                        {hasKey ? "Ready" : "Unavailable"}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Configuration Help */}
          {availableProviders === 0 && (
            <div className="mt-4 p-4 bg-yellow-900/30 border border-yellow-500/30 rounded-lg">
              <div className="flex items-start">
                <svg
                  className="w-5 h-5 text-yellow-400 mr-3 mt-0.5 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                <div>
                  <p className="text-yellow-400 text-sm font-medium">No AI Providers Configured</p>
                  <p className="text-yellow-300 text-xs mt-1">
                    Please configure API keys in your Vercel environment variables to enable AI functionality.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default AISettings

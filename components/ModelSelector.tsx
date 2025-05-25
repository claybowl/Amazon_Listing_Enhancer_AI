"use client"

import type React from "react"
import { ModelType, getModelsByType } from "../types/models"
import { useAI } from "../contexts/AIContext"
import { ChevronDownIcon } from "./icons"

interface ModelSelectorProps {
  modelType: ModelType
}

const ModelSelector: React.FC<ModelSelectorProps> = ({ modelType }) => {
  const { selectedTextModel, selectedImageModel, setSelectedTextModel, setSelectedImageModel, serverApiKeys } = useAI()

  const models = getModelsByType(modelType)
  const selectedModel = modelType === ModelType.Text ? selectedTextModel : selectedImageModel
  const setSelectedModel = modelType === ModelType.Text ? setSelectedTextModel : setSelectedImageModel

  // Filter models to only show those with available server API keys
  const availableModels = models.filter((model) => serverApiKeys[model.provider])

  if (availableModels.length === 0) {
    return (
      <div className="mb-4 p-4 bg-yellow-900/30 border border-yellow-500/30 rounded-lg">
        <div className="flex items-center">
          <svg className="w-5 h-5 text-yellow-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          <div>
            <p className="text-yellow-400 text-sm font-medium">No {modelType.toLowerCase()} models available</p>
            <p className="text-yellow-300 text-xs mt-1">Configure API keys on the server to enable models.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-slate-300 mb-2">
        {modelType === ModelType.Text ? "Text Generation Model" : "Image Generation Model"}
      </label>
      <div className="relative">
        <select
          value={selectedModel?.id || ""}
          onChange={(e) => {
            const model = availableModels.find((m) => m.id === e.target.value)
            if (model) {
              setSelectedModel(model)
            }
          }}
          className="w-full p-3 bg-slate-800 border border-slate-600 rounded-md text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent appearance-none pr-10"
        >
          <option value="">Select a model...</option>
          {availableModels.map((model) => (
            <option key={model.id} value={model.id}>
              {model.name} ({model.provider})
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
          <ChevronDownIcon className="w-5 h-5" />
        </div>
      </div>

      {selectedModel && (
        <div className="mt-3 p-3 bg-slate-800/50 rounded-lg border border-slate-600/50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div>
              <span className="font-semibold text-slate-300">Provider:</span>
              <p className="text-slate-400 mt-1">{selectedModel.provider}</p>
            </div>
            <div>
              <span className="font-semibold text-slate-300">Capabilities:</span>
              <p className="text-slate-400 mt-1">{selectedModel.capabilities.join(", ")}</p>
            </div>
          </div>
          <div className="mt-2">
            <span className="font-semibold text-slate-300 text-xs">Description:</span>
            <p className="text-slate-400 text-xs mt-1">{selectedModel.description}</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default ModelSelector

"use client"

import type React from "react"
import { type AIModel, ModelType, getModelsByType } from "../types/models"
import { useAI } from "../contexts/AIContext"
import { ChevronDownIcon } from "./icons"

interface ModelSelectorProps {
  modelType: ModelType
  onChange?: (model: AIModel) => void
}

const ModelSelector: React.FC<ModelSelectorProps> = ({ modelType, onChange }) => {
  const { selectedTextModel, selectedImageModel, setSelectedTextModel, setSelectedImageModel, hasApiKey } = useAI()

  const selectedModel = modelType === ModelType.Text ? selectedTextModel : selectedImageModel
  const setSelectedModel = modelType === ModelType.Text ? setSelectedTextModel : setSelectedImageModel

  const availableModels = getModelsByType(modelType)

  const handleModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const modelId = e.target.value
    const model = availableModels.find((m) => m.id === modelId)

    if (model) {
      setSelectedModel(model)
      if (onChange) onChange(model)
    }
  }

  return (
    <div className="mb-4">
      <label htmlFor={`${modelType}-model-selector`} className="block text-sm font-medium text-slate-300 mb-1">
        {modelType === ModelType.Text ? "Text Generation Model" : "Image Generation Model"}:
      </label>
      <div className="relative">
        <select
          id={`${modelType}-model-selector`}
          value={selectedModel?.id || ""}
          onChange={handleModelChange}
          className="appearance-none focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-slate-600 bg-slate-700 text-slate-100 rounded-md p-3 pr-8"
        >
          {availableModels.map((model) => (
            <option key={model.id} value={model.id} disabled={model.apiKeyRequired && !hasApiKey(model.provider)}>
              {model.name} ({model.provider})
              {model.apiKeyRequired && !hasApiKey(model.provider) ? " - API Key Required" : ""}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
          <ChevronDownIcon className="w-5 h-5" />
        </div>
      </div>

      {selectedModel && (
        <div className="mt-2 text-xs text-slate-400">
          <p>{selectedModel.description}</p>
          <div className="mt-1">
            <span className="font-semibold">Capabilities: </span>
            {selectedModel.capabilities.join(", ")}
          </div>
        </div>
      )}
    </div>
  )
}

export default ModelSelector

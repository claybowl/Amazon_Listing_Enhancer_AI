"use client"

import type React from "react"
import { useState, useCallback, useEffect } from "react"
import { useAI } from "../contexts/AIContext"
import { ModelType } from "../types/models"
import LoadingSpinner from "./LoadingSpinner"
import { SparklesIcon, CogIcon, PhotoIcon } from "./icons"

interface UniversalImageGeneratorProps {
  initialPrompt?: string
  onImagesGenerated: (prompt: string, numberOfImages: number, options: any) => Promise<void>
  isGenerating: boolean
}

interface GenerationOptions {
  numberOfImages: number
  aspectRatio: string
  style: string
  quality: string
  guidanceScale?: number
  seed?: number
}

const UniversalImageGenerator: React.FC<UniversalImageGeneratorProps> = ({
  initialPrompt,
  onImagesGenerated,
  isGenerating: parentIsGenerating,
}) => {
  const { selectedImageModel } = useAI()
  const [prompt, setPrompt] = useState(initialPrompt || "")
  const [internalIsGenerating, setInternalIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false)

  const [options, setOptions] = useState<GenerationOptions>({
    numberOfImages: 1,
    aspectRatio: "1:1",
    style: "photographic",
    quality: "standard",
    guidanceScale: 7,
  })

  useEffect(() => {
    if (initialPrompt) {
      setPrompt(initialPrompt)
    }
  }, [initialPrompt])

  // Get provider-specific options based on selected model
  const getProviderOptions = useCallback(() => {
    if (!selectedImageModel) return { aspectRatios: [], styles: [], maxImages: 1 }

    switch (selectedImageModel.provider) {
      case "openai":
        return {
          aspectRatios: [
            { value: "1:1", label: "Square (1:1)" },
            { value: "16:9", label: "Landscape (16:9)" },
            { value: "9:16", label: "Portrait (9:16)" },
          ],
          styles: [
            { value: "natural", label: "Natural" },
            { value: "vivid", label: "Vivid" },
          ],
          maxImages: 4,
          supportsGuidance: false,
          supportsSeed: false,
        }
      case "stability":
        return {
          aspectRatios: [
            { value: "1:1", label: "Square (1:1)" },
            { value: "16:9", label: "Landscape (16:9)" },
            { value: "9:16", label: "Portrait (9:16)" },
            { value: "21:9", label: "Ultrawide (21:9)" },
            { value: "2:3", label: "Portrait (2:3)" },
            { value: "3:2", label: "Landscape (3:2)" },
          ],
          styles: [
            { value: "photographic", label: "Photographic" },
            { value: "digital-art", label: "Digital Art" },
            { value: "cinematic", label: "Cinematic" },
            { value: "anime", label: "Anime" },
            { value: "fantasy-art", label: "Fantasy Art" },
          ],
          maxImages: 4,
          supportsGuidance: true,
          supportsSeed: true,
        }
      case "replicate":
        return {
          aspectRatios: [
            { value: "1:1", label: "Square (1:1)" },
            { value: "16:9", label: "Landscape (16:9)" },
            { value: "9:16", label: "Portrait (9:16)" },
            { value: "4:3", label: "Standard (4:3)" },
            { value: "3:4", label: "Portrait (3:4)" },
          ],
          styles: [
            { value: "realistic", label: "Realistic" },
            { value: "artistic", label: "Artistic" },
            { value: "anime", label: "Anime" },
            { value: "cartoon", label: "Cartoon" },
          ],
          maxImages: 4,
          supportsGuidance: true,
          supportsSeed: true,
        }
      case "gemini":
        return {
          aspectRatios: [
            { value: "ASPECT_RATIO_1_1", label: "Square (1:1)" },
            { value: "ASPECT_RATIO_9_16", label: "Portrait (9:16)" },
            { value: "ASPECT_RATIO_16_9", label: "Landscape (16:9)" },
            { value: "ASPECT_RATIO_4_3", label: "Standard (4:3)" },
            { value: "ASPECT_RATIO_3_4", label: "Portrait (3:4)" },
          ],
          styles: [
            { value: "photographic", label: "Photographic" },
            { value: "digital_art", label: "Digital Art" },
            { value: "sketch", label: "Sketch" },
            { value: "watercolor", label: "Watercolor" },
            { value: "oil_painting", label: "Oil Painting" },
            { value: "anime", label: "Anime" },
          ],
          maxImages: 4,
          supportsGuidance: true,
          supportsSeed: true,
        }
      default:
        return {
          aspectRatios: [{ value: "1:1", label: "Square (1:1)" }],
          styles: [{ value: "natural", label: "Natural" }],
          maxImages: 1,
          supportsGuidance: false,
          supportsSeed: false,
        }
    }
  }, [selectedImageModel])

  const providerOptions = getProviderOptions()

  const handleGenerateImages = useCallback(async () => {
    if (!prompt.trim()) {
      setError("Please enter a prompt for image generation.")
      return
    }

    if (!selectedImageModel) {
      setError("Please select an image model first.")
      return
    }

    setInternalIsGenerating(true)
    setError(null)

    try {
      // Call the main onImagesGenerated prop from parent (App.tsx) which handles the actual generation
      await onImagesGenerated(prompt, options.numberOfImages, {
        aspectRatio: options.aspectRatio,
        style: options.style,
        quality: options.quality,
        guidanceScale: options.guidanceScale,
        seed: options.seed,
      })
    } catch (err) {
      console.error("Image generation failed:", err)
      setError(err instanceof Error ? err.message : "Failed to generate images.")
    } finally {
      setInternalIsGenerating(false)
    }
  }, [prompt, options, selectedImageModel, onImagesGenerated])

  if (!selectedImageModel) {
    return (
      <div className="bg-slate-700/50 p-6 rounded-lg shadow space-y-4 mt-6">
        <div className="flex items-center justify-center">
          <div className="text-center">
            <PhotoIcon className="w-12 h-12 text-slate-400 mx-auto mb-2" />
            <p className="text-slate-400">No image model selected</p>
            <p className="text-xs text-slate-500 mt-1">
              Please select an image model in the AI Configuration section above.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-slate-700/50 p-6 rounded-lg shadow space-y-6 mt-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-indigo-400 flex items-center">
          <SparklesIcon className="w-6 h-6 mr-2 text-indigo-400" />
          Generate with {selectedImageModel.name}
        </h3>
        <div className="text-xs text-slate-400">
          Provider: {selectedImageModel.provider}
        </div>
      </div>

      <div>
        <label htmlFor="image-prompt" className="block text-sm font-medium text-slate-300 mb-1">
          Image Prompt
        </label>
        <textarea
          id="image-prompt"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={3}
          className="w-full p-2 bg-slate-800 border border-slate-600 rounded-md text-slate-100 focus:ring-1 focus:ring-indigo-500 focus:border-transparent"
          placeholder="Describe the image you want to generate..."
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">Number of Images</label>
          <select
            value={options.numberOfImages}
            onChange={(e) => setOptions((prev) => ({ ...prev, numberOfImages: Number.parseInt(e.target.value) }))}
            className="w-full p-2 text-sm bg-slate-800 border border-slate-600 rounded-md text-slate-100"
          >
            {Array.from({ length: providerOptions.maxImages }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">Aspect Ratio</label>
          <select
            value={options.aspectRatio}
            onChange={(e) => setOptions((prev) => ({ ...prev, aspectRatio: e.target.value }))}
            className="w-full p-2 text-sm bg-slate-800 border border-slate-600 rounded-md text-slate-100"
          >
            {providerOptions.aspectRatios.map((ratio) => (
              <option key={ratio.value} value={ratio.value}>
                {ratio.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">Style</label>
          <select
            value={options.style}
            onChange={(e) => setOptions((prev) => ({ ...prev, style: e.target.value }))}
            className="w-full p-2 text-sm bg-slate-800 border border-slate-600 rounded-md text-slate-100"
          >
            {providerOptions.styles.map((style) => (
              <option key={style.value} value={style.value}>
                {style.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <button
        onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
        className="flex items-center text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
      >
        <CogIcon className="w-3 h-3 mr-1" />
        {showAdvancedOptions ? "Hide" : "Show"} Advanced Options
      </button>

      {showAdvancedOptions && (
        <div className="bg-slate-800/50 p-3 rounded-lg space-y-3 border border-slate-700">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Quality</label>
              <select
                value={options.quality}
                onChange={(e) => setOptions((prev) => ({ ...prev, quality: e.target.value }))}
                className="w-full p-2 bg-slate-700 border border-slate-600 rounded-md text-slate-100"
              >
                <option value="standard">Standard</option>
                <option value="hd">HD</option>
              </select>
            </div>

            {providerOptions.supportsGuidance && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Guidance Scale ({options.guidanceScale})
                </label>
                <input
                  type="range"
                  min="1"
                  max="20"
                  value={options.guidanceScale}
                  onChange={(e) => setOptions((prev) => ({ ...prev, guidanceScale: Number.parseInt(e.target.value) }))}
                  className="w-full"
                />
              </div>
            )}
          </div>

          {providerOptions.supportsSeed && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Seed (optional)</label>
              <input
                type="number"
                value={options.seed || ""}
                onChange={(e) =>
                  setOptions((prev) => ({ ...prev, seed: e.target.value ? Number.parseInt(e.target.value) : undefined }))
                }
                className="w-full p-2 bg-slate-700 border border-slate-600 rounded-md text-slate-100"
                placeholder="Leave empty for random seed"
              />
            </div>
          )}
        </div>
      )}

      <button
        onClick={handleGenerateImages}
        disabled={internalIsGenerating || parentIsGenerating || !prompt.trim()}
        className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-indigo-500 disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors"
      >
        {internalIsGenerating ? (
          <>
            <LoadingSpinner className="w-4 h-4 mr-2" /> Generating...
          </>
        ) : (
          <>
            <PhotoIcon className="w-4 h-4 mr-2" /> Generate Images
          </>
        )}
      </button>

      {error && (
        <div className="p-2 bg-red-700/30 text-red-300 border border-red-700/50 rounded-md text-xs">{error}</div>
      )}
    </div>
  )
}

export default UniversalImageGenerator 
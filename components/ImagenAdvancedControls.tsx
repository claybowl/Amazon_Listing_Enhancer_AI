"use client"

import type React from "react"
import { useState, useCallback, useEffect } from "react" // Added useEffect
import type { ImagenGenerationOptions, ImagenPostProcessingOptions } from "../services/providers/geminiImagenService" // Assuming these types are correctly defined here
import { generateImagesWithImagen, postProcessImage, rateLimiter } from "../services/providers/geminiImagenService"
import LoadingSpinner from "./LoadingSpinner"
import { SparklesIcon, CogIcon, PhotoIcon, EyeIcon } from "./icons"

// Props for ImagenAdvancedControls
interface ImagenAdvancedControlsProps {
  initialPrompt?: string // Added initialPrompt
  onImagesGenerated: (images: string[], metadata: any) => void // Callback when images are generated
  isGenerating: boolean // To reflect overall generating state, though this component manages its own internal state too
  // setIsGenerating is removed as this component will manage its own loading state for its button
}

// Ensure these types are defined or imported if they come from geminiImagenService.ts
// For the purpose of this file, if not imported, they would need to be defined here or in a shared types file.
// Assuming they are correctly exported from geminiImagenService.ts as per previous context.

const ImagenAdvancedControls: React.FC<ImagenAdvancedControlsProps> = ({
  initialPrompt,
  onImagesGenerated,
  isGenerating: parentIsGenerating, // Renamed to avoid conflict with internal state
}) => {
  const [prompt, setPrompt] = useState(initialPrompt || "")
  const [internalIsGenerating, setInternalIsGenerating] = useState(false) // Internal loading state

  const [options, setOptions] = useState<ImagenGenerationOptions>({
    prompt: initialPrompt || "",
    numberOfImages: 1,
    aspectRatio: "ASPECT_RATIO_1_1",
    style: "photographic",
    quality: "standard",
    safetyLevel: "medium",
    guidanceScale: 7,
  })
  const [postProcessingOptions, setPostProcessingOptions] = useState<ImagenPostProcessingOptions>({
    upscale: false,
    upscaleLevel: 2,
    styleTransfer: { enabled: false, targetStyle: "enhance" },
    colorAdjustment: { brightness: 0, contrast: 0, saturation: 0 },
  })
  // Removed generatedImages and generationMetadata state as they are passed up via onImagesGenerated
  const [error, setError] = useState<string | null>(null)
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false)
  const [showPostProcessing, setShowPostProcessing] = useState(false)
  const [rateLimitInfo, setRateLimitInfo] = useState({ remaining: 60, timeUntilNext: 0 })

  useEffect(() => {
    if (initialPrompt) {
      setPrompt(initialPrompt)
      setOptions((prev) => ({ ...prev, prompt: initialPrompt }))
    }
  }, [initialPrompt])

  const updateRateLimitInfo = useCallback(() => {
    setRateLimitInfo({
      remaining: rateLimiter.getRemainingRequests(),
      timeUntilNext: rateLimiter.getTimeUntilNextRequest(),
    })
  }, [])

  const handleGenerateImages = useCallback(async () => {
    if (!prompt.trim()) {
      setError("Please enter a prompt for Imagen 3.")
      return
    }

    if (!rateLimiter.canMakeRequest()) {
      const waitTime = Math.ceil(rateLimiter.getTimeUntilNextRequest() / 1000)
      setError(`Rate limit exceeded. Please wait ${waitTime} seconds.`)
      updateRateLimitInfo()
      return
    }

    setInternalIsGenerating(true)
    setError(null)

    try {
      const generationOptionsWithCurrentPrompt = { ...options, prompt }
      const result = await generateImagesWithImagen(generationOptionsWithCurrentPrompt)

      let finalImages = result.images
      const finalMetadata = result.metadata

      if (
        postProcessingOptions.upscale ||
        postProcessingOptions.styleTransfer?.enabled ||
        (postProcessingOptions.colorAdjustment &&
          Object.values(postProcessingOptions.colorAdjustment).some((v) => v !== 0))
      ) {
        finalImages = await Promise.all(result.images.map((image) => postProcessImage(image, postProcessingOptions)))
        finalMetadata.postProcessed = true
      }

      onImagesGenerated(finalImages, finalMetadata) // Pass generated images and metadata up
      updateRateLimitInfo()
    } catch (err) {
      console.error("Imagen 3 generation failed:", err)
      setError(err instanceof Error ? err.message : "Failed to generate images with Imagen 3.")
      updateRateLimitInfo()
    } finally {
      setInternalIsGenerating(false)
    }
  }, [prompt, options, postProcessingOptions, onImagesGenerated, updateRateLimitInfo])

  const handleDownloadImage = useCallback((base64Image: string, index: number) => {
    const link = document.createElement("a")
    link.href = base64Image.startsWith("data:image") ? base64Image : `data:image/jpeg;base64,${base64Image}`
    link.download = `imagen_generated_${index + 1}_${Date.now()}.jpeg`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }, [])

  // Effect to update prompt in options when local prompt changes
  useEffect(() => {
    setOptions((prev) => ({ ...prev, prompt: prompt }))
  }, [prompt])

  return (
    <div className="bg-slate-700/50 p-6 rounded-lg shadow space-y-6 mt-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-purple-400 flex items-center">
          <SparklesIcon className="w-6 h-6 mr-2 text-purple-400" />
          Generate with Imagen 3
        </h3>
        <div className="text-xs text-slate-400">
          Requests: {rateLimitInfo.remaining}/60
          {rateLimitInfo.timeUntilNext > 0 && (
            <span className="text-yellow-500 ml-1">(wait {Math.ceil(rateLimitInfo.timeUntilNext / 1000)}s)</span>
          )}
        </div>
      </div>

      <div>
        <label htmlFor="imagen-prompt" className="block text-sm font-medium text-slate-300 mb-1">
          Image Prompt for Imagen 3
        </label>
        <textarea
          id="imagen-prompt"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={3}
          className="w-full p-2 bg-slate-800 border border-slate-600 rounded-md text-slate-100 focus:ring-1 focus:ring-purple-500 focus:border-transparent"
          placeholder="e.g., A futuristic cityscape at sunset..."
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
            {[1, 2, 3, 4].map((n) => (
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
            onChange={(e) => setOptions((prev) => ({ ...prev, aspectRatio: e.target.value as any }))}
            className="w-full p-2 text-sm bg-slate-800 border border-slate-600 rounded-md text-slate-100"
          >
            <option value="ASPECT_RATIO_1_1">Square (1:1)</option>
            <option value="ASPECT_RATIO_9_16">Portrait (9:16)</option>
            <option value="ASPECT_RATIO_16_9">Landscape (16:9)</option>
            <option value="ASPECT_RATIO_4_3">Standard (4:3)</option>
            <option value="ASPECT_RATIO_3_4">Portrait (3:4)</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">Style</label>
          <select
            value={options.style}
            onChange={(e) => setOptions((prev) => ({ ...prev, style: e.target.value as any }))}
            className="w-full p-2 text-sm bg-slate-800 border border-slate-600 rounded-md text-slate-100"
          >
            <option value="photographic">Photographic</option>
            <option value="digital_art">Digital Art</option>
            <option value="sketch">Sketch</option>
            <option value="watercolor">Watercolor</option>
            <option value="oil_painting">Oil Painting</option>
            <option value="anime">Anime</option>
          </select>
        </div>
      </div>

      <button
        onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
        className="flex items-center text-xs text-purple-400 hover:text-purple-300 transition-colors"
      >
        <CogIcon className="w-3 h-3 mr-1" />
        {showAdvancedOptions ? "Hide" : "Show"} Advanced Options
      </button>

      {showAdvancedOptions && (
        <div className="bg-slate-800/50 p-3 rounded-lg space-y-3 border border-slate-700">
          {/* ... Advanced options fields (Quality, Safety, Guidance, Seed) ... */}
          {/* These would be similar to your previous implementation for these fields */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Quality</label>
              <select
                value={options.quality}
                onChange={(e) => setOptions((prev) => ({ ...prev, quality: e.target.value as any }))}
                className="w-full p-2 bg-slate-700 border border-slate-600 rounded-md text-slate-100"
              >
                <option value="standard">Standard</option>
                <option value="hd">HD</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Safety Level</label>
              <select
                value={options.safetyLevel}
                onChange={(e) => setOptions((prev) => ({ ...prev, safetyLevel: e.target.value as any }))}
                className="w-full p-2 bg-slate-700 border border-slate-600 rounded-md text-slate-100"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

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
          </div>

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
        </div>
      )}

      <button
        onClick={() => setShowPostProcessing(!showPostProcessing)}
        className="flex items-center text-xs text-blue-400 hover:text-blue-300 transition-colors"
      >
        <EyeIcon className="w-3 h-3 mr-1" />
        {showPostProcessing ? "Hide" : "Show"} Post-Processing
      </button>

      {showPostProcessing && (
        <div className="bg-slate-800/50 p-3 rounded-lg space-y-3 border border-slate-700">
          {/* ... Post-processing options fields (Upscale, Style Transfer, Color Adjustments) ... */}
          {/* These would be similar to your previous implementation for these fields */}
          <div className="flex items-center space-x-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={postProcessingOptions.upscale}
                onChange={(e) =>
                  setPostProcessingOptions((prev) => ({
                    ...prev,
                    upscale: e.target.checked,
                  }))
                }
                className="mr-2"
              />
              <span className="text-sm text-slate-300">Enable Upscaling</span>
            </label>
            {postProcessingOptions.upscale && (
              <select
                value={postProcessingOptions.upscaleLevel}
                onChange={(e) =>
                  setPostProcessingOptions((prev) => ({
                    ...prev,
                    upscaleLevel: Number.parseInt(e.target.value) as 2 | 4,
                  }))
                }
                className="p-1 bg-slate-700 border border-slate-600 rounded text-slate-100 text-sm"
              >
                <option value={2}>2x</option>
                <option value={4}>4x</option>
              </select>
            )}
          </div>

          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={postProcessingOptions.styleTransfer?.enabled}
                onChange={(e) =>
                  setPostProcessingOptions((prev) => ({
                    ...prev,
                    styleTransfer: { ...prev.styleTransfer!, enabled: e.target.checked },
                  }))
                }
                className="mr-2"
              />
              <span className="text-sm text-slate-300">Style Transfer</span>
            </label>
            {postProcessingOptions.styleTransfer?.enabled && (
              <select
                value={postProcessingOptions.styleTransfer.targetStyle}
                onChange={(e) =>
                  setPostProcessingOptions((prev) => ({
                    ...prev,
                    styleTransfer: { ...prev.styleTransfer!, targetStyle: e.target.value as any },
                  }))
                }
                className="w-full p-2 bg-slate-700 border border-slate-600 rounded-md text-slate-100"
              >
                <option value="enhance">Enhance</option>
                <option value="artistic">Artistic</option>
                <option value="vintage">Vintage</option>
                <option value="modern">Modern</option>
              </select>
            )}
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-medium text-slate-300">Color Adjustments</h4>
            {(["brightness", "contrast", "saturation"] as const).map((adjustment) => (
              <div key={adjustment}>
                <label className="block text-xs text-slate-400 mb-1 capitalize">
                  {adjustment} ({postProcessingOptions.colorAdjustment?.[adjustment] || 0})
                </label>
                <input
                  type="range"
                  min="-100"
                  max="100"
                  value={postProcessingOptions.colorAdjustment?.[adjustment] || 0}
                  onChange={(e) =>
                    setPostProcessingOptions((prev) => ({
                      ...prev,
                      colorAdjustment: {
                        ...prev.colorAdjustment!,
                        [adjustment]: Number.parseInt(e.target.value),
                      },
                    }))
                  }
                  className="w-full"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={handleGenerateImages}
        disabled={internalIsGenerating || parentIsGenerating || !prompt.trim() || !rateLimiter.canMakeRequest()}
        className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-purple-500 disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors"
      >
        {internalIsGenerating ? (
          <>
            <LoadingSpinner className="w-4 h-4 mr-2" /> Generating...
          </>
        ) : (
          <>
            <PhotoIcon className="w-4 h-4 mr-2" /> Generate with Imagen 3
          </>
        )}
      </button>

      {error && (
        <div className="p-2 bg-red-700/30 text-red-300 border border-red-700/50 rounded-md text-xs">{error}</div>
      )}

      {/* This component no longer displays images itself; it passes them up. */}
      {/* The parent (EnhancedListingDisplay) is responsible for displaying them. */}
    </div>
  )
}

export default ImagenAdvancedControls

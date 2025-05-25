"use client"

import type React from "react"
import { useState, useCallback, useMemo } from "react"
import type { EnhancedProductDetails } from "../types"
import { ModelType } from "../types/models"
import { useAI } from "../contexts/AIContext"
import LoadingSpinner from "./LoadingSpinner"
import ModelSelector from "./ModelSelector"
import {
  SparklesIcon,
  PhotoIcon,
  ArrowDownOnSquareIcon,
  ClipboardDocumentListIcon,
  CheckIcon,
  ArrowDownTrayIcon,
  XCircleIcon,
  ChatBubbleLeftRightIcon,
} from "./icons"

interface EnhancedListingDisplayProps {
  details: EnhancedProductDetails
  onGenerateImages: (prompt: string, numberOfImages: number) => Promise<void>
  isGeneratingImages: boolean
}

const EnhancedListingDisplay: React.FC<EnhancedListingDisplayProps> = ({
  details,
  onGenerateImages,
  isGeneratingImages: propIsGeneratingImages,
}) => {
  const { selectedImageModel } = useAI()

  const initialImagePrompt = useMemo(() => {
    let prompt = `High-quality product photo of "${details.name}"`
    if (details.originalDescription) {
      const snippet =
        details.originalDescription.substring(0, 200).split(".").slice(0, 2).join(".") +
        (details.originalDescription.length > 200 ? "..." : "")
      prompt += `, which is described as: "${snippet}".`
    }
    prompt += ` The image should be suitable for a premium e-commerce listing. Focus on showcasing the product's key features as described, in a well-lit, appealing, and fashionable setting. The product itself should be the main focus and rendered accurately.`
    return prompt
  }, [details.name, details.originalDescription])

  const [imagePrompt, setImagePrompt] = useState<string>(initialImagePrompt)
  const [numImages, setNumImages] = useState<number>(1)
  const [isDescriptionCopied, setIsDescriptionCopied] = useState(false)
  const [internalIsGeneratingImages, setInternalIsGeneratingImages] = useState(false)

  const handleImageGenerationSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      if (!imagePrompt.trim()) {
        alert("Image prompt cannot be empty.")
        return
      }

      if (!selectedImageModel) {
        alert("Please select an image generation model first.")
        return
      }

      setInternalIsGeneratingImages(true)
      try {
        await onGenerateImages(imagePrompt, numImages)
      } catch (error) {
        console.error("Image generation failed from display component", error)
      } finally {
        setInternalIsGeneratingImages(false)
      }
    },
    [imagePrompt, numImages, onGenerateImages, selectedImageModel],
  )

  const handleCopyDescription = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(details.enhancedDescription)
      setIsDescriptionCopied(true)
      setTimeout(() => {
        setIsDescriptionCopied(false)
      }, 2000)
    } catch (err) {
      console.error("Failed to copy text: ", err)
      alert("Failed to copy description to clipboard.")
    }
  }, [details.enhancedDescription])

  const handleDownloadImage = (base64Image: string, index: number) => {
    const link = document.createElement("a")
    link.href = `data:image/jpeg;base64,${base64Image}`
    const safeProductName = details.name.replace(/[^a-z0-9]/gi, "_").toLowerCase() || "product"
    link.download = `${safeProductName}_ai_image_${index + 1}.jpeg`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const calculateCounts = (text = "") => {
    const charCount = text.length
    const words = text.trim().split(/\s+/).filter(Boolean)
    const wordCount = words.length
    return { charCount, wordCount }
  }

  const enhancedDescriptionCounts = useMemo(
    () => calculateCounts(details.enhancedDescription),
    [details.enhancedDescription],
  )
  const originalDescriptionCounts = useMemo(
    () => calculateCounts(details.originalDescription),
    [details.originalDescription],
  )

  const actualIsGeneratingImages = propIsGeneratingImages || internalIsGeneratingImages

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500 mb-3">
          Enhanced Listing Preview
        </h2>
      </div>

      <div className="bg-slate-700/50 p-4 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-slate-200 mb-1">Product Name:</h3>
        <p className="text-slate-300">{details.name}</p>
      </div>

      <div className="grid md:grid-cols-1 gap-6">
        <div className="bg-slate-700/50 p-4 rounded-lg shadow flex flex-col">
          <h3 className="text-lg font-semibold text-slate-200 mb-2">Original Description:</h3>
          <div className="text-slate-400 whitespace-pre-wrap text-sm max-h-60 overflow-y-auto flex-grow custom-scrollbar p-1">
            {details.originalDescription || "No original description provided."}
          </div>
          <div className="mt-2 text-xs text-slate-400 flex justify-end space-x-2" aria-live="polite">
            <span>Characters: {originalDescriptionCounts.charCount}</span>
            <span>|</span>
            <span>Words: {originalDescriptionCounts.wordCount}</span>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-slate-700/50 p-4 rounded-lg shadow border border-purple-500 flex flex-col">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-semibold text-purple-400 flex items-center">
                <SparklesIcon className="w-5 h-5 mr-2 text-purple-400" />
                AI Enhanced Description:
              </h3>
              <button
                onClick={handleCopyDescription}
                className={`p-2 rounded-md text-sm flex items-center transition-all duration-150 ${
                  isDescriptionCopied
                    ? "bg-green-500 text-white"
                    : "bg-purple-600 hover:bg-purple-700 text-purple-100 focus:ring-purple-500"
                } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800`}
                aria-label={
                  isDescriptionCopied ? "Copied description to clipboard" : "Copy enhanced description to clipboard"
                }
                aria-live="polite"
              >
                {isDescriptionCopied ? (
                  <CheckIcon className="w-4 h-4 mr-1" />
                ) : (
                  <ClipboardDocumentListIcon className="w-4 h-4 mr-1" />
                )}
                {isDescriptionCopied ? "Copied!" : "Copy"}
              </button>
            </div>
            <div className="text-slate-200 whitespace-pre-wrap text-sm max-h-60 overflow-y-auto flex-grow custom-scrollbar p-1">
              {details.enhancedDescription || ""}
            </div>
            {isDescriptionCopied && <span className="sr-only">Description copied to clipboard</span>}
            <div className="mt-2 text-xs text-slate-300 flex justify-end space-x-2" aria-live="polite">
              <span>Characters: {enhancedDescriptionCounts.charCount}</span>
              <span>|</span>
              <span>Words: {enhancedDescriptionCounts.wordCount}</span>
            </div>
          </div>

          {details.generationContext && (
            <div className="bg-slate-700/60 p-4 rounded-lg shadow border border-sky-500">
              <h3 className="text-md font-semibold text-sky-400 mb-2 flex items-center">
                <ChatBubbleLeftRightIcon className="w-5 h-5 mr-2 text-sky-400" />
                AI Generation Context:
              </h3>
              <p className="text-slate-300 text-sm whitespace-pre-wrap">{details.generationContext}</p>
            </div>
          )}
        </div>
      </div>

      {details.originalImageUrls.length > 0 && (
        <div className="bg-slate-700/50 p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-slate-200 mb-3">Original Images:</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {details.originalImageUrls.map((url, index) => (
              <div key={`original-${index}`} className="aspect-square rounded-lg overflow-hidden bg-slate-600">
                <img
                  src={url || "/placeholder.svg"}
                  alt={`Original product image ${index + 1}`}
                  className="object-cover w-full h-full"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.src = "https://via.placeholder.com/400x300/4A5568/E2E8F0?text=Error+Loading"
                    target.alt = `Error loading original product image ${index + 1}`
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-slate-700/50 p-6 rounded-lg shadow">
        <h3 className="text-xl font-semibold text-teal-400 mb-4 flex items-center">
          <PhotoIcon className="w-6 h-6 mr-2 text-teal-400" />
          Generate New Product Images with AI
        </h3>
        <form onSubmit={handleImageGenerationSubmit} className="space-y-4">
          <ModelSelector modelType={ModelType.Image} />

          <div>
            <label htmlFor="imagePrompt" className="block text-sm font-medium text-slate-300 mb-1">
              Image Prompt:
            </label>
            <div className="relative">
              <textarea
                id="imagePrompt"
                value={imagePrompt}
                onChange={(e) => setImagePrompt(e.target.value)}
                rows={4}
                className="focus:ring-teal-500 focus:border-teal-500 block w-full sm:text-sm border-slate-600 bg-slate-700 text-slate-100 rounded-md p-3 pr-10 custom-scrollbar"
                placeholder="e.g., A sleek red wireless mouse on a dark textured surface, minimalist style"
                aria-label="Image prompt for AI generation"
              />
              {imagePrompt && (
                <button
                  type="button"
                  onClick={() => setImagePrompt("")}
                  className="absolute top-2 right-2 text-slate-400 hover:text-slate-200 p-1 focus:outline-none focus:ring-2 focus:ring-teal-500 rounded-full"
                  aria-label="Clear image prompt"
                >
                  <XCircleIcon className="w-5 h-5" />
                </button>
              )}
            </div>
            <p className="mt-1 text-xs text-slate-400">
              The prompt is pre-filled with your product name and description snippet. Refine it to guide the AI on
              scene, style, and specific visual elements while it keeps the core product features.
            </p>
          </div>

          <div>
            <label htmlFor="numImages" className="block text-sm font-medium text-slate-300 mb-1">
              Number of Images (1-4):
            </label>
            <select
              id="numImages"
              value={numImages}
              onChange={(e) => setNumImages(Number.parseInt(e.target.value))}
              className="focus:ring-teal-500 focus:border-teal-500 block w-full sm:text-sm border-slate-600 bg-slate-700 text-slate-100 rounded-md p-3"
              aria-label="Number of images to generate"
            >
              <option value={1}>1</option>
              <option value={2}>2</option>
              <option value={3}>3</option>
              <option value={4}>4</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={actualIsGeneratingImages || !selectedImageModel}
            className="w-full flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-teal-500 disabled:bg-slate-500 disabled:cursor-not-allowed transition-colors"
          >
            {actualIsGeneratingImages ? (
              <>
                <LoadingSpinner className="w-5 h-5 mr-2" /> Generating...
              </>
            ) : (
              <>
                <SparklesIcon className="w-5 h-5 mr-2" /> Generate Images
              </>
            )}
          </button>
        </form>
      </div>

      {details.generatedImages.length > 0 && (
        <div className="bg-slate-700/50 p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-slate-200 mb-3">AI Generated Images:</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {details.generatedImages.map((base64Image, index) => (
              <div
                key={`generated-${index}`}
                className="relative group aspect-square rounded-lg overflow-hidden border-2 border-teal-500 bg-slate-600"
              >
                <img
                  src={`data:image/jpeg;base64,${base64Image}`}
                  alt={`AI generated product image ${index + 1} based on prompt: ${details.generatedImagePrompts[details.generatedImagePrompts.length - details.generatedImages.length + index] || "current prompt"}`}
                  className="object-cover w-full h-full"
                />
                <button
                  onClick={() => handleDownloadImage(base64Image, index)}
                  className="absolute bottom-2 right-2 bg-teal-600 hover:bg-teal-700 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-white"
                  aria-label={`Download AI generated image ${index + 1}`}
                >
                  <ArrowDownTrayIcon className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-10 pt-6 border-t border-slate-700">
        <h3 className="text-xl font-semibold text-orange-400 mb-3 flex items-center">
          <ArrowDownOnSquareIcon className="w-6 h-6 mr-2 text-orange-400" />
          Finalize Listing
        </h3>
        <p className="text-slate-400 mb-4">
          Once you are satisfied with the enhanced description and images, the next step would typically be to create or
          update your listing on Amazon.
        </p>
        <button
          disabled
          className="w-full px-6 py-3 border border-transparent text-base font-medium rounded-md text-slate-100 bg-orange-500 hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-orange-400 disabled:bg-slate-600 disabled:cursor-not-allowed"
          aria-label="Create Listing on Amazon (Integration Placeholder)"
        >
          Create Listing on Amazon (Integration Placeholder)
        </button>
        <p className="text-xs text-slate-500 mt-2 text-center">
          Note: Direct Amazon API integration is not implemented in this demo.
        </p>
      </div>
    </div>
  )
}

export default EnhancedListingDisplay

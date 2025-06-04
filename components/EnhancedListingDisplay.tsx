"use client"

import type React from "react"
import { useMemo, useCallback } from "react" // Removed useState as setInternalIsGeneratingImages is not used here directly
import { ImageGenerationNotice } from "./ImageGenerationNotice"
import ImagenAdvancedControls from "./ImagenAdvancedControls" // Default import
import { useAI } from "../contexts/AIContext"

// Define SourceImageOptions locally for this component's specific needs
// This type is used for the onGenerateImages prop from the parent (App.tsx)
// and for the handleUseAsBasis function.
export interface SourceImageOptions {
  sourceImage: string // Base64 encoded image data or URL
  maskImage?: string | null // Optional mask for inpainting
  prompt?: string // Optional prompt, might override the main prompt for this specific operation
  imageStrength?: number // Optional, for img2img
}

export interface EnhancedProductDetails {
  name?: string
  originalDescription?: string
  enhancedDescription?: string
  originalImageUrls?: string[]
  generatedImages?: string[]
  generatedImagePrompts?: string[]
  generationContext?: string
  tone?: string
  style?: string
}

interface EnhancedListingDisplayProps {
  details: EnhancedProductDetails
  onGenerateImages: (prompt: string, numberOfImages: number, sourceImageOptions?: SourceImageOptions) => Promise<void>
  isGeneratingImages: boolean // This prop indicates if *any* image generation is happening at App level
  setEnhancedDetails: React.Dispatch<React.SetStateAction<EnhancedProductDetails | null>>
}

const EnhancedListingDisplay: React.FC<EnhancedListingDisplayProps> = ({
  details,
  onGenerateImages,
  isGeneratingImages, // Overall generating state from parent
  setEnhancedDetails,
}) => {
  const { selectedImageModel, selectedTextModel, handleDescriptionFeedback, handleImageFeedback } = useAI()

  const initialImagePrompt = useMemo(() => {
    let prompt = `High-quality product photo of "${details?.name || "this product"}"`
    if (details?.originalDescription) {
      const snippet =
        details.originalDescription.substring(0, 200).split(".").slice(0, 2).join(".") +
        (details.originalDescription.length > 200 ? "..." : "")
      prompt += `, which is described as: "${snippet}".`
    }
    prompt += ` The image should be suitable for a premium e-commerce listing, professional studio lighting, 4k resolution.`
    return prompt
  }, [details?.name, details?.originalDescription])

  // This function is for image-to-image ("Use as Basis")
  // It calls the main onGenerateImages prop passed from App.tsx
  const handleUseAsBasis = useCallback(
    async (imageUrl: string) => {
      if (!selectedImageModel) {
        alert("Please select an image model first.")
        return
      }
      if (!initialImagePrompt) {
        // This should ideally not happen if details.name is present
        alert("Product details are missing for generating image variations.")
        return
      }
      const sourceOptions: SourceImageOptions = {
        sourceImage: imageUrl,
        prompt: initialImagePrompt, // Use the consistent initial prompt for context
      }
      // Assuming onGenerateImages can handle sourceImageOptions for img2img
      await onGenerateImages(initialImagePrompt, 1, sourceOptions)
    },
    [initialImagePrompt, onGenerateImages, selectedImageModel],
  )

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-100">{details?.name || "Product Details"}</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
        {/* Left Column: Original Product Details */}
        <div>
          <div className="bg-slate-800/70 p-4 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-slate-200 mb-3">Original Description:</h3>
            <div className="text-slate-200 whitespace-pre-wrap text-sm max-h-60 overflow-y-auto flex-grow custom-scrollbar p-1">
              {details?.originalDescription || "Original description not available."}
            </div>
          </div>

          {details?.originalImageUrls && details.originalImageUrls.length > 0 && (
            <div className="bg-slate-700/50 p-4 rounded-lg shadow mt-4">
              <h3 className="text-lg font-semibold text-slate-200 mb-3">Original Images:</h3>
              <div className="grid grid-cols-2 gap-4">
                {details.originalImageUrls.map((url, index) => (
                  <img
                    key={`original-${index}`}
                    src={url || "/placeholder.svg?width=200&height=200&text=Original+Image"}
                    alt={`Original product image ${index + 1}`}
                    className="w-full h-32 object-cover rounded shadow-md"
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Enhanced Product Details */}
        <div>
          <div className="bg-slate-800/70 p-4 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-slate-200 mb-3">Enhanced Description:</h3>
            <div className="text-slate-200 whitespace-pre-wrap text-sm max-h-60 overflow-y-auto flex-grow custom-scrollbar p-1">
              {details?.enhancedDescription || "Enhanced description not available."}
            </div>
            {details?.enhancedDescription && selectedTextModel && (
              <div className="flex justify-end mt-2">
                <button
                  onClick={() => handleDescriptionFeedback(details.enhancedDescription!, true)}
                  className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 mr-2 text-xs"
                  title="Good description"
                >
                  👍
                </button>
                <button
                  onClick={() => handleDescriptionFeedback(details.enhancedDescription!, false)}
                  className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 text-xs"
                  title="Bad description"
                >
                  👎
                </button>
              </div>
            )}
            <p className="text-xs text-slate-400 mt-1">Model: {selectedTextModel?.id || "N/A"}</p>
          </div>

          {details?.generatedImages && details.generatedImages.length > 0 && (
            <div className="bg-slate-700/50 p-4 rounded-lg shadow mt-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-slate-200">AI Generated Images:</h3>
                <ImageGenerationNotice
                  provider={selectedImageModel?.provider || "unknown"}
                  isPlaceholder={details.generatedImages[0]?.includes("placeholder.svg")}
                  onSwitchProvider={(provider) => {
                    console.log(
                      `User wants to switch to ${provider} for image generation. This should be handled by parent.`,
                    )
                  }}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                {details.generatedImages.map((image, index) => (
                  <div key={`generated-${index}`} className="relative group">
                    <img
                      src={image.startsWith("data:image") ? image : `data:image/jpeg;base64,${image}`}
                      alt={`AI Generated product image ${index + 1}`}
                      className="w-full h-32 object-cover rounded shadow-md"
                    />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/60 rounded">
                      <button
                        onClick={() => handleUseAsBasis(image)}
                        className="px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs mr-1"
                        title="Use as Basis"
                      >
                        Use as Basis
                      </button>
                      {selectedImageModel && (
                        <>
                          <button
                            onClick={() => handleImageFeedback(image, true)}
                            className="p-1 bg-green-600 text-white rounded-full hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 text-xs mr-1"
                            title="Good image"
                          >
                            👍
                          </button>
                          <button
                            onClick={() => handleImageFeedback(image, false)}
                            className="p-1 bg-red-600 text-white rounded-full hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 text-xs"
                            title="Bad image"
                          >
                            👎
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-slate-400 mt-1">Model: {selectedImageModel?.id || "N/A"}</p>
            </div>
          )}
        </div>
      </div>

      {/* ImagenAdvancedControls handles its own generation trigger */}
      <ImagenAdvancedControls
        // Removed onGenerate prop
        isGenerating={isGeneratingImages} // Pass the overall generating state
        initialPrompt={initialImagePrompt}
        onImagesGenerated={(newImages, metadata) => {
          // This callback is from ImagenAdvancedControls after it generates images
          setEnhancedDetails((prevDetails) => {
            if (!prevDetails) {
              // This case should ideally be handled by ensuring details is always an object
              // or by initializing a new details object here.
              // For now, returning null or an empty object might be safest.
              console.warn("setEnhancedDetails called when prevDetails is null. This might indicate an issue.")
              return {
                name: details?.name || "Product", // Fallback name
                originalDescription: details?.originalDescription || "",
                enhancedDescription: details?.enhancedDescription || "",
                originalImageUrls: details?.originalImageUrls || [],
                generatedImages: newImages,
                generatedImagePrompts: [metadata?.prompt || initialImagePrompt],
              }
            }
            const updatedPrompts = [...(prevDetails.generatedImagePrompts || [])]
            if (metadata?.prompt && !updatedPrompts.includes(metadata.prompt)) {
              updatedPrompts.push(metadata.prompt)
            } else if (!metadata?.prompt && !updatedPrompts.includes(initialImagePrompt)) {
              updatedPrompts.push(initialImagePrompt)
            }

            return {
              ...prevDetails,
              generatedImagePrompts: updatedPrompts,
              generatedImages: [...(prevDetails.generatedImages || []), ...newImages],
            }
          })
        }}
      />
    </div>
  )
}

export default EnhancedListingDisplay

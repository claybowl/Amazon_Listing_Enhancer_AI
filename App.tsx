"use client"

import type React from "react"
import { useState, useCallback } from "react"
import { type ProductDetails, type EnhancedProductDetails, AppStep } from "./types"
import { AIContextProvider } from "./contexts/AIContext"
import ProductInputForm from "./components/ProductInputForm"
import EnhancedListingDisplay from "./components/EnhancedListingDisplay"
import LoadingSpinner from "./components/LoadingSpinner"
import AISettings from "./components/AISettings"
import GeminiWarning from "./components/GeminiWarning"
import { useAI } from "./contexts/AIContext"
import { generateEnhancedDescription, generateProductImages } from "./services/aiService"
import { SparklesIcon, ArrowPathIcon } from "./components/icons"

const AppContent: React.FC = () => {
  const { selectedTextModel, selectedImageModel, apiKeys } = useAI()
  const [currentStep, setCurrentStep] = useState<AppStep>(AppStep.Input)
  const [productDetails, setProductDetails] = useState<ProductDetails | null>(null)
  const [enhancedDetails, setEnhancedDetails] = useState<EnhancedProductDetails | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleProductSubmit = useCallback(
    async (details: ProductDetails) => {
      if (!selectedTextModel) {
        setError("No text generation model selected.")
        return
      }

      setCurrentStep(AppStep.ProcessingDescription)
      setError(null)
      setProductDetails(details)
      setEnhancedDetails(null) // Clear previous enhancements

      try {
        const { enhancedDescription, generationContext } = await generateEnhancedDescription(
          selectedTextModel,
          details.originalDescription,
          details.name,
          apiKeys[selectedTextModel.provider],
        )

        setEnhancedDetails({
          ...details,
          enhancedDescription: enhancedDescription,
          generationContext: generationContext,
          generatedImagePrompts: [],
          generatedImages: [],
        })
        setCurrentStep(AppStep.DisplayEnhanced)
      } catch (err) {
        console.error("Error enhancing description:", err)
        setError(
          err instanceof Error
            ? err.message
            : "Failed to enhance description. Ensure your API key is valid, and the AI response format is correct.",
        )
        setCurrentStep(AppStep.Input)
      }
    },
    [selectedTextModel, apiKeys],
  )

  const handleImageGeneration = useCallback(
    async (prompt: string, numberOfImages: number) => {
      if (!selectedImageModel) {
        setError("No image generation model selected.")
        return
      }

      if (!enhancedDetails) {
        setError("Product details not available for image generation.")
        return
      }

      setCurrentStep(AppStep.ProcessingImages)
      setError(null)

      try {
        const images = await generateProductImages(
          selectedImageModel,
          prompt,
          numberOfImages,
          apiKeys[selectedImageModel.provider],
        )

        setEnhancedDetails((prevDetails) => {
          if (!prevDetails) return null
          return {
            ...prevDetails,
            generatedImagePrompts: [...prevDetails.generatedImagePrompts, prompt], // Store the prompt used
            generatedImages: [...prevDetails.generatedImages, ...images],
          }
        })
      } catch (err) {
        console.error("Error generating images:", err)
        setError(err instanceof Error ? err.message : "Failed to generate images. Please try again.")
      } finally {
        setCurrentStep(AppStep.DisplayEnhanced)
      }
    },
    [enhancedDetails, selectedImageModel, apiKeys],
  )

  const handleReset = () => {
    setCurrentStep(AppStep.Input)
    setProductDetails(null)
    setEnhancedDetails(null)
    setError(null)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 text-slate-100 p-4 sm:p-6 md:p-8 flex flex-col items-center">
      <header className="w-full max-w-4xl mb-8 text-center">
        <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-sky-300 via-cyan-300 to-blue-400 flex items-center justify-center space-x-3">
          <SparklesIcon className="w-10 h-10 sm:w-12 sm:h-12 text-cyan-300" />
          <span>Amazon Listing Enhancer AI</span>
        </h1>
        <p className="mt-3 text-slate-300 text-lg">
          Transform your product listings with AI-powered descriptions and stunning visuals.
        </p>
        <p className="mt-1 text-sm text-cyan-400">Powered by multiple AI models - choose your preferred provider</p>
      </header>

      <main className="w-full max-w-4xl bg-slate-800 shadow-2xl rounded-xl p-6 sm:p-8">
        <AISettings />

        <GeminiWarning />

        {error && (
          <div className="mb-6 p-4 bg-red-500/20 text-red-300 border border-red-500 rounded-lg" role="alert">
            <p className="font-semibold">Error:</p>
            <p>{error}</p>
          </div>
        )}

        {currentStep === AppStep.Input && <ProductInputForm onSubmit={handleProductSubmit} />}

        {(currentStep === AppStep.ProcessingDescription || currentStep === AppStep.ProcessingImages) && (
          <div className="flex flex-col items-center justify-center p-10 text-center">
            <LoadingSpinner />
            <p className="mt-4 text-xl text-slate-300 animate-pulse">
              {currentStep === AppStep.ProcessingDescription ? "Enhancing description..." : "Generating images..."}
            </p>
            <p className="text-sm text-slate-400">This may take a few moments.</p>
          </div>
        )}

        {currentStep === AppStep.DisplayEnhanced && enhancedDetails && (
          <>
            <EnhancedListingDisplay
              details={enhancedDetails}
              onGenerateImages={handleImageGeneration}
              isGeneratingImages={currentStep === AppStep.ProcessingImages}
            />
            <button
              onClick={handleReset}
              className="mt-8 w-full flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-indigo-500 transition-colors"
            >
              <ArrowPathIcon className="w-5 h-5 mr-2" />
              Start Over with New Product
            </button>
          </>
        )}
      </main>

      <footer className="w-full max-w-4xl mt-12 text-center text-slate-400 text-sm">
        <p>&copy; 2025 AI Listing Enhancer by Curve Ai Solutions. Powered by multiple AI providers.</p>
        <p className="mt-1">Note: Actual Amazon API integration for listing creation is a placeholder.</p>
      </footer>
    </div>
  )
}

const App: React.FC = () => {
  return (
    <AIContextProvider>
      <AppContent />
    </AIContextProvider>
  )
}

export default App

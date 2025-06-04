"use client"

import type React from "react"
import { useState, useCallback } from "react"
import { analyzeProductImage } from "../services/imageAnalysisService"
import { useAI } from "../contexts/AIContext"
import LoadingSpinner from "./LoadingSpinner"
import { PhotoIcon, EyeIcon, ClipboardDocumentListIcon, CheckIcon, XCircleIcon, SparklesIcon } from "./icons"

interface ImageAnalyzerProps {
  onAnalysisComplete?: (analysis: string) => void
}

const ImageAnalyzer: React.FC<ImageAnalyzerProps> = ({ onAnalysisComplete }) => {
  const { selectedTextModel } = useAI()
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [analysis, setAnalysis] = useState<string>("")
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isAnalysisCopied, setIsAnalysisCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleImageSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        setError("Please select a valid image file.")
        return
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError("Image file size must be less than 10MB.")
        return
      }

      setSelectedImage(file)
      setError(null)
      setAnalysis("")

      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }, [])

  const handleAnalyzeImage = useCallback(async () => {
    if (!selectedImage) {
      setError("Please select an image first.")
      return
    }

    if (!selectedTextModel) {
      setError("Please select a text model first.")
      return
    }

    setIsAnalyzing(true)
    setError(null)

    try {
      const result = await analyzeProductImage(selectedTextModel, selectedImage)
      setAnalysis(result.analysis)
      onAnalysisComplete?.(result.analysis)
    } catch (err) {
      console.error("Image analysis failed:", err)
      setError(err instanceof Error ? err.message : "Failed to analyze image")
    } finally {
      setIsAnalyzing(false)
    }
  }, [selectedImage, selectedTextModel, onAnalysisComplete])

  const handleCopyAnalysis = useCallback(async () => {
    if (!analysis) return

    try {
      await navigator.clipboard.writeText(analysis)
      setIsAnalysisCopied(true)
      setTimeout(() => {
        setIsAnalysisCopied(false)
      }, 2000)
    } catch (err) {
      console.error("Failed to copy analysis:", err)
      setError("Failed to copy analysis to clipboard.")
    }
  }, [analysis])

  const handleClearImage = useCallback(() => {
    setSelectedImage(null)
    setImagePreview(null)
    setAnalysis("")
    setError(null)
    setIsAnalysisCopied(false)
  }, [])

  return (
    <div className="bg-slate-700/50 p-6 rounded-lg shadow space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-blue-400 flex items-center">
          <EyeIcon className="w-6 h-6 mr-2 text-blue-400" />
          AI Image Analysis
        </h3>
        {selectedImage && (
          <button
            onClick={handleClearImage}
            className="text-slate-400 hover:text-slate-200 p-1 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-full"
            aria-label="Clear selected image"
          >
            <XCircleIcon className="w-5 h-5" />
          </button>
        )}
      </div>

      <p className="text-slate-300 text-sm">
        Upload a product image to get AI-powered insights and detailed descriptions using GPT-4o Vision.
      </p>

      {/* Image Upload */}
      <div className="space-y-4">
        <div className="flex items-center justify-center w-full">
          <label
            htmlFor="image-upload"
            className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-600 border-dashed rounded-lg cursor-pointer bg-slate-800 hover:bg-slate-700 transition-colors"
          >
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <PhotoIcon className="w-8 h-8 mb-2 text-slate-400" />
              <p className="mb-2 text-sm text-slate-400">
                <span className="font-semibold">Click to upload</span> or drag and drop
              </p>
              <p className="text-xs text-slate-500">PNG, JPG, JPEG (MAX. 10MB)</p>
            </div>
            <input id="image-upload" type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
          </label>
        </div>

        {/* Image Preview */}
        {imagePreview && (
          <div className="relative">
            <img
              src={imagePreview || "/placeholder.svg"}
              alt="Selected product"
              className="w-full max-h-64 object-contain rounded-lg bg-slate-800"
            />
            <div className="mt-2 text-sm text-slate-400">Selected: {selectedImage?.name}</div>
          </div>
        )}

        {/* Analyze Button */}
        <button
          onClick={handleAnalyzeImage}
          disabled={!selectedImage || isAnalyzing || !selectedTextModel}
          className="w-full flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-blue-500 disabled:bg-slate-500 disabled:cursor-not-allowed transition-colors"
        >
          {isAnalyzing ? (
            <>
              <LoadingSpinner className="w-5 h-5 mr-2" /> Analyzing Image...
            </>
          ) : (
            <>
              <SparklesIcon className="w-5 h-5 mr-2" /> Analyze with AI
            </>
          )}
        </button>
      </div>

      {/* Error Display */}
      {error && <div className="p-3 bg-red-500/20 text-red-300 border border-red-500 rounded-md text-sm">{error}</div>}

      {/* Analysis Results */}
      {analysis && (
        <div className="bg-slate-700/60 p-4 rounded-lg shadow border border-blue-500">
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-md font-semibold text-blue-400 flex items-center">
              <EyeIcon className="w-5 h-5 mr-2 text-blue-400" />
              AI Analysis Results:
            </h4>
            <button
              onClick={handleCopyAnalysis}
              className={`p-2 rounded-md text-sm flex items-center transition-all duration-150 ${
                isAnalysisCopied
                  ? "bg-green-500 text-white"
                  : "bg-blue-600 hover:bg-blue-700 text-blue-100 focus:ring-blue-500"
              } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800`}
              aria-label={isAnalysisCopied ? "Copied analysis to clipboard" : "Copy analysis to clipboard"}
            >
              {isAnalysisCopied ? (
                <CheckIcon className="w-4 h-4 mr-1" />
              ) : (
                <ClipboardDocumentListIcon className="w-4 h-4 mr-1" />
              )}
              {isAnalysisCopied ? "Copied!" : "Copy"}
            </button>
          </div>
          <div className="text-slate-200 whitespace-pre-wrap text-sm max-h-60 overflow-y-auto custom-scrollbar p-1">
            {analysis}
          </div>
        </div>
      )}
    </div>
  )
}

export default ImageAnalyzer

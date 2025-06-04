"use client"

import type React from "react"
import { useState, useMemo } from "react"
import type { ProductDetails } from "../types"
import { DocumentTextIcon, PhotoIcon, PaperAirplaneIcon } from "./icons"
import ImageAnalyzer from "./ImageAnalyzer"

interface ProductInputFormProps {
  onSubmit: (details: ProductDetails) => void
}

const ProductInputForm: React.FC<ProductInputFormProps> = ({ onSubmit }) => {
  const [name, setName] = useState("")
  const [originalDescription, setOriginalDescription] = useState("")
  const [imageUrls, setImageUrls] = useState<string[]>(["", "", ""])
  const [tone, setTone] = useState("")
  const [style, setStyle] = useState("")
  const [showImageAnalyzer, setShowImageAnalyzer] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !originalDescription.trim()) {
      alert("Product Name and Original Description are required.")
      return
    }
    const filteredImageUrls = imageUrls.map((url) => url.trim()).filter((url) => url !== "")
    onSubmit({ name, originalDescription, originalImageUrls: filteredImageUrls, tone, style })
  }

  const handleImageUrlChange = (index: number, value: string) => {
    const newImageUrls = [...imageUrls]
    newImageUrls[index] = value
    setImageUrls(newImageUrls)
  }

  const handleAnalysisComplete = (analysis: string) => {
    // Append the AI analysis to the existing description
    if (originalDescription.trim()) {
      setOriginalDescription((prev) => prev + "\n\n" + analysis)
    } else {
      setOriginalDescription(analysis)
    }
  }

  const descriptionCharCount = originalDescription.length
  const descriptionWordCount = useMemo(() => {
    const words = originalDescription.trim().split(/\s+/)
    return words[0] === "" ? 0 : words.length
  }, [originalDescription])

  return (
    <div className="space-y-6">
      {/* Image Analyzer Toggle */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-slate-200">Product Information</h2>
        <button
          type="button"
          onClick={() => setShowImageAnalyzer(!showImageAnalyzer)}
          className="px-4 py-2 text-sm font-medium text-blue-400 bg-blue-500/10 border border-blue-500/30 rounded-md hover:bg-blue-500/20 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-800 transition-colors"
        >
          {showImageAnalyzer ? "Hide" : "Show"} AI Image Analyzer
        </button>
      </div>

      {/* Image Analyzer */}
      {showImageAnalyzer && <ImageAnalyzer onAnalysisComplete={handleAnalysisComplete} />}

      <form onSubmit={handleSubmit} className="space-y-6 p-2">
        <div>
          <label htmlFor="productName" className="block text-sm font-medium text-slate-300 mb-1">
            Product Name
          </label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <DocumentTextIcon className="h-5 w-5 text-slate-400" />
            </div>
            <input
              type="text"
              id="productName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 pr-3 sm:text-sm border-slate-600 bg-slate-700 text-slate-100 rounded-md py-3"
              placeholder="e.g., Ergonomic Office Chair"
              aria-label="Product Name"
            />
          </div>
        </div>

        <div>
          <label htmlFor="originalDescription" className="block text-sm font-medium text-slate-300 mb-1">
            Current Product Description
          </label>
          <textarea
            id="originalDescription"
            value={originalDescription}
            onChange={(e) => setOriginalDescription(e.target.value)}
            rows={6}
            required
            className="focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-slate-600 bg-slate-700 text-slate-100 rounded-md p-3"
            placeholder="Enter the current product description here... (or use AI Image Analyzer above to generate from photos)"
            aria-label="Current Product Description"
          />
          <div className="mt-1 text-xs text-slate-400 flex justify-end space-x-2" aria-live="polite">
            <span>Characters: {descriptionCharCount}</span>
            <span>|</span>
            <span>Words: {descriptionWordCount}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="tone" className="block text-sm font-medium text-slate-300 mb-1">
              Tone of Voice
            </label>
            <select
              id="tone"
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              className="mt-1 block w-full pl-3 pr-10 py-3 text-base border-slate-600 bg-slate-700 text-slate-100 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            >
              <option value="">Default (Professional)</option>
              <option value="Friendly">Friendly</option>
              <option value="Persuasive">Persuasive</option>
              <option value="Witty">Witty</option>
              <option value="Informative">Informative</option>
            </select>
          </div>

          <div>
            <label htmlFor="style" className="block text-sm font-medium text-slate-300 mb-1">
              Description Style
            </label>
            <select
              id="style"
              value={style}
              onChange={(e) => setStyle(e.target.value)}
              className="mt-1 block w-full pl-3 pr-10 py-3 text-base border-slate-600 bg-slate-700 text-slate-100 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            >
              <option value="">Default (Paragraph)</option>
              <option value="Bullet Points">Bullet Points</option>
              <option value="Short Sentences">Short Sentences</option>
            </select>
          </div>
        </div>

        <div className="space-y-4">
          <label className="block text-sm font-medium text-slate-300 mb-1">Current Product Image URLs (Optional)</label>
          {[0, 1, 2].map((index) => (
            <div key={index} className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <PhotoIcon className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="url"
                placeholder={`Image URL ${index + 1} (e.g., https://picsum.photos/400/300?random=${index + 1})`}
                value={imageUrls[index]}
                onChange={(e) => handleImageUrlChange(index, e.target.value)}
                className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 pr-3 sm:text-sm border-slate-600 bg-slate-700 text-slate-100 rounded-md py-3"
                aria-label={`Product Image URL ${index + 1}`}
              />
            </div>
          ))}
        </div>

        <button
          type="submit"
          className="w-full flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-indigo-500 transition-transform transform hover:scale-105"
        >
          <PaperAirplaneIcon className="w-5 h-5 mr-2 rotate-[-45deg]" />
          Enhance Listing
        </button>
      </form>
    </div>
  )
}

export default ProductInputForm

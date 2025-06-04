import type { AIModel } from "../types/models"

interface ImageAnalysisResult {
  analysis: string
}

/**
 * Converts a File object to a base64 string
 */
export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => {
      const base64String = reader.result as string
      // Extract the base64 data part (remove the data URL prefix)
      const base64Data = base64String.split(",")[1]
      resolve(base64Data)
    }
    reader.onerror = (error) => reject(error)
  })
}

/**
 * Analyzes a product image using GPT-4o Vision
 */
export async function analyzeProductImage(model: AIModel, imageFile: File): Promise<ImageAnalysisResult> {
  try {
    // Convert image to base64
    const base64Image = await fileToBase64(imageFile)

    // Create form data with the image and model ID
    const formData = new FormData()
    formData.append("image", base64Image)
    formData.append("modelId", model.id)

    // Call the API endpoint
    const response = await fetch("/api/openai/analyze-image", {
      method: "POST",
      body: formData,
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Image analysis API error:", response.status, errorText)
      throw new Error(`Image analysis failed: ${errorText || response.statusText}`)
    }

    // Parse the response
    const data = await response.json()
    return {
      analysis: data.analysis,
    }
  } catch (error) {
    console.error("Error in analyzeProductImage:", error)
    throw error instanceof Error ? error : new Error("Failed to analyze image")
  }
}

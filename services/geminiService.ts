import type { GenerateProductDescriptionParams, GenerateProductImagesParams } from "@/types"
import { GoogleGenerativeAI } from "@google/generative-ai"

const TEXT_MODEL_NAME = "gemini-pro"

export const generateProductDescription = async ({
  productName,
  productCategory,
  productDetails,
}: GenerateProductDescriptionParams): Promise<string> => {
  try {
    const clientApiKey = process.env.GOOGLE_GEN_AI_API_KEY

    if (!clientApiKey) {
      throw new Error("GOOGLE_GEN_AI_API_KEY environment variable is not set.")
    }

    const ai = new GoogleGenerativeAI(clientApiKey)
    const model = ai.getGenerativeModel({ model: TEXT_MODEL_NAME })

    const prompt = `
      You are an expert copywriter specializing in ${productCategory} products.
      Generate a compelling product description for the following product:

      Product Name: ${productName}
      Product Details: ${productDetails}

      The description should be engaging, informative, and highlight the key benefits of the product. Keep it concise and within 150 words.
    `

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
      },
    })

    const response = result.response
    const text = response.text()
    return text
  } catch (error: any) {
    console.error("Error generating product description:", error)
    throw new Error(`Failed to generate product description: ${error.message}`)
  }
}

export const generateProductImages = async ({}: GenerateProductImagesParams): Promise<string[]> => {
  return Promise.reject("Image generation is not supported by Gemini. Please use a different service.")
}

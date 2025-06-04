/**
 * @jest-environment jsdom
 */
import { analyzeProductImage, fileToBase64 } from "../../services/imageAnalysisService"
import type { AIModel } from "../../types/models"
import { AIProvider, ModelType } from "../../types/models"

// Mock global fetch
global.fetch = jest.fn()

const mockTextModel: AIModel = {
  id: "gpt-4o",
  name: "GPT-4o",
  provider: AIProvider.OpenAI,
  type: ModelType.Text,
  description: "Mock model",
  capabilities: ["text"],
  isAvailable: true,
  apiKeyRequired: true,
}

describe("imageAnalysisService", () => {
  beforeEach(() => {
    ;(fetch as jest.Mock).mockClear()
  })

  describe("fileToBase64", () => {
    it("should convert a File object to a base64 string", async () => {
      const mockFile = new File(["dummy content"], "test.png", { type: "image/png" })
      const mockReader = {
        readAsDataURL: jest.fn(),
        onload: jest.fn(),
        onerror: jest.fn(),
        result: "data:image/png;base64,ZHVtbXkgY29udGVudA==", // "dummy content" base64 encoded
      }
      global.FileReader = jest.fn(() => mockReader) as any

      const promise = fileToBase64(mockFile)

      // Simulate FileReader onload
      if (mockReader.onload) {
        ;(mockReader.onload as any)({ target: mockReader } as ProgressEvent<FileReader>)
      }

      const base64 = await promise
      expect(base64).toBe("ZHVtbXkgY29udGVudA==")
      expect(mockReader.readAsDataURL).toHaveBeenCalledWith(mockFile)
    })

    it("should reject if FileReader encounters an error", async () => {
      const mockFile = new File(["dummy content"], "test.png", { type: "image/png" })
      const mockError = new Error("FileReader error")
      const mockReader = {
        readAsDataURL: jest.fn(),
        onload: jest.fn(),
        onerror: jest.fn(),
        result: null,
      }
      global.FileReader = jest.fn(() => mockReader) as any

      const promise = fileToBase64(mockFile)

      // Simulate FileReader onerror
      if (mockReader.onerror) {
        ;(mockReader.onerror as any)(mockError)
      }

      await expect(promise).rejects.toThrow("FileReader error")
    })
  })

  describe("analyzeProductImage", () => {
    const mockFile = new File(["image data"], "product.jpg", { type: "image/jpeg" })
    const mockBase64Image = "aW1hZ2UgZGF0YQ==" // "image data"

    // Mock fileToBase64 for this test suite
    jest.mock("../../services/imageAnalysisService", () => ({
      ...jest.requireActual("../../services/imageAnalysisService"),
      fileToBase64: jest.fn().mockResolvedValue(mockBase64Image),
    }))

    it("should successfully analyze an image and return analysis", async () => {
      const mockAnalysis = "This is a detailed product analysis."
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ analysis: mockAnalysis }),
        text: async () => JSON.stringify({ analysis: mockAnalysis }),
      })

      const result = await analyzeProductImage(mockTextModel, mockFile)

      expect(fetch).toHaveBeenCalledWith("/api/openai/analyze-image", {
        method: "POST",
        body: expect.any(FormData), // FormData is tricky to inspect directly
      })

      // Check if FormData contains the expected fields
      const formData = (fetch as jest.Mock).mock.calls[0][1].body as FormData
      expect(formData.get("image")).toBe(mockBase64Image)
      expect(formData.get("modelId")).toBe(mockTextModel.id)

      expect(result).toEqual({ analysis: mockAnalysis })
    })

    it("should throw an error if API call fails", async () => {
      const errorMessage = "API Error: Analysis failed"
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
        text: async () => errorMessage,
      })

      await expect(analyzeProductImage(mockTextModel, mockFile)).rejects.toThrow(
        `Image analysis failed: ${errorMessage}`,
      )
    })

    it("should throw an error if response is not ok and text parsing fails", async () => {
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
        text: async () => {
          throw new Error("text parsing failed")
        },
      })

      await expect(analyzeProductImage(mockTextModel, mockFile)).rejects.toThrow(
        "Image analysis failed: Internal Server Error",
      )
    })

    it("should re-throw error if fileToBase64 fails", async () => {
      const conversionError = new Error("Base64 conversion failed")
      // Temporarily override the mock for fileToBase64 for this specific test
      const originalFileToBase64 = jest.requireActual("../../services/imageAnalysisService").fileToBase64
      const imageAnalysisService = require("../../services/imageAnalysisService")
      imageAnalysisService.fileToBase64 = jest.fn().mockRejectedValueOnce(conversionError)

      await expect(analyzeProductImage(mockTextModel, mockFile)).rejects.toThrow("Base64 conversion failed")
      // Restore mock
      imageAnalysisService.fileToBase64 = jest.fn().mockResolvedValue(mockBase64Image)
    })
  })
})

import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import ImageAnalyzer from "../../components/ImageAnalyzer"
import * as imageAnalysisService from "../../services/imageAnalysisService"
import { AIContextProvider, useAI } from "../../contexts/AIContext" // Import useAI
import type { AIModel } from "../../types/models"
import { AIProvider, ModelType } from "../../types/models"

// Mock the imageAnalysisService
jest.mock("../../services/imageAnalysisService")
const mockedAnalyzeProductImage = imageAnalysisService.analyzeProductImage as jest.Mock

// Mock the useAI hook
jest.mock("../../contexts/AIContext")
const mockedUseAI = useAI as jest.Mock

const mockTextModel: AIModel = {
  id: "gpt-4o",
  name: "GPT-4o",
  provider: AIProvider.OpenAI,
  type: ModelType.Text,
  description: "Mock text model",
  capabilities: ["text"],
  isAvailable: true,
  apiKeyRequired: true,
}

const renderComponent = (props = {}) => {
  return render(
    <AIContextProvider>
      {" "}
      {/* Ensure context is provided if ImageAnalyzer uses it indirectly */}
      <ImageAnalyzer {...props} />
    </AIContextProvider>,
  )
}

describe("ImageAnalyzer", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Setup default mock for useAI
    mockedUseAI.mockReturnValue({
      selectedTextModel: mockTextModel,
      // Add other necessary mock context values if ImageAnalyzer uses them
    })
  })

  it("renders correctly", () => {
    renderComponent()
    expect(screen.getByText("AI Image Analysis")).toBeInTheDocument()
    expect(screen.getByLabelText(/Click to upload/i)).toBeInTheDocument()
  })

  it("allows image selection and displays preview", async () => {
    renderComponent()
    const file = new File(["(⌐□_□)"], "chucknorris.png", { type: "image/png" })
    const input = screen.getByLabelText(/Click to upload/i) as HTMLInputElement

    // Mock URL.createObjectURL for image preview
    global.URL.createObjectURL = jest.fn(() => "blob:http://localhost/mock-image-url")

    // Simulate file upload
    await userEvent.upload(input, file)

    // Wait for the image preview to appear
    await waitFor(() => {
      const img = screen.getByAltText("Selected product") as HTMLImageElement
      expect(img).toBeInTheDocument()
      // The src will be a data URL from FileReader, not the createObjectURL mock here
      // So we check for its presence and that the file name is displayed
    })
    expect(screen.getByText(`Selected: ${file.name}`)).toBeInTheDocument()
  })

  it("handles image analysis successfully", async () => {
    const mockAnalysisResult = "This is a great product!"
    mockedAnalyzeProductImage.mockResolvedValueOnce({ analysis: mockAnalysisResult })
    const onAnalysisComplete = jest.fn()

    renderComponent({ onAnalysisComplete })

    const file = new File(["(⌐□_□)"], "product.png", { type: "image/png" })
    const input = screen.getByLabelText(/Click to upload/i)
    await userEvent.upload(input, file)

    const analyzeButton = screen.getByRole("button", { name: /Analyze with AI/i })
    fireEvent.click(analyzeButton)

    expect(screen.getByText(/Analyzing Image.../i)).toBeInTheDocument()

    await waitFor(() => {
      expect(mockedAnalyzeProductImage).toHaveBeenCalledWith(mockTextModel, file)
    })

    await waitFor(() => {
      expect(screen.getByText(mockAnalysisResult)).toBeInTheDocument()
    })
    expect(onAnalysisComplete).toHaveBeenCalledWith(mockAnalysisResult)
  })

  it("shows error if no text model is selected", async () => {
    mockedUseAI.mockReturnValueOnce({ selectedTextModel: null }) // Override useAI for this test
    renderComponent()
    const file = new File(["(⌐□_□)"], "product.png", { type: "image/png" })
    const input = screen.getByLabelText(/Click to upload/i)
    await userEvent.upload(input, file)

    const analyzeButton = screen.getByRole("button", { name: /Analyze with AI/i })
    fireEvent.click(analyzeButton)

    await waitFor(() => {
      expect(screen.getByText("Please select a text model first.")).toBeInTheDocument()
    })
    expect(mockedAnalyzeProductImage).not.toHaveBeenCalled()
  })

  it("shows error if image analysis service fails", async () => {
    const errorMessage = "Analysis API failed"
    mockedAnalyzeProductImage.mockRejectedValueOnce(new Error(errorMessage))
    renderComponent()

    const file = new File(["(⌐□_□)"], "product.png", { type: "image/png" })
    const input = screen.getByLabelText(/Click to upload/i)
    await userEvent.upload(input, file)

    const analyzeButton = screen.getByRole("button", { name: /Analyze with AI/i })
    fireEvent.click(analyzeButton)

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument()
    })
  })

  it("copies analysis to clipboard", async () => {
    const mockAnalysisResult = "Copied analysis text"
    mockedAnalyzeProductImage.mockResolvedValueOnce({ analysis: mockAnalysisResult })
    Object.assign(navigator, {
      clipboard: {
        writeText: jest.fn().mockResolvedValue(undefined),
      },
    })

    renderComponent()
    const file = new File(["(⌐□_□)"], "product.png", { type: "image/png" })
    const input = screen.getByLabelText(/Click to upload/i)
    await userEvent.upload(input, file)

    const analyzeButton = screen.getByRole("button", { name: /Analyze with AI/i })
    fireEvent.click(analyzeButton)

    await waitFor(() => screen.getByText(mockAnalysisResult))

    const copyButton = screen.getByRole("button", { name: /Copy analysis to clipboard/i })
    fireEvent.click(copyButton)

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(mockAnalysisResult)
    })
    expect(screen.getByText("Copied!")).toBeInTheDocument()
  })

  it("clears selected image and analysis", async () => {
    renderComponent()
    const file = new File(["(⌐□_□)"], "product.png", { type: "image/png" })
    const input = screen.getByLabelText(/Click to upload/i)
    await userEvent.upload(input, file)

    await waitFor(() => {
      expect(screen.getByAltText("Selected product")).toBeInTheDocument()
    })

    const clearButton = screen.getByLabelText("Clear selected image")
    fireEvent.click(clearButton)

    await waitFor(() => {
      expect(screen.queryByAltText("Selected product")).not.toBeInTheDocument()
    })
    expect(screen.queryByText(`Selected: ${file.name}`)).not.toBeInTheDocument()
  })

  it("validates file type", async () => {
    renderComponent()
    const file = new File(["not an image"], "test.txt", { type: "text/plain" })
    const input = screen.getByLabelText(/Click to upload/i)
    await userEvent.upload(input, file)

    await waitFor(() => {
      expect(screen.getByText("Please select a valid image file.")).toBeInTheDocument()
    })
  })

  it("validates file size", async () => {
    renderComponent()
    // Create a large file (e.g., 11MB)
    const largeFile = new File([new ArrayBuffer(11 * 1024 * 1024)], "large.png", { type: "image/png" })
    const input = screen.getByLabelText(/Click to upload/i)
    await userEvent.upload(input, largeFile)

    await waitFor(() => {
      expect(screen.getByText("Image file size must be less than 10MB.")).toBeInTheDocument()
    })
  })
})

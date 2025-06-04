"use client"

/**
 * @jest-environment jsdom
 */
import type React from "react"
import { render, act, waitFor } from "@testing-library/react"
import { AIContextProvider, useAI } from "../../contexts/AIContext"
import { AIProvider, getModelById } from "../../types/models"

global.fetch = jest.fn()

const TestConsumerComponent: React.FC = () => {
  const context = useAI()
  return (
    <div>
      <span data-testid="text-model-id">{context.selectedTextModel?.id || "none"}</span>
      <span data-testid="image-model-id">{context.selectedImageModel?.id || "none"}</span>
      <span data-testid="openai-key-status">{String(context.serverApiKeys.openai)}</span>
      <span data-testid="gemini-key-status">{String(context.serverApiKeys.gemini)}</span>
      <button onClick={context.refreshServerKeys}>Refresh</button>
    </div>
  )
}

// Helper to wrap component with provider for testing
const renderWithProvider = (ui: React.ReactElement) => {
  return render(<AIContextProvider>{ui}</AIContextProvider>)
}

describe("AIContext", () => {
  beforeEach(() => {
    ;(fetch as jest.Mock).mockClear()
    // Reset localStorage or any other side effects if necessary
    localStorage.clear()
  })

  it("initializes with default models and checks server API keys", async () => {
    ;(fetch as jest.Mock)
      .mockResolvedValueOnce({
        // OpenAI check
        ok: true,
        json: async () => ({ hasApiKey: true }),
        text: async () => JSON.stringify({ hasApiKey: true }),
      })
      .mockResolvedValueOnce({
        // Gemini check
        ok: true,
        json: async () => ({ hasApiKey: true }),
        text: async () => JSON.stringify({ hasApiKey: true }),
      })
      .mockResolvedValueOnce({
        // Stability check
        ok: true,
        json: async () => ({ hasApiKey: true }),
        text: async () => JSON.stringify({ hasApiKey: true }),
      })
      .mockResolvedValueOnce({
        // Replicate check
        ok: false, // Example: Replicate key not found
        json: async () => ({ hasApiKey: false }),
        text: async () => JSON.stringify({ hasApiKey: false }),
      })
      .mockResolvedValueOnce({
        // OpenRouter check
        ok: true,
        json: async () => ({ hasApiKey: true }),
        text: async () => JSON.stringify({ hasApiKey: true }),
      })
      .mockResolvedValueOnce({
        // Groq check
        ok: true,
        json: async () => ({ hasApiKey: true }),
        text: async () => JSON.stringify({ hasApiKey: true }),
      })
      .mockResolvedValueOnce({
        // XAI check
        ok: true,
        json: async () => ({ hasApiKey: true }),
        text: async () => JSON.stringify({ hasApiKey: true }),
      })

    renderWithProvider(<TestConsumerComponent />)

    await waitFor(() => {
      expect(screen.getByTestId("openai-key-status").textContent).toBe("true")
    })
    expect(screen.getByTestId("gemini-key-status").textContent).toBe("true")

    // Check if default models are selected based on availability
    // GPT-4o is a default and OpenAI key is true
    expect(screen.getByTestId("text-model-id").textContent).toBe("gpt-4o")
    // DALL-E 3 is a default and OpenAI key is true
    expect(screen.getByTestId("image-model-id").textContent).toBe("dall-e-3")

    expect(fetch).toHaveBeenCalledTimes(Object.keys(AIProvider).length)
  })

  it("allows setting and getting selected text model", async () => {
    ;(fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ hasApiKey: true }),
      text: async () => JSON.stringify({ hasApiKey: true }),
    })

    let contextValue: any
    const TestSetterComponent = () => {
      contextValue = useAI()
      return null
    }
    renderWithProvider(<TestSetterComponent />)

    await waitFor(() => expect(contextValue).not.toBeUndefined())

    const newTextModel = getModelById("gemini-1.5-pro") // Assuming this model exists
    expect(newTextModel).toBeDefined()

    act(() => {
      contextValue.setSelectedTextModel(newTextModel!)
    })
    expect(contextValue.selectedTextModel?.id).toBe("gemini-1.5-pro")
  })

  it("handles API key check failure for a provider", async () => {
    ;(fetch as jest.Mock).mockImplementation((url, options) => {
      const body = JSON.parse(options.body as string)
      if (body.provider === AIProvider.OpenAI) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ hasApiKey: true }),
          text: async () => JSON.stringify({ hasApiKey: true }),
        })
      }
      // Fail Gemini check
      if (body.provider === AIProvider.Gemini) {
        return Promise.resolve({
          ok: false,
          status: 500,
          json: async () => ({ error: "Server error", hasApiKey: false }),
          text: async () => JSON.stringify({ error: "Server error", hasApiKey: false }),
        })
      }
      return Promise.resolve({
        // Default for other providers
        ok: true,
        json: async () => ({ hasApiKey: false }),
        text: async () => JSON.stringify({ hasApiKey: false }),
      })
    })

    renderWithProvider(<TestConsumerComponent />)

    await waitFor(() => {
      expect(screen.getByTestId("openai-key-status").textContent).toBe("true")
    })
    expect(screen.getByTestId("gemini-key-status").textContent).toBe("false")
  })

  it("auto-selects next best available model if preferred default is unavailable", async () => {
    ;(fetch as jest.Mock).mockImplementation((url, options) => {
      const body = JSON.parse(options.body as string)
      if (body.provider === AIProvider.OpenAI) {
        // GPT-4o and DALL-E 3 provider
        return Promise.resolve({
          ok: false,
          json: async () => ({ hasApiKey: false }),
          text: async () => JSON.stringify({ hasApiKey: false }),
        })
      }
      if (body.provider === AIProvider.Groq) {
        // Llama 3.1 provider
        return Promise.resolve({
          ok: true,
          json: async () => ({ hasApiKey: true }),
          text: async () => JSON.stringify({ hasApiKey: true }),
        })
      }
      if (body.provider === AIProvider.Stability) {
        // Stability AI provider
        return Promise.resolve({
          ok: true,
          json: async () => ({ hasApiKey: true }),
          text: async () => JSON.stringify({ hasApiKey: true }),
        })
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({ hasApiKey: false }),
        text: async () => JSON.stringify({ hasApiKey: false }),
      }) // Default for others
    })

    renderWithProvider(<TestConsumerComponent />)

    await waitFor(() => {
      // OpenAI models (gpt-4o, dall-e-3) are defaults but OpenAI key is false.
      // Groq (llama-3.1-70b-versatile) should be selected for text.
      expect(screen.getByTestId("text-model-id").textContent).toBe("llama-3.1-70b-versatile")
      // Stability AI (stable-diffusion-xl-1024-v1-0) should be selected for image.
      expect(screen.getByTestId("image-model-id").textContent).toBe("stable-diffusion-xl-1024-v1-0")
    })
  })
})

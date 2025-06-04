import { type NextRequest, NextResponse } from "next/server"

// Get API key from environment variables
const STABILITY_API_KEY = process.env.STABILITY_API_KEY

export async function HEAD(request: NextRequest) {
  // Simple HEAD request handler to check if the route exists
  return new NextResponse(null, { status: 200 })
}

export async function POST(request: NextRequest) {
  try {
    // Check if API key is configured
    if (!STABILITY_API_KEY) {
      return NextResponse.json({ error: "Stability AI API Key not configured on the server." }, { status: 500 })
    }

    // Parse request body
    let body
    try {
      body = await request.json()
    } catch (e) {
      return NextResponse.json({ error: "Invalid JSON in request body" }, { status: 400 })
    }

    const {
      prompt,
      numberOfImages = 1,
      modelId = "stable-diffusion-xl-1024-v1-0", // Default model for text-to-image
      sourceImage, // base64 encoded image
      imageStrength, // number between 0 and 1
    } = body

    if (!prompt) {
      return NextResponse.json({ error: "Missing required field: prompt" }, { status: 400 })
    }

    if (numberOfImages < 1 || numberOfImages > 10) {
      return NextResponse.json({ error: "Number of images must be between 1 and 10." }, { status: 400 })
    }

    // Map model IDs to correct engine IDs
    const modelToEngineMap: Record<string, string> = {
      "stable-diffusion-xl": "stable-diffusion-xl-1024-v1-0",
      "stable-diffusion-xl-1024-v1-0": "stable-diffusion-xl-1024-v1-0",
      "stable-diffusion-v1-6": "stable-diffusion-v1-6",
      "stable-diffusion-512-v2-1": "stable-diffusion-512-v2-1",
    }

    const engineId = modelToEngineMap[modelId] || "stable-diffusion-xl-1024-v1-0"

    console.log(`Using Stability AI engine: ${engineId}`)

    let response: Response
    let responseData: any

    if (sourceImage) {
      // Image-to-Image generation
      if (typeof imageStrength !== "number" || imageStrength < 0 || imageStrength > 1) {
        return NextResponse.json({ error: "Image strength must be a number between 0 and 1." }, { status: 400 })
      }

      const imageBuffer = Buffer.from(sourceImage, "base64")
      const formData = new FormData()
      formData.append("init_image", new Blob([imageBuffer]), "init_image.png")
      formData.append("image_strength", imageStrength.toString())
      formData.append("init_image_mode", "IMAGE_STRENGTH")
      formData.append("text_prompts[0][text]", prompt)
      formData.append("text_prompts[0][weight]", "1")
      formData.append("cfg_scale", "7")
      formData.append("samples", "1")
      formData.append("steps", "30")

      response = await fetch(`https://api.stability.ai/v1/generation/${engineId}/image-to-image`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${STABILITY_API_KEY}`,
          Accept: "application/json",
        },
        body: formData,
      })
    } else {
      // Text-to-Image generation
      const fullPrompt = `**VERY IMPORTANT: Read all instructions carefully.**
You are an AI image generator tasked with creating a product image for an Amazon listing.

**Product to Depict (Primary Focus):**
The core task is to accurately render the product described in the "Product Context" below. The product's appearance, features, and details as described MUST be depicted as faithfully and identically as possible. Do NOT alter the product itself from how it is described.

**Product Context (This describes the product you must render accurately):**
---
${prompt}
---

**Image Style and Scene (Secondary - This is what you change around the product):**
While the product depiction MUST remain true to the "Product Context", the surrounding scene and environment SHOULD be changed to be:
- Highly appealing and fashionable.
- Professional and commercial quality, suitable for a premium Amazon listing.
- Well-lit, clear, and high-resolution.
- The goal is to present the *exact same product* (as per "Product Context") in a *new, enhanced, stylish setting* that makes it look highly desirable.

**Key Rule: Do not change the product's described features. Only change the scene, background, and styling around the product.**
Generate an image that makes this specific product look highly desirable in its new fashionable environment.`

      response = await fetch(`https://api.stability.ai/v1/generation/${engineId}/text-to-image`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${STABILITY_API_KEY}`,
          Accept: "application/json",
        },
        body: JSON.stringify({
          text_prompts: [
            {
              text: fullPrompt,
              weight: 1,
            },
          ],
          cfg_scale: 7,
          height: 1024,
          width: 1024,
          samples: numberOfImages,
          steps: 30,
        }),
      })
    }

    // Handle response
    let responseText: string
    try {
      responseText = await response.text()
      console.log(`Stability AI response status: ${response.status}`)
      console.log(`Stability AI response: ${responseText.substring(0, 500)}...`)
    } catch (e) {
      console.error("Error reading Stability AI response:", e)
      return NextResponse.json({ error: "Failed to read response from Stability AI" }, { status: 500 })
    }

    if (!response.ok) {
      let errorMessage = "Failed to generate images with Stability AI"
      try {
        responseData = JSON.parse(responseText)
        errorMessage = responseData.message || responseData.error || errorMessage
      } catch (e) {
        errorMessage = responseText || errorMessage
      }

      console.error(`Stability AI error (${response.status}):`, errorMessage)
      return NextResponse.json({ error: errorMessage }, { status: response.status })
    }

    try {
      responseData = JSON.parse(responseText)
    } catch (e) {
      console.error("Error parsing Stability AI JSON response:", e)
      return NextResponse.json({ error: "Invalid JSON response from Stability AI" }, { status: 500 })
    }

    if (!responseData.artifacts || !Array.isArray(responseData.artifacts)) {
      console.error("Invalid response structure from Stability AI:", responseData)
      return NextResponse.json({ error: "Invalid response structure from Stability AI" }, { status: 500 })
    }

    const images = responseData.artifacts.map((artifact: any) => artifact.base64)

    if (!images || images.length === 0) {
      return NextResponse.json({ error: "No images generated by Stability AI." }, { status: 500 })
    }

    console.log(`Successfully generated ${images.length} images with Stability AI`)

    return NextResponse.json({
      images: images,
    })
  } catch (error) {
    console.error("Error in Stability AI generate-images API route:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "An unknown error occurred" },
      { status: 500 },
    )
  }
}

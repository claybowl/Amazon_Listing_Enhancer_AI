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
      // Stability API allows up to 10 images for text2image, 1 for image2image through the standard API.
      // However, some specific model versions or enterprise plans might differ.
      // For img2img, usually 1 image is returned per call. We might need to loop if multiple are requested.
      // For now, we'll adjust this check slightly and handle sample count below.
      return NextResponse.json({ error: "Number of images must be between 1 and 10." }, { status: 400 })
    }

    const engineId = modelId // In Stability API v1, modelId is often the engineId

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
      formData.append("init_image_mode", "IMAGE_STRENGTH") // Or "STEP_SCHEDULE"
      formData.append("text_prompts[0][text]", prompt)
      formData.append("text_prompts[0][weight]", "1")
      formData.append("cfg_scale", "7")
      formData.append("samples", "1") // Typically 1 for img2img, loop if more needed and supported
      formData.append("steps", "30")
      // Note: Stability API might only return 1 image for img2img per call.
      // If numberOfImages > 1, you might need to make multiple calls or check if batching is supported for img2img.
      // For simplicity, this example will request 1 image if sourceImage is present.
      // Consider adjusting `numberOfImages` or looping for multiple img2img generations.

      response = await fetch(`https://api.stability.ai/v1/generation/${engineId}/image-to-image`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${STABILITY_API_KEY}`,
          Accept: "application/json",
          // Content-Type is set automatically by FormData
        },
        body: formData,
      })

      if (!response.ok) {
        try {
          responseData = await response.json()
        } catch (e) {
          responseData = { message: response.statusText }
        }
        return NextResponse.json(
          { error: responseData.message || "Failed to generate images with Stability AI (img2img)" },
          { status: response.status },
        )
      }
      responseData = await response.json()
    } else {
      // Text-to-Image generation (existing logic)
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
          height: 1024, // Consider making these configurable or dynamic
          width: 1024,
          samples: numberOfImages,
          steps: 30,
        }),
      })

      if (!response.ok) {
        try {
          responseData = await response.json()
        } catch (e) {
          responseData = { message: response.statusText }
        }
        return NextResponse.json(
          { error: responseData.message || "Failed to generate images with Stability AI (text2img)" },
          { status: response.status },
        )
      }
      responseData = await response.json()
    }

    const images = responseData.artifacts.map((artifact: any) => artifact.base64)

    if (!images || images.length === 0) {
      return NextResponse.json({ error: "No images generated by Stability AI." }, { status: 500 })
    }

    // If img2img was used and numberOfImages > 1, the current code only returns 1 image.
    // This would be the place to implement looping if multiple variations of the same source image are desired.
    // For now, it returns what the API gives (typically 1 for img2img).

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

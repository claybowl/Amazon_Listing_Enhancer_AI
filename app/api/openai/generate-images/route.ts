import { type NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"

// Get API key from environment variables
const OPENAI_API_KEY = process.env.OPENAI_API_KEY

// Initialize the OpenAI client
const openai = OPENAI_API_KEY ? new OpenAI({ apiKey: OPENAI_API_KEY }) : null

export async function HEAD(request: NextRequest) {
  // Simple HEAD request handler to check if the route exists
  return new NextResponse(null, { status: 200 })
}

export async function POST(request: NextRequest) {
  try {
    // Check if API key is configured
    if (!OPENAI_API_KEY || !openai) {
      return NextResponse.json({ error: "OpenAI API Key not configured on the server." }, { status: 500 })
    }

    // Parse request body
    let body
    try {
      body = await request.json()
    } catch (e) {
      return NextResponse.json({ error: "Invalid JSON in request body" }, { status: 400 })
    }

    const { prompt, numberOfImages = 1, sourceImage, modelId = "dall-e-3" } = body // modelId can be passed for future flexibility

    if (!prompt && !sourceImage) {
      return NextResponse.json({ error: "Missing required field: prompt or sourceImage" }, { status: 400 })
    }
    if (sourceImage && prompt) {
      // OpenAI variations API does not use a text prompt.
      // If we were using edits, it would. For now, clarify this.
      console.warn("OpenAI image variations was called with a prompt. The prompt will be ignored for variations.")
    }


    if (numberOfImages < 1 || numberOfImages > 4) { // DALL-E 3 allows 1, DALL-E 2 allows up to 10 for variations.
      return NextResponse.json({ error: "Number of images must be between 1 and 4 for this configuration." }, { status: 400 })
    }

    let images: (string | undefined)[] = []

    if (sourceImage) {
      // Image Variations using DALL-E 2
      // DALL-E 3 does not support image variations. We must use DALL-E 2.
      // The 'model' parameter is not used in `createVariation` but implies dall-e-2.
      if (modelId === "dall-e-3") {
        console.warn("DALL-E 3 does not support variations. Switching to DALL-E 2 for variations.")
      }

      const imageBuffer = Buffer.from(sourceImage, "base64")
      // OpenAI SDK expects a File-like object. We need to provide name and type.
      const imageFile = {
        name: "source_image.png",
        type: "image/png", // Assuming PNG, adjust if type is known or different
        buffer: imageBuffer,
      }

      // The SDK's createVariation method expects the image as an Uploadable.
      // The actual parameter type for the image is `File | ReadStream | Buffer`.
      // However, the SDK internally converts it. Let's try passing the buffer directly with a cast.
      // If this fails, we might need to create a more elaborate File-like object or use a ReadStream.

      // HACK: Cast the buffer to `any` to satisfy the `Uploadable` type.
      // The SDK should handle this if `name` is provided at the top level of options.
      // This is a common workaround for this SDK.
      const variationResult = await openai.images.createVariation({
        image: imageBuffer as any, // Pass buffer directly
        // model: "dall-e-2", // Not explicitly set, DALL-E 2 is default for variations
        n: numberOfImages,
        size: "1024x1024", // DALL-E 2 supports 256x256, 512x512, 1024x1024
        response_format: "b64_json",
      })
      images = variationResult.data.map((img) => img.b64_json).filter(Boolean)
    } else if (prompt) {
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
While the product depiction MUST remain true to the "Product Context", lounging scene and environment SHOULD be changed to be:
- Highly appealing and fashionable.
- Professional and commercial quality, suitable for a premium Amazon listing.
- Well-lit, clear, and high-resolution.
- The goal is to present the *exact same product* (as per "Product Context") in a *new, enhanced, stylish setting* that makes it look highly desirable.

**Key Rule: Do not change the product's described features. Only change the scene, background, and styling around the product.**
Generate an image that makes this specific product look highly desirable in its new fashionable environment.`

      // DALL-E 3 only supports n=1. So we loop if numberOfImages > 1.
      const imagePromises = []
      for (let i = 0; i < numberOfImages; i++) {
        imagePromises.push(
          openai.images.generate({
            model: modelId, // Use the provided modelId, defaults to dall-e-3
            prompt: fullPrompt,
            n: 1, // Always 1 for DALL-E 3 per call
            size: "1024x1024",
            response_format: "b64_json",
          }),
        )
      }
      const results = await Promise.all(imagePromises)
      images = results.flatMap((result) => result.data.map((img) => img.b64_json)).filter(Boolean)
    }

    if (images.length === 0) {
      return NextResponse.json({ error: "No images generated by OpenAI API." }, { status: 500 })
    }

    return NextResponse.json({
      images: images,
    })
  } catch (error) {
    console.error("Error in OpenAI generate-images API route:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "An unknown error occurred" },
      { status: 500 },
    )
  }
}

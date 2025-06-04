import { type NextRequest, NextResponse } from "next/server"

// Get API key from environment variables
const OPENAI_API_KEY = process.env.OPENAI_API_KEY

export async function HEAD(request: NextRequest) {
  // Simple HEAD request handler to check if the route exists
  return new NextResponse(null, { status: 200 })
}

export async function POST(request: NextRequest) {
  try {
    // Check if API key is configured
    if (!OPENAI_API_KEY) {
      return NextResponse.json({ error: "OpenAI API Key not configured on the server." }, { status: 500 })
    }

    // Parse request body
    let body
    try {
      body = await request.json()
    } catch (e) {
      return NextResponse.json({ error: "Invalid JSON in request body" }, { status: 400 })
    }

    const { prompt, numberOfImages = 1, sourceImage, modelId = "dall-e-3", aspectRatio = "1:1", style = "natural", quality = "standard" } = body

    if (!prompt && !sourceImage) {
      return NextResponse.json({ error: "Missing required field: prompt or sourceImage" }, { status: 400 })
    }

    if (numberOfImages < 1 || numberOfImages > 4) {
      return NextResponse.json(
        { error: "Number of images must be between 1 and 4 for this configuration." },
        { status: 400 },
      )
    }

    let images: string[] = []

    if (sourceImage) {
      // Image Variations using DALL-E 2 (DALL-E 3 doesn't support variations)
      console.log("Creating image variations with DALL-E 2")

      // Convert base64 to blob for form data
      const imageBuffer = Buffer.from(sourceImage, "base64")
      const formData = new FormData()
      formData.append("image", new Blob([imageBuffer], { type: "image/png" }), "image.png")
      formData.append("n", numberOfImages.toString())
      // Map aspectRatio to size for variations
      const size = aspectRatio === "16:9" ? "1792x1024" : aspectRatio === "9:16" ? "1024x1792" : "1024x1024"
      formData.append("size", size)
      formData.append("response_format", "b64_json")

      const response = await fetch("https://api.openai.com/v1/images/variations", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: { message: "Unknown error" } }))
        console.error("OpenAI variations API error:", errorData)
        return NextResponse.json(
          { error: errorData.error?.message || "Failed to create image variations" },
          { status: response.status },
        )
      }

      const data = await response.json()
      images = data.data.map((img: any) => img.b64_json).filter(Boolean)
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
While the product depiction MUST remain true to the "Product Context", the surrounding scene and environment SHOULD be changed to be:
- Highly appealing and fashionable.
- Professional and commercial quality, suitable for a premium Amazon listing.
- Well-lit, clear, and high-resolution.
- The goal is to present the *exact same product* (as per "Product Context") in a *new, enhanced, stylish setting* that makes it look highly desirable.

**Key Rule: Do not change the product's described features. Only change the scene, background, and styling around the product.**
Generate an image that makes this specific product look highly desirable in its new fashionable environment.`

      // Map aspectRatio and quality for DALL-E 3
      const dalleSize = aspectRatio === "16:9" ? "1792x1024" : aspectRatio === "9:16" ? "1024x1792" : "1024x1024"
      const dalleQuality = quality === "hd" ? "hd" : "standard"
      const dalleStyle = style === "vivid" ? "vivid" : "natural"

      // DALL-E 3 only supports n=1, so we loop if numberOfImages > 1
      const imagePromises = []
      for (let i = 0; i < numberOfImages; i++) {
        imagePromises.push(
          fetch("https://api.openai.com/v1/images/generations", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${OPENAI_API_KEY}`,
            },
            body: JSON.stringify({
              model: modelId,
              prompt: fullPrompt,
              n: 1, // Always 1 for DALL-E 3
              size: dalleSize,
              quality: dalleQuality,
              style: dalleStyle,
              response_format: "b64_json",
            }),
          }).then(async (res) => {
            if (!res.ok) {
              const errorData = await res.json().catch(() => ({ error: { message: "Unknown error" } }))
              throw new Error(errorData.error?.message || "Failed to generate image")
            }
            return res.json()
          }),
        )
      }

      const results = await Promise.all(imagePromises)
      images = results.flatMap((result) => result.data.map((img: any) => img.b64_json)).filter(Boolean)
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

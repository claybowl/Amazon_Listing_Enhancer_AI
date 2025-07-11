import { type NextRequest, NextResponse } from "next/server"

// Get API key from environment variables
const REPLICATE_API_KEY = process.env.REPLICATE_API_KEY

export async function HEAD(request: NextRequest) {
  // Simple HEAD request handler to check if the route exists
  return new NextResponse(null, { status: 200 })
}

export async function POST(request: NextRequest) {
  try {
    // Check if API key is configured
    if (!REPLICATE_API_KEY) {
      return NextResponse.json({ error: "Replicate API Key not configured on the server." }, { status: 500 })
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
      modelId = "stability-ai/sdxl:7762fd07cf82c948538e41f63f77d685e02b063e37e496e96eefd46c929f9bdc",
    } = body

    if (!prompt) {
      return NextResponse.json({ error: "Missing required field: prompt" }, { status: 400 })
    }

    if (numberOfImages < 1 || numberOfImages > 4) {
      return NextResponse.json({ error: "Number of images must be between 1 and 4." }, { status: 400 })
    }

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

    // Create an array to store promises for image generation
    const imagePromises = []

    // Create the specified number of images
    for (let i = 0; i < numberOfImages; i++) {
      // Start the prediction
      const startResponse = await fetch("https://api.replicate.com/v1/predictions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${REPLICATE_API_KEY}`,
        },
        body: JSON.stringify({
          version: modelId,
          input: {
            prompt: fullPrompt,
            negative_prompt:
              "low quality, blurry, distorted, deformed, disfigured, bad anatomy, watermark, signature, text",
            width: 1024,
            height: 1024,
          },
        }),
      })

      if (!startResponse.ok) {
        const errorText = await startResponse.text()
        console.error(`Replicate API Error (${startResponse.status}):`, errorText)

        let errorMessage = "Failed to start prediction with Replicate"
        try {
          const error = JSON.parse(errorText)
          errorMessage = error.detail || error.message || errorMessage
        } catch (parseError) {
          errorMessage = errorText || errorMessage
        }

        return NextResponse.json({ error: errorMessage }, { status: startResponse.status })
      }

      const prediction = await startResponse.json()
      imagePromises.push(prediction.id)
    }

    // Array to store the final images
    const images = []

    // Poll for each prediction result
    for (const predictionId of imagePromises) {
      let status = "starting"
      let result
      let pollCount = 0
      const maxPolls = 60 // Maximum 60 seconds of polling

      // Poll until the prediction is complete or fails
      while (status !== "succeeded" && status !== "failed" && status !== "canceled" && pollCount < maxPolls) {
        // Wait for 1 second before polling again
        await new Promise((resolve) => setTimeout(resolve, 1000))
        pollCount++

        const pollResponse = await fetch(`https://api.replicate.com/v1/predictions/${predictionId}`, {
          headers: {
            Authorization: `Token ${REPLICATE_API_KEY}`,
          },
        })

        if (!pollResponse.ok) {
          const errorText = await pollResponse.text()
          console.error(`Replicate Poll Error (${pollResponse.status}):`, errorText)

          let errorMessage = "Failed to poll prediction with Replicate"
          try {
            const error = JSON.parse(errorText)
            errorMessage = error.detail || error.message || errorMessage
          } catch (parseError) {
            errorMessage = errorText || errorMessage
          }

          return NextResponse.json({ error: errorMessage }, { status: pollResponse.status })
        }

        result = await pollResponse.json()
        status = result.status
      }

      if (pollCount >= maxPolls) {
        return NextResponse.json({ error: "Prediction timed out after 60 seconds" }, { status: 408 })
      }

      if (status === "failed" || status === "canceled") {
        const errorMessage = result.error || `Prediction ${status}`
        console.error("Replicate prediction failed:", errorMessage)
        return NextResponse.json({ error: errorMessage }, { status: 500 })
      }

      // The output is an array of image URLs
      // We need to fetch each image and convert it to base64
      const imageUrls = result.output
      if (!imageUrls || !Array.isArray(imageUrls) || imageUrls.length === 0) {
        return NextResponse.json({ error: "No image URLs returned from Replicate" }, { status: 500 })
      }

      // Fetch and convert the image to base64
      const imageUrl = imageUrls[0] // Get the first image URL
      const imageResponse = await fetch(imageUrl)

      if (!imageResponse.ok) {
        return NextResponse.json({ error: "Failed to fetch image from URL" }, { status: 500 })
      }

      const imageBuffer = await imageResponse.arrayBuffer()
      const base64Image = Buffer.from(imageBuffer).toString("base64")
      images.push(base64Image)
    }

    if (images.length === 0) {
      return NextResponse.json({ error: "No images generated by Replicate." }, { status: 500 })
    }

    return NextResponse.json({
      images: images,
    })
  } catch (error) {
    console.error("Error in Replicate generate-images API route:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "An unknown error occurred" },
      { status: 500 },
    )
  }
}

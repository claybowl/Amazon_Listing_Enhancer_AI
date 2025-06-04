import { type NextRequest, NextResponse } from "next/server"

// Get API key from environment variables
const OPENAI_API_KEY = process.env.OPENAI_API_KEY

export async function POST(request: NextRequest) {
  try {
    // Check if API key is configured
    if (!OPENAI_API_KEY) {
      return NextResponse.json({ error: "OpenAI API Key not configured on the server." }, { status: 500 })
    }

    // Parse form data
    const formData = await request.formData()
    const base64Image = formData.get("image") as string
    const modelId = formData.get("modelId") as string

    if (!base64Image) {
      return NextResponse.json({ error: "Missing required field: image" }, { status: 400 })
    }

    // Prepare the prompt for product image analysis
    const systemPrompt = `You are an expert product photographer and e-commerce specialist. 
Your task is to analyze product images and provide detailed, marketing-friendly descriptions.
Focus on:
1. Visual characteristics (color, shape, design, materials)
2. Key features visible in the image
3. Potential benefits and use cases
4. Quality indicators
5. Unique selling points

Format your response as a cohesive, well-structured product description that could be used directly in an Amazon listing.
Keep your description factual based on what you can see - don't make up specifications that aren't visible.
Use professional, persuasive language that highlights the product's strengths.
Do not include placeholder text or mention that you're analyzing an image.`

    const userPrompt = "Analyze this product image and provide a detailed, marketing-friendly description."

    // Call OpenAI API with the image
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: modelId || "gpt-4o",
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: userPrompt,
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${base64Image}`,
                },
              },
            ],
          },
        ],
        max_tokens: 1000,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: { message: "Unknown error" } }))
      console.error("OpenAI API error:", errorData)
      return NextResponse.json(
        { error: errorData.error?.message || "Failed to analyze image" },
        { status: response.status },
      )
    }

    const data = await response.json()
    const analysis = data.choices?.[0]?.message?.content || ""

    if (!analysis) {
      return NextResponse.json({ error: "No analysis generated" }, { status: 500 })
    }

    return NextResponse.json({
      analysis: analysis.trim(),
    })
  } catch (error) {
    console.error("Error in analyze-image API route:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "An unknown error occurred" },
      { status: 500 },
    )
  }
}

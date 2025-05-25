import { type NextRequest, NextResponse } from "next/server";
import { type FeedbackData } from "../../../types"; // Adjust path as necessary

export async function POST(request: NextRequest) {
  try {
    let feedbackData: FeedbackData;

    try {
      feedbackData = await request.json();
    } catch (e) {
      return NextResponse.json({ error: "Invalid JSON in request body" }, { status: 400 });
    }

    // Basic validation
    if (!feedbackData.contentType || !feedbackData.contentReference || !feedbackData.modelId || !feedbackData.rating || !feedbackData.timestamp) {
      return NextResponse.json({ error: "Missing required feedback fields" }, { status: 400 });
    }

    if (feedbackData.contentType !== 'description' && feedbackData.contentType !== 'image') {
      return NextResponse.json({ error: "Invalid contentType" }, { status: 400 });
    }

    if (feedbackData.rating !== 'good' && feedbackData.rating !== 'bad') {
      return NextResponse.json({ error: "Invalid rating" }, { status: 400 });
    }

    // Log the feedback data to the server console (as per subtask requirement)
    console.log("Received feedback:", JSON.stringify(feedbackData, null, 2));

    // Respond with a success message
    return NextResponse.json({ message: "Feedback received successfully" }, { status: 200 });

  } catch (error) {
    console.error("Error processing feedback:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "An unknown error occurred processing feedback" },
      { status: 500 },
    );
  }
}

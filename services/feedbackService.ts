import { type FeedbackData } from "../types";

export async function submitFeedback(feedback: FeedbackData): Promise<void> {
  try {
    const response = await fetch("/api/feedback", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(feedback),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: "Unknown error sending feedback" }));
      throw new Error(errorData.error || `Feedback API request failed with status ${response.status}`);
    }

    // Optional: Log success or handle response data if any
    // const responseData = await response.json();
    // console.log("Feedback submitted successfully:", responseData);

  } catch (error) {
    console.error("Error submitting feedback:", error);
    // Re-throw or handle as needed by the UI
    // For now, we'll let the UI decide how to notify the user based on the error.
    throw error;
  }
}

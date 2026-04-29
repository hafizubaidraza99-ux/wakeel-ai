export async function* streamMessage(history: { role: 'user' | 'model', content: string }[], message: string) {
  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ history, message }),
    });

    if (!response.ok) {
      throw new Error("Failed to connect to Wakeel API");
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) return;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      yield decoder.decode(value);
    }
  } catch (error) {
    console.error("API Error:", error);
    yield "Net ka kuch masla lag raha hai. Please check your connection and try again.";
  }
}

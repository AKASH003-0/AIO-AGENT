export async function streamMessage(message, sessionId = "default_session", onChunk) {
    try {
        const API_KEY = import.meta.env.VITE_GROQ_API_KEY;

        if (!API_KEY) {
            onChunk(" [AUTH ERROR]: Key not detected.");
            return;
        }

        // Use the absolute FASTEST model in the world (Sub-second responses)
        const model = "llama-3.1-8b-instant";

        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${API_KEY.trim()}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: model,
                messages: [{ role: "user", content: message }],
                stream: true,
                temperature: 0.6,
                max_tokens: 1024
            })
        });

        if (!response.ok) {
            const errBody = await response.json();
            onChunk(` [ERROR]: ${errBody.error?.message || "Server issue"}`);
            return;
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let done = false;

        while (!done) {
            const { value, done: readerDone } = await reader.read();
            done = readerDone;
            if (value) {
                const chunk = decoder.decode(value);
                const lines = chunk.split("\n");
                for (const line of lines) {
                    if (line.startsWith("data: ") && line !== "data: [DONE]") {
                        try {
                            const data = JSON.parse(line.substring(6));
                            const contentChunk = data.choices[0].delta.content;
                            if (contentChunk) onChunk(contentChunk);
                        } catch (e) { }
                    }
                }
            }
        }
    } catch (err) {
        onChunk(` [OFFLINE]: Connection lost.`);
    }
}
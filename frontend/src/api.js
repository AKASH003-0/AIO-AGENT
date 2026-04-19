export async function streamMessage(message, sessionId = "default_session", onChunk, imageBase64 = null) {
    try {
        const API_KEY = import.meta.env.VITE_GROQ_API_KEY;

        if (!API_KEY) {
            onChunk(" [AUTH ERROR]: Key not found.");
            return;
        }

        // Updated Model Names (Post-Deprecation)
        const model = imageBase64 ? "llama-3.2-90b-vision-preview" : "llama-3.3-70b-versatile";
        
        let userContent;
        if (imageBase64) {
            userContent = [
                { type: "text", text: message || "Analyze." },
                { type: "image_url", image_url: { url: imageBase64 } }
            ];
        } else {
            userContent = String(message);
        }

        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${API_KEY.trim()}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: model,
                messages: [{ role: "user", content: userContent }],
                stream: true,
                temperature: 0.1
            })
        });

        if (!response.ok) {
            const errBody = await response.json();
            const detailedError = errBody.error?.message || "Unknown error";
            onChunk(` [GROQ ERROR]: ${detailedError}`);
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
        onChunk(` [CONNECTION ERROR]: ${err.message}`);
    }
}
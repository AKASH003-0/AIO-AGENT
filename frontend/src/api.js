export async function streamMessage(message, sessionId = "default_session", onChunk, imageBase64 = null) {
    try {
        const API_KEY = import.meta.env.VITE_GROQ_API_KEY;

        if (!API_KEY) {
            onChunk(" [FAILED]: API Key not detected.");
            return;
        }

        // Logic: Only use the Vision model if an image is actually attached.
        // Otherwise, use the standard 8B model for maximum speed and stability.
        const model = imageBase64 ? "llama-3.2-11b-vision-preview" : "llama3-8b-8192";
        
        let userContent;
        if (imageBase64) {
            // Vision format
            userContent = [
                { type: "text", text: message || "Describe this image." },
                { type: "image_url", image_url: { url: imageBase64 } }
            ];
        } else {
            // Standard Text format
            userContent = message;
        }

        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: model,
                messages: [{ role: "user", content: userContent }],
                stream: true,
                temperature: 0.7,
                max_tokens: 1024
            })
        });

        if (!response.ok) {
            const errBody = await response.text();
            onChunk(` [ERROR]: Server rejected the request (${response.status}).`);
            console.error("Groq Error Response:", errBody);
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
        onChunk(` [OFFLINE]: Check your internet connection.`);
    }
}
export async function streamMessage(message, sessionId = "default_session", onChunk, imageBase64 = null) {
    try {
        const API_KEY = import.meta.env.VITE_GROQ_API_KEY;

        if (!API_KEY) {
            onChunk(" [FAILED]: API Key not detected in environment.");
            return;
        }

        // 1. Determine which model to use
        // Use Vision model ONLY if there is an image, otherwise use the lighting-fast 8B model.
        const model = imageBase64 ? "llama-3.2-11b-vision-preview" : "llama-3.1-8b-instant";
        
        let content;
        if (imageBase64) {
             content = [
                { type: "text", text: message || "Analyze this image." },
                { type: "image_url", image_url: { url: imageBase64 } }
             ];
        } else {
             content = message;
        }

        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: model,
                messages: [{ role: "user", content: content }],
                stream: true
            })
        });

        if (!response.ok) {
            const errBody = await response.text();
            onChunk(` [SERVER ERROR]: ${response.status} - Check if Groq has vision access.`);
            console.error("Groq Error:", errBody);
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
        console.error("CRITICAL CONNECTION ERROR:", err);
        onChunk(` [OFFLINE]: ${err.message}`);
    }
}

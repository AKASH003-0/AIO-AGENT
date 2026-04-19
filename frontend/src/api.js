export async function streamMessage(message, sessionId = "default_session", onChunk, imageBase64 = null) {
    try {
        const API_KEY = import.meta.env.VITE_GROQ_API_KEY;

        if (!API_KEY) {
            onChunk(" [FAILED]: API Key not detected.");
            return;
        }

        // Use the most powerful Vision model for EVERYTHING to ensure he can always see.
        const model = "llama-3.2-11b-vision-preview";
        
        // Construct the multi-modal message properly
        const userContent = [];
        
        // Add text if provided
        userContent.push({ type: "text", text: message || "Analyze this data." });
        
        // Add image if provided
        if (imageBase64) {
            userContent.push({
                type: "image_url",
                image_url: { url: imageBase64 }
            });
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
            onChunk(` [SERVER ERROR]: ${response.status}. Key might be invalid.`);
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
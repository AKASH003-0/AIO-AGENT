// This version talks DIRECTLY to Groq, no backend needed!
export async function streamMessage(message, sessionId = "default_session", onChunk) {
    try {
        // Safe: This looks for your key in Netlify/Local settings
        const API_KEY = import.meta.env.VITE_GROQ_API_KEY;

        if (!API_KEY) {
            onChunk(" [Error: API Key missing. Please add VITE_GROQ_API_KEY to your settings.]");
            return;
        }

        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "llama-3.1-8b-instant",
                messages: [{ role: "user", content: message }],
                stream: true
            })
        });

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
                            const content = data.choices[0].delta.content;
                            if (content) onChunk(content);
                        } catch (e) { }
                    }
                }
            }
        }
    } catch (err) {
        console.error("Connection Error:", err);
        onChunk(" [Connection error. Check your Internet.]");
    }
}


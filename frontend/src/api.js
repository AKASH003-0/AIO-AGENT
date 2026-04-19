export async function streamMessage(message, sessionId = "default_session", onChunk) {
    try {
        const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
        const response = await fetch(`${API_URL}/api/chat`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ message, session_id: sessionId })
        });
        
        if (!response.ok) {
            throw new Error(`Error: ${response.status} ${response.statusText}`);
        }
        
        // Connect to the stream reader
        const reader = response.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let done = false;
        
        while (!done) {
            const { value, done: readerDone } = await reader.read();
            done = readerDone;
            if (value) {
                // Decode the byte array chunk into UTF-8 text
                const chunk = decoder.decode(value, { stream: true });
                onChunk(chunk);
            }
        }
    } catch (err) {
        console.error("API Stream Error:", err);
        onChunk(" [Connection offline. Core standby.]");
    }
}

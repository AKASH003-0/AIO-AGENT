MODEL_NAME = "llama3.2:1b"
FALLBACK_MODEL = "llama3.1:latest"
OLLAMA_URL = "http://localhost:11434/api/chat"
MAX_HISTORY = 6

# Extremely fast performance tuning options for Ollama
OLLAMA_OPTIONS = {
    "num_ctx": 1024,       # Very small context window for lightning speed
    "num_predict": 256,    # Keep responses shorter and faster
    "temperature": 0.8,    
    "top_p": 0.9,
    "num_thread": 8,       # Force multi-threading for faster CPU generation
    "repeat_penalty": 1.1,
}

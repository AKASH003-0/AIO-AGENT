import requests
import json
from config import MODEL_NAME, OLLAMA_URL, OLLAMA_OPTIONS

def execute_ollama_stream(messages):
    """Generic wrapper to call Ollama streaming API without tying to logic."""
    payload = {
        "model": MODEL_NAME,
        "messages": messages,
        "stream": True,
        "options": OLLAMA_OPTIONS
    }
    
    try:
        response = requests.post(OLLAMA_URL, json=payload, stream=True, timeout=60)
        response.raise_for_status()
        return response
    except Exception as e:
        print(f"[ERROR]: Ollama engine error - {e}")
        return None

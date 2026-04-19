import requests
import json
from config import MODEL_NAME, GROQ_API_URL, GROQ_API_KEY

def execute_llm_stream(messages):
    """Generic wrapper to call Groq's super fast cloud inference API."""
    if not GROQ_API_KEY:
        print("[ERROR]: GROQ_API_KEY is missing. You need to set this environment variable.")
        return None

    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json"
    }

    payload = {
        "model": MODEL_NAME,
        "messages": messages,
        "stream": True,
        "temperature": 0.7,
        "max_tokens": 1024
    }
    
    try:
        response = requests.post(GROQ_API_URL, headers=headers, json=payload, stream=True, timeout=60)
        response.raise_for_status()
        return response
    except Exception as e:
        print(f"[ERROR]: Cloud inference engine error - {e}")
        return None

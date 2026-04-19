import os

# Changed from Llama to Groq models
MODEL_NAME = "llama-3.1-8b-instant" 
GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"

# You will need to set this in Render.com environment variables later
GROQ_API_KEY = os.environ.get("GROQ_API_KEY", "")

MAX_HISTORY = 6

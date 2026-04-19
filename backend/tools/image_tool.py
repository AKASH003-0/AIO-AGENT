import urllib.parse
from memory import add_message

def handle_image(user_message: str, session_id: str):
    """Generates an image via highly reliable pollinations model (no auth needed)."""
    
    # Strip trigger words to formulate a clean prompt
    clean_prompt = user_message.lower().replace("draw", "").replace("generate", "").replace("an image of", "").replace("a picture of", "").strip()
    if not clean_prompt:
        clean_prompt = "futuristic AI core"
        
    encoded_prompt = urllib.parse.quote(clean_prompt)
    image_url = f"https://image.pollinations.ai/prompt/{encoded_prompt}?width=1024&height=1024&nologo=true"
    
    bot_response = f"I have initialized the generation parameters. Enjoy the visual output.\n\n![{clean_prompt}]({image_url})"
    yield bot_response
    
    add_message(session_id, "user", user_message)
    add_message(session_id, "assistant", bot_response)
    print(f"[MODEL]: {bot_response}")

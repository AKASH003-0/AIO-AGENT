from tools.chat_tool import stream_chat
from tools.image_tool import handle_image
from tools.video_tool import handle_video

def detect_intent(user_message: str) -> str:
    """Phase 3 basic routing logic."""
    msg = user_message.lower()
    
    video_triggers = ["video", "animate", "render a video"]
    if any(trigger in msg for trigger in video_triggers):
        return "video"
        
    image_triggers = ["draw", "image", "picture", "generate", "create a picture"]
    if any(trigger in msg for trigger in image_triggers):
        return "image"
        
    return "chat"

def get_stream_generator(user_message: str, session_id: str = "default_session"):
    """Determines intent and delegates strictly to the right tool handler."""
    intent = detect_intent(user_message)
    print(f"[ROUTER]: Routing request to -> {intent.upper()} ENGINE")
    
    if intent == "video":
        return handle_video(user_message, session_id)
    elif intent == "image":
        return handle_image(user_message, session_id)
    else:
        return stream_chat(user_message, session_id)

from memory import add_message
import time

def handle_video(user_message: str, session_id: str):
    """Placeholder tool for calling Video Generation API (Sora / Luma / etc) later."""
    
    bot_response = "[Notice: Video Synthesis Engaged. Phase 5 Video Engine is currently in local standby. Production deployment requires dedicated GPU farm connection.]\n\n> `SYS.RENDER_VIDEO({format: 'mp4'})`"
    
    yield bot_response
    
    add_message(session_id, "user", user_message)
    add_message(session_id, "assistant", bot_response)
    print(f"[MODEL]: {bot_response}")

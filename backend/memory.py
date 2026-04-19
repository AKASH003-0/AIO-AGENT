from config import MAX_HISTORY

SYSTEM_PROMPT = "You are Jarvis, a fast AI assistant. Be concise, precise, and helpful. Keep responses short unless asked for detail."

# In-memory store: session_id -> list of message dicts (role, content)
_memory_store = {}

def get_history(session_id: str = "default_session"):
    if session_id not in _memory_store:
        _memory_store[session_id] = []
    return _memory_store[session_id]

def add_message(session_id: str, role: str, content: str):
    if session_id not in _memory_store:
        _memory_store[session_id] = []
    _memory_store[session_id].append({"role": role, "content": content})
    
    # Keep only the last MAX_HISTORY items to prevent context overflow
    if len(_memory_store[session_id]) > MAX_HISTORY:
        _memory_store[session_id] = _memory_store[session_id][-MAX_HISTORY:]

def build_messages(session_id: str, user_message: str):
    """
    Safely structures history: System Prompt -> History -> Current User Message
    """
    history = get_history(session_id)
    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    messages.extend(history)
    messages.append({"role": "user", "content": user_message})
    return messages

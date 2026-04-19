import json
from memory import build_messages, add_message
from llm_client import execute_llm_stream

def stream_chat(user_message: str, session_id: str):
    """The standard chat utility utilizing context memory."""
    messages = build_messages(session_id, user_message)
    response_stream = execute_llm_stream(messages)
    
    if not response_stream:
        yield " [System Offline. Cloud inference failed. Please check your API key.]"
        return
        
    full_response = ""
    for line in response_stream.iter_lines():
        if line:
            line = line.decode('utf-8').strip()
            # Groq/OpenAI SSE format is 'data: {...}'
            if line.startswith("data: "):
                data_str = line[6:]
                if data_str == "[DONE]":
                    break
                try:
                    chunk = json.loads(data_str)
                    if len(chunk["choices"]) > 0:
                        delta = chunk["choices"][0]["delta"]
                        if "content" in delta:
                            token = delta["content"]
                            full_response += token
                            yield token
                except json.JSONDecodeError:
                    pass
                
    add_message(session_id, "user", user_message)
    add_message(session_id, "assistant", full_response)
    try:
        print(f"[MODEL]: {full_response}")
    except UnicodeEncodeError:
        print("[MODEL]: (Response contains unicode characters that cannot be printed to this terminal)")

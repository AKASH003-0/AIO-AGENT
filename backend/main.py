from fastapi import FastAPI
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from router import get_stream_generator

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    message: str
    session_id: str = "default_session"

@app.post("/api/chat")
async def chat(request: ChatRequest):
    # Using FastAPI's StreamingResponse hooked directly to our generator
    return StreamingResponse(
        get_stream_generator(request.message, request.session_id),
        media_type="text/plain"
    )

@app.get("/")
def read_root():
    return {"status": "Jarvis Backend Active - Streaming Authorized"}

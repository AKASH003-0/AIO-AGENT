@echo off
echo ===========================================
echo       JARVIS CORE INITIALIZATION
echo ===========================================

echo Starting Backend Server (FastAPI)...
cd backend
start cmd /k ".\venv\Scripts\activate && uvicorn main:app --host 0.0.0.0 --port 8000"

echo Starting Frontend Terminal (React)...
cd ../frontend
start cmd /k "npm run dev"

echo.
echo All systems operational. Terminal accessible via http://localhost:5173
echo ===========================================
pause

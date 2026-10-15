@echo off
cd /d "%~dp0"

REM Create backend virtual environment
if not exist "backend\.venv" (
  python -m venv backend\.venv
)

call backend\.venv\Scripts\activate.bat
python -m pip install --upgrade pip
python -m pip install -r backend\requirements.txt

start "Backend" cmd /k "cd /d %~dp0 && call backend\.venv\Scripts\activate.bat && cd backend && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"

cd frontend
if not exist "node_modules" (
  call npm install
)
start "Frontend" cmd /k "cd /d %~dp0\frontend && npm run dev"

echo.
echo Smart Recycling Assistant startup complete.
echo Backend: http://localhost:8000/docs

echo Frontend: http://localhost:3000
pause

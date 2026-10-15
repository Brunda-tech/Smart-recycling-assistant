# Smart Recycling Assistant

Smart Recycling Assistant is an AI-powered waste segregation and material flow monitoring platform. It combines a FastAPI backend, a Next.js frontend, a SQLite database, and demo-ready computer vision logic to help users classify waste, track material movements, review analytics, and access an EcoGuide AI assistant.

## Features

- Waste upload and detection with a YOLO-powered pathway when available
- No fabricated detections: when the model/weights are unavailable the scanner reports that and allows manual entry
- Supported high-confidence food classes are mapped; other YOLO labels (including generic bottles, batteries, and electronics) require human review
- Live camera capture where browser camera permissions are allowed (localhost or HTTPS)
- Material tracking in SQLite with movement history
- Digital twin with collection → sorting → processing → recovery pipeline
- AI assistant with rule-based fallback when no API key is configured
- Dashboard and analytics for waste patterns and resource recovery
- CSV export for material records

## Project structure

```text
smart-recycling-assistant/
├── backend/
│   ├── app/
│   ├── tests/
│   ├── uploads/
│   ├── .env.example
│   ├── requirements.txt
│   └── smart_recycling.db
├── frontend/
│   ├── app/
│   ├── components/
│   ├── lib/
│   ├── .env.local.example
│   ├── package.json
│   └── next.config.mjs
├── .gitignore
├── README.md
├── start_project.bat
└── .venv/
```

## Prerequisites

Install the following on Windows:

1. Python 3.12+
2. Node.js LTS 20+
3. VS Code
4. Git (optional but useful)

## Install Python and Node.js

If Python is missing:

- Open winget in Command Prompt and run:

```powershell
winget install --id Python.Python.3.12 --source winget --accept-source-agreements --accept-package-agreements --disable-interactivity
```

If Node.js is missing:

```powershell
winget install --id OpenJS.NodeJS.LTS --source winget --accept-source-agreements --accept-package-agreements --disable-interactivity
```

## Open the project in VS Code

```powershell
cd "C:\Users\brund\OneDrive\Desktop\Smart recycling assistant"
code .
```

## Python virtual environment

Open a new terminal in VS Code and run:

```powershell
cd "C:\Users\brund\OneDrive\Desktop\Smart recycling assistant"
python -m venv backend\.venv
backend\.venv\Scripts\Activate.ps1
```

## Backend setup

```powershell
cd "C:\Users\brund\OneDrive\Desktop\Smart recycling assistant"
backend\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -r backend\requirements.txt
```

Then copy the example environment file and adjust it if needed:

```powershell
copy backend\.env.example backend\.env
```

## Start the backend

```powershell
cd "C:\Users\brund\OneDrive\Desktop\Smart recycling assistant"
backend\.venv\Scripts\Activate.ps1
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Open the API docs here:

- http://localhost:8000/docs

## Frontend setup

Open a second terminal and run:

```powershell
cd "C:\Users\brund\OneDrive\Desktop\Smart recycling assistant\frontend"
npm install
copy .env.local.example .env.local
```

Then start Next.js:

```powershell
npm run dev
```

Open the app in a browser:

- http://localhost:3000

## Optional AI API key

To enable live LLM recommendations, add a key to the backend `.env` file:

```env
OPENAI_API_KEY=your_api_key_here
OPENAI_MODEL=gpt-4o-mini
```

The app will still work without a key using the rule-based fallback assistant. The fallback response is clearly labelled as predefined guidance and should not be mistaken for a live AI reply.

## Demo mode

The app can be demonstrated without an AI API key using the rule-based EcoGuide fallback. Dashboard demo data can be loaded into the database using the demo-data controls. The scanner never represents sample or fabricated objects as model predictions.

## Run tests

In the backend virtual environment:

```powershell
cd "C:\Users\brund\OneDrive\Desktop\Smart recycling assistant\backend"
python -m pytest tests/test_api.py -q
```

## Common troubleshooting

### Python not recognized

Use the full path to Python or reinstall from winget:

```powershell
C:\Users\brund\AppData\Local\Programs\Python\Python312\python.exe --version
```

### Node not recognized

Verify installation:

```powershell
node --version
npm --version
```

### Backend CORS errors

Check the backend `.env` file and make sure the frontend origin is included:

```env
CORS_ORIGINS=http://localhost:3000
```

### Missing packages

```powershell
python -m pip install -r backend\requirements.txt
npm install
```

### Model download issues

The scanner uses Ultralytics YOLO11n by default and attempts to load or download `yolo11n.pt` when detection is first requested. To use a local weights file, set `MODEL_PATH` in `backend\.env` to its full path. If weights are unavailable or cannot be downloaded, the scanner reports that no predictions were produced and offers manual classification; it does not show fabricated detections.

## Demo login

Use the login form and click Demo Login to access the dashboard. This is intentionally a demo experience and not production-grade security.

## Windows auto-start script

From the project root, you can run:

```powershell
start_project.bat
```

The script creates a virtual environment, installs backend dependencies, starts the backend, and launches the frontend.

## Implementation notes

- The backend stores materials in SQLite and survives restarts.
- The digital twin reads actual database records and updates them in place.
- Detection results come from the configured YOLO model; when it is unavailable the API clearly reports that and returns no predictions.
- The chat assistant uses live LLM output only when an API key is present; otherwise it returns fallback advice.

## Final workflow

1. Start backend
2. Start frontend
3. Open http://localhost:3000
4. Log in with Demo Login
5. Upload or detect waste
6. Confirm item classification
7. Track material through the digital twin
8. Ask EcoGuide AI for recommendations
9. Export analytics to CSV

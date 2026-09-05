# SignalIQ

AI-powered Voice-of-Customer platform for product teams.

## MVP
- Upload customer feedback from CSV
- Classify feedback into bug / feature request / pain point / praise
- Detect sentiment, severity, and theme
- Rank product opportunities with a transparent score
- Drill into source evidence
- Use Gemini when a key is available; otherwise use a local fallback analyzer

## Stack
- Frontend: Next.js + TypeScript
- Backend: FastAPI + SQLAlchemy
- Database: PostgreSQL
- AI: Google Gemini
- Local infra: Docker Compose

## Start

### Database
```bash
docker compose up -d db
```

### Backend
```bash
cd backend
python -m venv .venv
# macOS/Linux
source .venv/bin/activate
# Windows PowerShell
# .venv\Scripts\Activate.ps1

pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload
```

Backend: http://localhost:8000
Swagger: http://localhost:8000/docs

### Frontend
```bash
cd frontend
npm install
cp .env.local.example .env.local
npm run dev
```

Frontend: http://localhost:3000

Use `sample_feedback.csv` to test the full flow.

Important: the code is only the MVP. The resume-worthy PM work is in `/docs`: user research, PRD, metrics, evaluation, usability testing, and iteration.

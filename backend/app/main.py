import csv
import io
from fastapi import Depends, FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select
from sqlalchemy.orm import Session

from .config import settings
from .db import Base, engine, get_db
from .models import Feedback, Theme
from .schemas import FeedbackOut, ManualFeedbackIn, ThemeOut
from .services import analyze_all_feedback

Base.metadata.create_all(bind=engine)

app = FastAPI(title="SignalIQ API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_origin],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health():
    return {"status": "ok"}

@app.get("/feedback", response_model=list[FeedbackOut])
def list_feedback(db: Session = Depends(get_db)):
    return db.scalars(select(Feedback).order_by(Feedback.id.desc())).all()

@app.post("/feedback", response_model=FeedbackOut)
def add_feedback(payload: ManualFeedbackIn, db: Session = Depends(get_db)):
    item = Feedback(text=payload.text, source=payload.source, customer_id=payload.customer_id)
    db.add(item)
    db.commit()
    db.refresh(item)
    return item

@app.post("/feedback/upload")
async def upload_feedback(file: UploadFile = File(...), db: Session = Depends(get_db)):
    if not file.filename or not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Please upload a CSV file.")

    raw = await file.read()
    try:
        reader = csv.DictReader(io.StringIO(raw.decode("utf-8-sig")))
    except Exception as exc:
        raise HTTPException(status_code=400, detail="Could not read CSV.") from exc

    if not reader.fieldnames or "text" not in reader.fieldnames:
        raise HTTPException(status_code=400, detail="CSV must include a 'text' column.")

    created = 0
    for row in reader:
        text = (row.get("text") or "").strip()
        if not text:
            continue

        db.add(Feedback(
            text=text,
            source=(row.get("source") or "csv").strip() or "csv",
            customer_id=(row.get("customer_id") or "").strip() or None,
        ))
        created += 1

    db.commit()
    return {"created": created}

@app.post("/analyze")
def analyze(db: Session = Depends(get_db)):
    count = analyze_all_feedback(db)
    return {"analyzed": count}

@app.get("/themes", response_model=list[ThemeOut])
def list_themes(db: Session = Depends(get_db)):
    return db.scalars(
        select(Theme).order_by(Theme.priority_score.desc(), Theme.count.desc())
    ).all()

@app.get("/themes/{theme_name}/evidence", response_model=list[FeedbackOut])
def theme_evidence(theme_name: str, db: Session = Depends(get_db)):
    return db.scalars(
        select(Feedback)
        .where(Feedback.theme == theme_name)
        .order_by(Feedback.severity.desc())
    ).all()

from datetime import datetime
from sqlalchemy import DateTime, Float, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column
from .db import Base

class Feedback(Base):
    __tablename__ = "feedback"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    text: Mapped[str] = mapped_column(Text, nullable=False)
    source: Mapped[str] = mapped_column(String(80), default="unknown")
    customer_id: Mapped[str | None] = mapped_column(String(120), nullable=True)

    feedback_type: Mapped[str | None] = mapped_column(String(50), nullable=True)
    sentiment: Mapped[str | None] = mapped_column(String(30), nullable=True)
    severity: Mapped[int | None] = mapped_column(Integer, nullable=True)
    theme: Mapped[str | None] = mapped_column(String(160), nullable=True)
    confidence: Mapped[float | None] = mapped_column(Float, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

class Theme(Base):
    __tablename__ = "themes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(160), unique=True, nullable=False)
    count: Mapped[int] = mapped_column(Integer, default=0)
    avg_severity: Mapped[float] = mapped_column(Float, default=0)
    negative_ratio: Mapped[float] = mapped_column(Float, default=0)
    source_diversity: Mapped[int] = mapped_column(Integer, default=0)
    priority_score: Mapped[float] = mapped_column(Float, default=0)
    summary: Mapped[str | None] = mapped_column(Text, nullable=True)

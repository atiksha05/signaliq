from collections import defaultdict
from sqlalchemy import delete, select
from sqlalchemy.orm import Session
from .analyzer import analyze_feedback
from .models import Feedback, Theme

def analyze_all_feedback(db: Session) -> int:
    items = db.scalars(select(Feedback)).all()
    for item in items:
        analysis = analyze_feedback(item.text)
        item.feedback_type = analysis["feedback_type"]
        item.sentiment = analysis["sentiment"]
        item.severity = analysis["severity"]
        item.theme = analysis["theme"]
        item.confidence = analysis["confidence"]

    db.commit()
    rebuild_themes(db)
    return len(items)

def rebuild_themes(db: Session) -> None:
    items = db.scalars(select(Feedback).where(Feedback.theme.is_not(None))).all()
    grouped = defaultdict(list)
    for item in items:
        grouped[item.theme].append(item)

    db.execute(delete(Theme))
    db.commit()

    max_count = max((len(v) for v in grouped.values()), default=1)

    for name, group in grouped.items():
        count = len(group)
        avg_severity = sum((x.severity or 1) for x in group) / count
        negative_ratio = sum(x.sentiment == "negative" for x in group) / count
        source_diversity = len({x.source for x in group})

        frequency_score = count / max_count
        severity_score = avg_severity / 5
        source_score = min(source_diversity / 4, 1)

        priority = (
            0.35 * frequency_score
            + 0.30 * severity_score
            + 0.20 * negative_ratio
            + 0.15 * source_score
        ) * 100

        sample_types = sorted({x.feedback_type for x in group if x.feedback_type})
        summary = (
            f"{count} feedback item(s) across {source_diversity} source(s). "
            f"Average severity {avg_severity:.1f}/5. "
            f"Types: {', '.join(sample_types) or 'unclassified'}."
        )

        db.add(Theme(
            name=name,
            count=count,
            avg_severity=round(avg_severity, 2),
            negative_ratio=round(negative_ratio, 3),
            source_diversity=source_diversity,
            priority_score=round(priority, 1),
            summary=summary,
        ))

    db.commit()

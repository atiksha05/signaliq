import json
import re
from typing import Any
from google import genai
from .config import settings

TYPES = ["bug", "feature_request", "pain_point", "praise", "other"]
SENTIMENTS = ["negative", "neutral", "positive"]

def heuristic_analysis(text: str) -> dict[str, Any]:
    lower = text.lower()

    feature_words = ["add ", "please add", "can you", "would like", "need to", "integrate"]
    bug_words = ["wrong", "broken", "error", "crash", "doesn't", "does not", "duplicate", "slow", "takes too long"]
    praise_words = ["love", "great", "saved me", "helpful", "excellent"]

    if any(w in lower for w in praise_words):
        feedback_type, sentiment, severity = "praise", "positive", 1
    elif any(w in lower for w in bug_words):
        feedback_type, sentiment = "bug", "negative"
        severity = 4 if any(w in lower for w in ["crash", "broken", "error"]) else 3
    elif any(w in lower for w in feature_words):
        feedback_type, sentiment, severity = "feature_request", "neutral", 2
    else:
        feedback_type = "pain_point"
        sentiment = "negative" if any(w in lower for w in ["confusing", "hard", "frustrating"]) else "neutral"
        severity = 2

    if "onboarding" in lower or "upload" in lower:
        theme = "Onboarding & Data Import"
    elif "jira" in lower or "slack" in lower or "integrat" in lower:
        theme = "Integrations"
    elif "sentiment" in lower or "theme" in lower or "summar" in lower:
        theme = "AI Analysis Quality"
    elif "slow" in lower or "load" in lower or "latency" in lower:
        theme = "Performance"
    elif "filter" in lower or "segment" in lower:
        theme = "Segmentation & Filtering"
    else:
        theme = "General Product Experience"

    return {
        "feedback_type": feedback_type,
        "sentiment": sentiment,
        "severity": severity,
        "theme": theme,
        "confidence": 0.62,
    }

def extract_json(text: str) -> dict[str, Any]:
    text = text.strip()
    text = re.sub(r"^```json\s*", "", text)
    text = re.sub(r"\s*```$", "", text)
    return json.loads(text)

def analyze_feedback(text: str) -> dict[str, Any]:
    if not settings.gemini_api_key:
        return heuristic_analysis(text)

    client = genai.Client(api_key=settings.gemini_api_key)
    prompt = f"""
You analyze customer feedback for a B2B SaaS product.

Return ONLY valid JSON with exactly these keys:
feedback_type: one of {TYPES}
sentiment: one of {SENTIMENTS}
severity: integer 1-5 where 5 is blocking/critical
theme: concise reusable product theme, 2-6 words
confidence: number 0-1

Rules:
- Never invent context not present in the feedback.
- Theme describes the underlying product problem.
- Feature requests can still have severity.

Customer feedback:
{text}
"""
    try:
        response = client.models.generate_content(
            model=settings.gemini_model,
            contents=prompt,
        )
        result = extract_json(response.text)
        result["severity"] = max(1, min(5, int(result["severity"])))
        result["confidence"] = max(0.0, min(1.0, float(result["confidence"])))
        return result
    except Exception:
        return heuristic_analysis(text)

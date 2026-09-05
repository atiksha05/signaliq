from pydantic import BaseModel, Field

class ManualFeedbackIn(BaseModel):
    text: str = Field(min_length=3)
    source: str = "manual"
    customer_id: str | None = None

class FeedbackOut(BaseModel):
    id: int
    text: str
    source: str
    customer_id: str | None
    feedback_type: str | None
    sentiment: str | None
    severity: int | None
    theme: str | None
    confidence: float | None
    model_config = {"from_attributes": True}

class ThemeOut(BaseModel):
    id: int
    name: str
    count: int
    avg_severity: float
    negative_ratio: float
    source_diversity: int
    priority_score: float
    summary: str | None
    model_config = {"from_attributes": True}

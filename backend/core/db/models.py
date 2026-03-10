from sqlalchemy import Column, Integer, String, Float, JSON, DateTime
from datetime import datetime, timezone
from .database import Base
from pydantic import BaseModel
from typing import Optional, Dict, Any

class APIKey(Base):
    __tablename__ = "api_keys"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, index=True) # Links the key to your specific Google UID
    key_value = Column(String, unique=True, index=True) # The actual "cs_live_..." token
    name = Column(String, default="CLI Agent") # So you know which machine is using it
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

# This is what FastAPI uses to format the JSON response
class ScanResultSchema(BaseModel):
    id: int
    user_id: str
    language: str
    vulnerability_found: bool
    risk_score: int
    severity: str
    recommended_algorithm: str
    created_at: datetime

    class Config:
        from_attributes = True # This tells Pydantic it's okay to read from SQLAlchemy objects

class ScanResult(Base):
    __tablename__ = "scan_results"
    user_id = Column(String, index=True, nullable=True)
    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(String, unique=True, index=True)
    language = Column(String)
    algorithm_scanned = Column(String)
    
    # Phase 1 Data
    risk_score = Column(Float)
    severity = Column(String)
    risk_metrics = Column(JSON)  # Stores the Av, Ds, HNDLp math
    
    # Phase 2 Data
    remediation_data = Column(JSON) # Stores the LLM explanation and code snippet
    
    # Metadata
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
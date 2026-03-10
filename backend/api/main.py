import sys
import os

# Force Python to recognize the root 'backend' folder
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi import FastAPI, Depends, HTTPException, Security
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import List, Optional
import secrets
from api.auth import get_current_user as verify_firebase_user
from worker.tasks import run_pqc_analysis
from worker.celery_app import celery_app
from core.db.database import SessionLocal, engine, get_db
import core.db.models as models
from sqlalchemy.orm import Session

# 1. Create DB tables
models.Base.metadata.create_all(bind=engine)

# 2. INITIALIZE APP FIRST!
app = FastAPI(title="CipherSentinel Enterprise API", version="2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173", 
        "http://127.0.0.1:5173",
        "https://cipher-sentinel.vercel.app"
    ], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 3. SECURITY BOUNCER
security = HTTPBearer()

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Security(security),
    db: Session = Depends(get_db)
):
    token = credentials.credentials
    
    # --- ROUTE 1: MACHINE AUTHENTICATION (API KEY) ---
    if token.startswith("cs_live_"):
        db_key = db.query(models.APIKey).filter(models.APIKey.key_value == token).first()
        if not db_key:
            raise HTTPException(status_code=401, detail="Invalid API Key. Access Denied.")
        return db_key.user_id # Return the human owner of this machine

    # --- ROUTE 2: HUMAN AUTHENTICATION (FIREBASE) ---
    else:
        # Delegate back to your original Firebase function!
        return verify_firebase_user(credentials)


# 4. SCHEMAS
class KeyRequest(BaseModel):
    name: str

class ScanRequest(BaseModel):
    language: str
    vulnerable_code: str
    algorithm: str
    variables: list
    in_transit: bool


# 5. ENDPOINTS

@app.post("/api/v1/keys/generate")
def generate_api_key(
    request: KeyRequest,
    current_user_id: str = Depends(get_current_user), # Only logged-in humans can make keys!
    db: Session = Depends(get_db)
):
    # Create an industry-standard secure prefix key
    raw_key = f"cs_live_{secrets.token_hex(20)}"
    
    new_key = models.APIKey(
        user_id=current_user_id,
        key_value=raw_key,
        name=request.name
    )
    db.add(new_key)
    db.commit()
    
    return {"api_key": raw_key, "name": request.name}


@app.post("/api/v1/scan")
async def initiate_scan(request: ScanRequest, uid: str = Depends(get_current_user)):
    task = run_pqc_analysis.delay(
        request.language, 
        request.vulnerable_code, 
        request.algorithm, 
        request.variables, 
        request.in_transit,
        uid 
    )
    return {"task_id": task.id, "status": "Processing"}


@app.get("/api/v1/scan/{task_id}")
def get_scan_status(
    task_id: str, 
    current_user_id: str = Depends(get_current_user)
):
    from worker.tasks import celery_app 
    task = celery_app.AsyncResult(task_id)
    
    if task.state == 'PENDING':
        return {"status": "PENDING"}
    elif task.state == 'FAILURE':
        return {"status": "FAILED", "error": str(task.info)}
    else:
        return {
            "status": task.state,
            "result": task.result 
        }

    
@app.get("/api/v1/history")
def get_scan_history(
    current_user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        scans = db.query(models.ScanResult)\
                  .filter(models.ScanResult.user_id == current_user_id)\
                  .order_by(models.ScanResult.created_at.desc())\
                  .all()
        
        mapped_scans = []
        for scan in scans:
            mapped_scans.append({
                "id": getattr(scan, "id", None),
                "created_at": getattr(scan, "created_at", None),
                "language": getattr(scan, "language", "Unknown"),
                "algorithm_scanned": getattr(scan, "algorithm_scanned", "Unknown"),
                "risk_score": getattr(scan, "risk_score", 0),
                "severity": getattr(scan, "severity", "UNKNOWN"),
                "remediation_data": getattr(scan, "remediation_data", {})
            })
            
        return mapped_scans
        
    except Exception as e:
        print(f"Error fetching history: {e}")
        return []

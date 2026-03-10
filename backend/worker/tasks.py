import asyncio
from .celery_app import celery_app
from core.quantum_risk.scoring import QuantumRiskEngine, CodeContext
from core.llm_engine.generator import RemediationEngine
from core.db.database import SessionLocal, engine
from core.db import models
from core.scanner.ast_parser import CodeAnalyzer  # Add this import at the top

@celery_app.task(bind=True)
def run_pqc_analysis(self, language: str, vulnerable_code: str, algorithm: str, variables: list, in_transit: bool, user_id: str):
    
    # 1. RUN TRUE AST PARSING
    analysis = CodeAnalyzer.analyze(language, vulnerable_code)
    actual_algorithm = analysis["algorithm"]
    actual_variables = analysis["variables"]

    # 2. Calculate Risk Score
    risk_engine = QuantumRiskEngine()
    context = CodeContext(
        algorithm_used=actual_algorithm,
        variable_names=actual_variables,
        is_data_in_transit=in_transit
    )
    risk_assessment = risk_engine.evaluate_finding(context)

    # 3. Short-circuit OR Run LLM (Keep your existing logic here, but make sure to include "migration_plan" in the 0.0 score fallback)
    if risk_assessment["score"] == 0.0:
        if actual_algorithm == "Unknown":
            explanation = "No cryptographic payload detected."
        else:
            explanation = f"{actual_algorithm} is a NIST-approved standard."
            
        remediation = {
            "vulnerability_explanation": explanation,
            "recommended_algorithm": actual_algorithm,
            "migration_plan": "System is currently quantum-secure. No database or network changes required.",
            "code_snippet": vulnerable_code
        }
    else:
        # 2. Generate Fix via LLM (Only if vulnerable)
        llm_engine = RemediationEngine()
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        remediation = loop.run_until_complete(
            llm_engine.generate_fix(language, vulnerable_code, actual_algorithm)
        )
        loop.close()

    # 3. SAVE TO DATABASE
    db = SessionLocal()
    try:
        db_scan = models.ScanResult(
            task_id=self.request.id,
            user_id=user_id, # 👈 THE MISSING LINK! Attach the scan to the user!
            language=language,
            algorithm_scanned=actual_algorithm, # 👈 Use the real one found by AST
            risk_score=risk_assessment["score"],
            severity=risk_assessment["severity"],
            risk_metrics=risk_assessment["metrics"],
            remediation_data=remediation
        )
        db.add(db_scan)
        db.commit()
    except Exception as e:
        db.rollback()
        print(f"Database error: {e}")
    finally:
        db.close()


    return {
        "status": "COMPLETED",
        "risk_profile": risk_assessment,
        "remediation": remediation
    }
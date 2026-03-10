from pydantic import BaseModel
from typing import List
from .constants import ALGORITHM_SCORES, SENSITIVE_KEYWORDS, WEIGHT_ALGORITHM, WEIGHT_DATA_SENSITIVITY, WEIGHT_HNDL

class CodeContext(BaseModel):
    algorithm_used: str
    variable_names: List[str]
    is_data_in_transit: bool  # HNDL applies heavily to intercepted transit data

class QuantumRiskEngine:
    def __init__(self):
        self.max_score = 100.0

    def calculate_data_sensitivity(self, variables: List[str]) -> float:
        """Calculates sensitivity (0.0 to 1.0) based on variable names."""
        score = 0.0
        for var in variables:
            if any(keyword in var.lower() for keyword in SENSITIVE_KEYWORDS):
                score += 0.5  # Add weight for each sensitive variable
        return min(score, 1.0)

    def calculate_hndl_probability(self, is_in_transit: bool, data_sensitivity: float) -> float:
        """HNDL is highest for sensitive data moving over networks."""
        if is_in_transit and data_sensitivity > 0.5:
            return 1.0
        elif is_in_transit:
            return 0.6
        return 0.2  # Data at rest has lower immediate HNDL risk, but not zero

    def evaluate_finding(self, context: CodeContext) -> dict:
        # 👇 NEW: Immediately catch non-cryptographic code
        if context.algorithm_used == "Unknown":
            return {
                "score": 0.0,
                "severity": "SAFE",
                "metrics": {
                    "algorithm_vulnerability": 0.0,
                    "data_sensitivity": 0.0,
                    "hndl_probability": 0.0
                },
                "recommendation": "No cryptographic primitives detected. Code is safe."
            }

        av = ALGORITHM_SCORES.get(context.algorithm_used, 0.5) 
        ds = self.calculate_data_sensitivity(context.variable_names)
        hndlp = self.calculate_hndl_probability(context.is_data_in_transit, ds)

        pqvs = (WEIGHT_ALGORITHM * av) + (WEIGHT_DATA_SENSITIVITY * ds) + (WEIGHT_HNDL * hndlp)

        if av == 0.0:
            pqvs = 0.0

        if pqvs >= 75: severity = "CRITICAL"
        elif pqvs >= 50: severity = "HIGH"
        elif pqvs >= 25: severity = "MEDIUM"
        else: severity = "SAFE"

        return {
            "score": round(pqvs, 2),
            "severity": severity,
            "metrics": {
                "algorithm_vulnerability": av,
                "data_sensitivity": ds,
                "hndl_probability": hndlp
            },
            "recommendation": "Maintain current PQC implementation." if av == 0.0 else f"Upgrade {context.algorithm_used} to a NIST-approved PQC algorithm."
        }

# --- Quick Test ---
if __name__ == "__main__":
    engine = QuantumRiskEngine()
    test_context = CodeContext(
        algorithm_used="RSA-2048",
        variable_names=["user_auth_token", "session_id"],
        is_data_in_transit=True
    )
    result = engine.evaluate_finding(test_context)
    print(f"Audit Result: {result}")
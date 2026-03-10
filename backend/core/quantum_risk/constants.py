# Constants for Quantum Risk Scoring

# Weights (Sum = 100)
WEIGHT_ALGORITHM = 50.0
WEIGHT_DATA_SENSITIVITY = 30.0
WEIGHT_HNDL = 20.0

# Algorithm Vulnerability Scores (0.0 to 1.0)
# Based on NIST SP 800-208 and FIPS 203/204/205 transitions
ALGORITHM_SCORES = {
    "RSA-1024": 1.0,   # Critically vulnerable (already broken classically)
    "RSA-2048": 0.9,   # Vulnerable to Shor's
    "ECC-256": 0.9,    # Vulnerable to Shor's
    "SHA-256": 0.2,    # Quantum resistant (Grover's algorithm halves effective security, but still safe)
    "AES-128": 0.5,    # Vulnerable to Grover's, upgrade to 256 recommended
    "AES-256": 0.1,    # Quantum resistant
    "ML-KEM": 0.0,     # Post-Quantum secure (FIPS 203)
    "ML-DSA": 0.0      # Post-Quantum secure (FIPS 204)
}

# High HNDL keyword triggers (Regex patterns can be mapped to these)
SENSITIVE_KEYWORDS = [
    "password", "secret", "token", "ssn", "credit_card", "pii", "auth", "session"
]
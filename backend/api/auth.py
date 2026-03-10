import firebase_admin
from firebase_admin import credentials, auth
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import os

# 1. Initialize Firebase Admin using your downloaded key
cred_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "firebase-credentials.json")
try:
    cred = credentials.Certificate(cred_path)
    firebase_admin.initialize_app(cred)
except ValueError:
    pass # App already initialized

# 2. Setup the Bearer Token interceptor
security = HTTPBearer()

# 3. The Bouncer: Verifies the JWT mathematically
def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> str:
    token = credentials.credentials
    try:
        # Cryptographically verify the Google token
        decoded_token = auth.verify_id_token(token)
        return decoded_token['uid'] # Return the unique Firebase User ID
    except Exception as e:
        print(f"Token verification failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        )
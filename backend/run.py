import uvicorn
import sys
import os

# 1. Force the absolute path into Python's brain before Uvicorn starts
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

if __name__ == "__main__":
    # 2. Boot Uvicorn programmatically so it inherits the correct path
    uvicorn.run("api.main:app", host="127.0.0.1", port=8000, reload=True)
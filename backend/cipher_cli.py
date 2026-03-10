import argparse
import requests
import sys
import os
import time

API_URL = "http://127.0.0.1:8000/api/v1/scan"

def scan_file(file_path, token):
    if not os.path.exists(file_path):
        print(f"❌ Error: File '{file_path}' not found.")
        sys.exit(1)

    print("\n=========================================")
    print(f"🛡️  CIPHERSENTINEL TERMINAL UPLINK v1.0")
    print("=========================================")
    print(f"📁 Target: {file_path}")
    print(f"⏳ Initiating Post-Quantum Analysis...")

    # 1. Read the local file
    with open(file_path, 'r') as file:
        code_content = file.read()

    # 2. Package the payload exactly how FastAPI expects it
    payload = {
        "language": "java", 
        "vulnerable_code": code_content,
        "algorithm": "auto-detect",
        "variables": [],
        "in_transit": True
    }

    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {token}"
    }

    # 3. Fire it at the local FastAPI backend
    try:
        response = requests.post(API_URL, json=payload, headers=headers)
        
        if response.status_code != 200:
            print(f"❌ Server Error: {response.text}")
            sys.exit(1)

        data = response.json()
        task_id = data.get("task_id") or data.get("id")
        print(f"✅ Payload accepted by Core. Task ID: {task_id}")
        print("🔄 Polling Dual-Engine for results...\n")

        # 4. Poll for the result
        while True:
            time.sleep(2)
            poll_resp = requests.get(f"{API_URL}/{task_id}", headers=headers)
            poll_data = poll_resp.json()
            
            status = poll_data.get("status", poll_data.get("task_status", poll_data.get("state")))
            
            if status in ["SUCCESS", "COMPLETED"]:
                result = poll_data.get("result", poll_data.get("task_result", poll_data))
                score = result.get("risk_profile", {}).get("score", 0)
                remediation = result.get("remediation", {}).get("recommended_algorithm", "Safe")
                
                print("=========================================")
                print(f"🚨 SCAN COMPLETE 🚨")
                print(f"Risk Score:      {score}")
                print(f"Recommendation:  {remediation}")
                print("=========================================")
                print("💻 View full audit trail in the CipherSentinel Web Dashboard.\n")
                break
            elif status in ["FAILED", "FAILURE"]:
                print("❌ Analysis failed on the server.")
                break
            else:
                print(f"   ... Status: {status}")

    except requests.exceptions.ConnectionError:
        print("❌ Error: Could not connect to backend. Is FastAPI running on 127.0.0.1:8000?")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="CipherSentinel Local CLI Scanner")
    parser.add_argument("file", help="Path to the file you want to scan")
    parser.add_argument("--token", required=True, help="Your temporary Firebase Auth Token")
    
    args = parser.parse_args()
    scan_file(args.file, args.token)
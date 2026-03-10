import sqlite3
from datetime import datetime
import re
import base64
from flask import Flask, jsonify, request
import logging
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
import os
import zipfile
import tempfile
from werkzeug.utils import secure_filename
from scanner import run_semgrep_scan
from flask_cors import CORS

app = Flask(__name__)
CORS(app) # Enable CORS for all routes and origins
# Hardcoded for now; in production, these would live in environment variables (.env)
VALID_API_KEYS = {"super-secret-key-123", "ciphersentinel-admin"}
# --- NEW: Initialize the Rate Limiter ---
# This tracks requests by IP address in memory
limiter = Limiter(
    get_remote_address,
    app=app,
    default_limits=["200 per day", "50 per hour"],
    storage_uri="memory://"
)
def init_db():
    """Initialize the SQLite database and create the scans table."""
    conn = sqlite3.connect('ciphersentinel.db')
    c = conn.cursor()
    c.execute('''
        CREATE TABLE IF NOT EXISTS scans (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT,
            source_ip TEXT,
            payload TEXT,
            threat_level TEXT,
            findings TEXT
        )
    ''')
    conn.commit()
    conn.close()
    logging.info("Database initialized successfully.")

# Run the initialization
init_db()

# Basic logging to track requests in your terminal
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("ciphersentinel.log"), # Saves to this file
        logging.StreamHandler()                    # Still prints to terminal
    ]
)

@app.route('/', methods=['GET'])
def home():
    """Root endpoint - health check and welcome."""
    return jsonify({
        "status": "online",
        "service": "CipherSentinel API",
        "version": "1.0.0",
        "message": "Welcome to the CipherSentinel API. Ready for analysis."
    }), 200

# ... (app initialization and root route stay the same) ...

@app.route('/api/v1/scan', methods=['POST'])
@limiter.limit("5 per minute")
def scan_payload():
    """Endpoint to analyze incoming data for vulnerabilities and evasions."""

    # --- NEW: Check for API Key ---
    api_key = request.headers.get('X-API-Key')
    if not api_key or api_key not in VALID_API_KEYS:
        logging.warning(f"Unauthorized scan attempt. Provided key: {api_key}")
        return jsonify({"error": "Unauthorized. Invalid or missing X-API-Key header."}), 401
        
    data = request.get_json()
    
    if not data or 'payload' not in data:
        return jsonify({"error": "Missing 'payload' in request body"}), 400
        
    original_payload = data['payload']
    payloads_to_scan = [original_payload]
    findings = []
    threat_level = "low"

    # Attempt to decode Base64 to catch obfuscated attacks
    try:
        # Check if it looks like base64 (very basic check)
        if re.match(r'^[A-Za-z0-9+/]+={0,2}$', original_payload) and len(original_payload) % 4 == 0:
            decoded_bytes = base64.b64decode(original_payload)
            decoded_string = decoded_bytes.decode('utf-8')
            payloads_to_scan.append(decoded_string)
            findings.append("Note: Payload was Base64 encoded and decoded for scanning.")
    except Exception:
        pass # If it fails to decode cleanly, just move on

    # Run the checks against all variations of the payload
    for target_payload in payloads_to_scan:
        # 1. Detect Cross-Site Scripting (XSS)
        if re.search(r'(?i)(<script.*?>.*?</script.*?>|javascript:|onerror=|onload=)', target_payload):
            if "Cross-Site Scripting (XSS) signature detected." not in findings:
                findings.append("Cross-Site Scripting (XSS) signature detected.")
                threat_level = "high"
            
        # 2. Detect SQL Injection (SQLi)
        if re.search(r'(?i)(\bOR\b\s+1=1|\bUNION\b.*?\bSELECT\b|DROP\s+TABLE|--$)', target_payload):
            if "SQL Injection (SQLi) signature detected." not in findings:
                findings.append("SQL Injection (SQLi) signature detected.")
                threat_level = "critical"
            
        # 3. Detect OS Command Injection
        if re.search(r'(?i)(;|\|\||&&)\s*(ls|cat|whoami|id|bash|sh|wget|curl)\b', target_payload):
            if "OS Command Injection signature detected." not in findings:
                findings.append("OS Command Injection signature detected.")
                threat_level = "critical"

        # 4. Detect Directory Traversal (Path Traversal)
        if re.search(r'(?i)(\.\./|\.\.\\|%2e%2e%2f|%2e%2e%5c)', target_payload):
            if "Directory Traversal signature detected." not in findings:
                findings.append("Directory Traversal signature detected.")
                threat_level = "critical"

    # Default fallback
    if len(findings) == 0 or (len(findings) == 1 and findings[0].startswith("Note:")):
        if "Note: Payload was Base64 encoded and decoded for scanning." not in findings:
            findings.append("No immediate vulnerabilities detected.")
        status = "clean"
    else:
        status = "malicious_activity_detected"
    
    

    result = {
        "target": original_payload,
        "status": status,
        "threat_level": threat_level,
        "findings": findings
    }
    
    if status == "malicious_activity_detected":
        logging.warning(f"THREAT DETECTED [{threat_level.upper()}]: {findings} | Target: {original_payload}")
    else:
        logging.info(f"Clean payload scanned: {original_payload}")
    
    try:
        conn = sqlite3.connect('ciphersentinel.db')
        c = conn.cursor()
        # Convert the findings list to a string so it can be stored in the DB
        findings_str = ", ".join(findings)
        
        c.execute('''
            INSERT INTO scans (timestamp, source_ip, payload, threat_level, findings) 
            VALUES (?, ?, ?, ?, ?)
        ''', (datetime.now().isoformat(), request.remote_addr, original_payload, threat_level, findings_str))
        
        conn.commit()
        conn.close()
    except Exception as e:
        logging.error(f"Failed to save scan to database: {e}")

    return jsonify(result), 200

@app.route('/api/v1/sast-scan', methods=['POST'])
@limiter.limit("10 per hour") # Stricter limit for heavy file scans
def sast_scan():
    """Endpoint to upload a ZIP file of source code for NIST PQC analysis."""
    
    # 1. Check API Key
    api_key = request.headers.get('X-API-Key')
    if not api_key or api_key not in VALID_API_KEYS:
        return jsonify({"error": "Unauthorized."}), 401

    # 2. Check if a file was actually uploaded
    if 'file' not in request.files:
        return jsonify({"error": "No file part in the request"}), 400
        
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    # 3. Ensure it's a ZIP file
    if not file.filename.endswith('.zip'):
        return jsonify({"error": "Only .zip files are supported"}), 400

    # 4. Secure the filename and process it in a temporary directory
    filename = secure_filename(file.filename)
    
    # tempfile.TemporaryDirectory automatically deletes the folder and its contents when the block ends
    with tempfile.TemporaryDirectory() as temp_dir:
        zip_path = os.path.join(temp_dir, filename)
        file.save(zip_path)
        
        try:
            # Extract the ZIP
            with zipfile.ZipFile(zip_path, 'r') as zip_ref:
                zip_ref.extractall(temp_dir)
                
            # Run our Semgrep wrapper on the extracted files
            findings = run_semgrep_scan(temp_dir)
            
            # Remove the full temp path from the file strings so the frontend just sees clean relative paths
            for finding in findings:
                if 'file' in finding:
                    finding['file'] = finding['file'].replace(temp_dir + "/", "")
            
            result = {
                "status": "success",
                "files_analyzed": True,
                "findings": findings
            }
            
            # Log the successful scan to our database
            conn = sqlite3.connect('ciphersentinel.db')
            c = conn.cursor()
            c.execute('''
                INSERT INTO scans (timestamp, source_ip, payload, threat_level, findings) 
                VALUES (?, ?, ?, ?, ?)
            ''', (datetime.now().isoformat(), request.remote_addr, filename, "sast_scan", str(len(findings)) + " PQC issues found"))
            conn.commit()
            conn.close()

            return jsonify(result), 200

        except zipfile.BadZipFile:
            return jsonify({"error": "The uploaded file is not a valid ZIP archive."}), 400
        except Exception as e:
            logging.error(f"SAST scan error: {str(e)}")
            return jsonify({"error": "An error occurred during scanning."}), 500

# ... (error handler and main block stay the same) ...

@app.errorhandler(404)
def not_found(error):
    """Custom 404 error handler to keep API responses as JSON."""
    return jsonify({"error": "Endpoint not found. Check your URL."}), 404

if __name__ == '__main__':
    # Initialize the DB one last time before start
    init_db()
    
    # Render uses the PORT environment variable. If it's not there, we use 5000 for local dev.
    port = int(os.environ.get("PORT", 5000))
    
    print(f"[*] Starting CipherSentinel API on port {port}")
    
    # In production, we MUST bind to 0.0.0.0 so Render can route traffic to the app.
    # We also disable debug=True in production for security.
    app.run(host='0.0.0.0', port=port, debug=False)
import subprocess
import json
import logging

def run_semgrep_scan(target_directory):
    """Runs Semgrep against a directory and maps findings."""
    command = [
        "semgrep", 
        "--config", "rules.yaml", 
        target_directory, 
        "--json"
    ]
    
    try:
        # Run the command and capture the output
        result = subprocess.run(command, capture_output=True, text=True, check=False)
        
        # Semgrep returns standard JSON when the --json flag is used
        semgrep_output = json.loads(result.stdout)
        
        structured_findings = []
        
        # Parse the raw Semgrep JSON into our clean dashboard format
        for match in semgrep_output.get('results', []):
            structured_findings.append({
                "file": match['path'],
                "line": match['start']['line'],
                "vulnerability": match['check_id'],
                "recommendation": match['extra']['message'],
                "severity": match['extra']['severity']
            })
            
        return structured_findings

    except Exception as e:
        logging.error(f"Semgrep execution failed: {str(e)}")
        return {"error": "Scan failed to execute properly."}
# CipherSentinel 🛡️

> **Dual-engine security analysis for the post-quantum era.** Scan source code for deprecated cryptography and inspect live payloads for web attacks — all from a single SOC-grade dashboard.

---

## What Is CipherSentinel?

CipherSentinel helps engineering teams answer two critical questions:

1. **"Is our codebase ready for post-quantum cryptography?"** — Upload a `.zip` of your source code and get a detailed PQC readiness report with migration paths mapped directly to NIST standards.
2. **"Is this payload malicious?"** — Submit any text payload to the WAF API and get an instant verdict on XSS, SQL injection, and directory traversal — including Base64-obfuscated variants.

---

## Features

### Static Application Security Testing (SAST)

CipherSentinel scans `.zip` archives of Java, Python, and JavaScript/TypeScript projects using custom Semgrep rulesets. It flags deprecated algorithms (MD5, SHA-1, RSA) and maps each finding to a concrete NIST PQC migration recommendation — for example, replacing RSA with ML-KEM (Kyber). Every scan produces a PQC readiness score alongside prioritized, actionable remediation steps.

### Web Application Firewall (WAF) API

A lightweight REST API that inspects JSON payloads for XSS, SQL injection, and directory traversal signatures. CipherSentinel automatically attempts Base64 decoding before signature matching, catching obfuscated attack patterns that bypass naive filters. All scanned payloads and detections are persisted to an audit log for later review.

### SOC Dashboard

A dark-mode React interface with a drag-and-drop upload zone, real-time PQC readiness scoring, and threat-level metrics. Built for security analysts who need signal without noise.

### API Hardening

All endpoints require an `X-API-Key` header and are rate-limited via Flask-Limiter to resist brute-force and DDoS attempts.

---

## Architecture

```
┌─────────────────────────────────────┐
│         React Frontend              │
│  TypeScript · Vite · Chakra UI v2  │
│  Lucide Icons · React-Dropzone     │
└──────────────────┬──────────────────┘
                   │ REST / JSON
┌──────────────────▼──────────────────┐
│           Flask Backend             │
│  Flask-CORS · Flask-Limiter        │
│  Werkzeug · SQLite3                │
└──────────────────┬──────────────────┘
                   │ subprocess
┌──────────────────▼──────────────────┐
│         Analysis Engine             │
│  Semgrep CLI · Custom PQC Rulesets │
└─────────────────────────────────────┘
```

---

## Quickstart

### Prerequisites

- Python 3.10+
- Node.js 18+ and npm
- Semgrep (`pip install semgrep`)

### 1. Start the Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate       # Windows: venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

The API will be available at `http://localhost:5000`.

### 2. Start the Frontend

In a new terminal:

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## API Reference

### `POST /api/v1/sast-scan` — Static Code Analysis

Uploads a `.zip` archive for PQC vulnerability scanning.

| | |
|---|---|
| **Auth** | `X-API-Key: <your-key>` |
| **Body** | `multipart/form-data` · key: `file` |
| **Rate limit** | 10 requests / hour |

**Example**

```bash
curl -X POST http://localhost:5000/api/v1/sast-scan \
  -H "X-API-Key: your-key-here" \
  -F "file=@project.zip"
```

**Response**

```json
{
  "pqc_score": 42,
  "findings": [
    {
      "rule": "deprecated-rsa",
      "file": "src/auth/KeyManager.java",
      "line": 38,
      "severity": "HIGH",
      "remediation": "Migrate to ML-KEM (FIPS 203)"
    }
  ]
}
```

---

### `POST /api/v1/scan` — WAF Payload Inspection

Inspects a text payload for malicious patterns.

| | |
|---|---|
| **Auth** | `X-API-Key: <your-key>` |
| **Content-Type** | `application/json` |
| **Rate limit** | 5 requests / minute |

**Example**

```bash
curl -X POST http://localhost:5000/api/v1/scan \
  -H "X-API-Key: your-key-here" \
  -H "Content-Type: application/json" \
  -d '{"payload": "<script>alert(1)</script>"}'
```

**Response**

```json
{
  "threat_detected": true,
  "type": "XSS",
  "confidence": "HIGH",
  "decoded_payload": null
}
```

---

## Threat Coverage

| Attack Type | Direct | Base64-Obfuscated |
|---|:---:|:---:|
| Cross-Site Scripting (XSS) | ✅ | ✅ |
| SQL Injection | ✅ | ✅ |
| Directory Traversal | ✅ | ✅ |
| Deprecated Cryptography (MD5, SHA-1, RSA) | ✅ | — |

---

## Contributing

Pull requests are welcome. For significant changes, open an issue first to discuss your proposal. Please ensure all API changes are reflected in this README.

---

## License

[MIT](LICENSE)

import os
import json
from openai import AsyncOpenAI
from dotenv import load_dotenv
from .prompts import PQC_SYSTEM_PROMPT, build_remediation_prompt

load_dotenv()

# Point the OpenAI client to Groq's free API endpoint!
client = AsyncOpenAI(
    api_key=os.environ.get("GROQ_API_KEY"),
    base_url="https://api.groq.com/openai/v1"
)

class RemediationEngine:

    def __init__(self, model_name: str = "llama-3.3-70b-versatile"):
        self.model_name = model_name

    async def generate_fix(self, language: str, vulnerable_code: str, algorithm: str) -> dict:
        """
        Calls the LLM asynchronously to generate a PQC-compliant code fix.
        """
        user_prompt = build_remediation_prompt(language, vulnerable_code, algorithm)

        try:
            response = await client.chat.completions.create(
                model=self.model_name,
                messages=[
                    {"role": "system", "content": PQC_SYSTEM_PROMPT},
                    {"role": "user", "content": user_prompt}
                ],
                response_format={ "type": "json_object" }, 
                temperature=0.2 
            )
            
            raw_content = response.choices[0].message.content
            return json.loads(raw_content)

        except Exception as e:
            return {
                "error": str(e),
                "vulnerability_explanation": f"Failed to generate dynamic fix for {algorithm}.",
                "recommended_algorithm": "Manual review required for PQC migration.",
                "code_snippet": None
            }
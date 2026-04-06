import httpx
import json
from config import settings

class AIEngine:
    def __init__(self):
        self.api_key = settings.openai_api_key
        self.base_url = settings.ai_base_url
        self.model = settings.ai_model

    def analyze_code(self, code: str, rule_issues: list[dict]) -> dict:
        if not self.api_key:
            return {
                "explanation": "AI Analysis bypassed (No API Key).",
                "fix": "// Please provide an OPENROUTER_API_KEY in environment to see AI fixes."
            }

        prompt = f"""
        You are a senior Web3 security auditor.
        
        Analyzed Contract Code:
        ```solidity
        {code}
        ```
        
        Issues detected by rule engine:
        {json.dumps(rule_issues, indent=2)}
        
        Task:
        1. Explain these vulnerabilities clearly but concisely.
        2. Provide a specific, developer-friendly fix in Solidity.
        3. Be practical and stay brief.
        
        Return ONLY a JSON object with this format:
        {{
          "explanation": "Brief explanation...",
          "fix": "Contract after fix..."
        }}
        """

        try:
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json",
                "X-Title": settings.ai_app_name,
                "HTTP-Referer": settings.ai_app_url
            }
            payload = {
                "model": self.model,
                "messages": [
                    {"role": "system", "content": settings.ai_system_prompt},
                    {"role": "user", "content": prompt}
                ],
                "response_format": { "type": "json_object" }
            }
            
            with httpx.Client(timeout=30.0) as client:
                response = client.post(f"{self.base_url}/chat/completions", headers=headers, json=payload)
                response.raise_for_status()
                data = response.json()
            
            content = data["choices"][0]["message"]["content"]
            # Basic cleanup if the model didn't return pure JSON
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0].strip()
            
            return json.loads(content)
        except Exception as e:
            print(f"AI Engine Error: {e}")
            return {
                "explanation": "Failed to generate AI reasoning. Please check logs.",
                "fix": "// AI Generation error."
            }
    def generate_poc_test(self, code: str, rule_issues: list[dict]) -> str:
        if not self.api_key or not rule_issues:
            return "// No issues detected to generate PoC test."

        prompt = f"""
        You are a smart contract exploit specialist.
        
        Analyzed Contract Code:
        ```solidity
        {code}
        ```
        
        Issues detected:
        {json.dumps(rule_issues, indent=2)}
        
        Task:
        Generate a concise, runnable Foundry (Solidity) or Hardhat (TypeChain/Javascript) test snippet that demonstrates how an attacker might exploit one of the critical/high issues detected.
        Focus on the most impactful vulnerability.
        
        Requirements:
        - Use standard libraries (Forge-Std for Foundry).
        - Keep it minimal and readable.
        - Include comments explaining the exploit steps.
        
        Return ONLY the code snippet (no conversation).
        """

        try:
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json",
                "X-Title": settings.ai_app_name,
                "HTTP-Referer": settings.ai_app_url
            }
            payload = {
                "model": self.model,
                "messages": [
                    {"role": "system", "content": "You are a professional security researcher and exploit developer."},
                    {"role": "user", "content": prompt}
                ]
            }
            
            with httpx.Client(timeout=30.0) as client:
                response = client.post(f"{self.base_url}/chat/completions", headers=headers, json=payload)
                response.raise_for_status()
                data = response.json()
            
            return data["choices"][0]["message"]["content"]
        except Exception as e:
            print(f"PoC Generation Error: {e}")
            return "// Error generating PoC test snippet."

    def semantic_logic_review(self, code: str) -> list[dict]:
        if not self.api_key:
            return []

        prompt = f"""
        You are a smart contract logic auditor.
        
        Contract Code:
        ```solidity
        {code}
        ```
        
        Task:
        Identify logic errors or high-level vulnerabilities that are NOT simple regex patterns (e.g. Broken state machines, incorrect authorization logic, flawed game theory, or missing critical 'require' checks).
        
        Return ONLY a JSON list of findings:
        [
          {{
            "name": "Found Logic Flaw",
            "severity": "high",
            "description": "Explanation of why the logic is flawed...",
            "line_numbers": [12]
          }}
        ]
        
        Keep it brief. If no deep logic flaws are found, return [].
        """

        try:
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json",
                "X-Title": settings.ai_app_name,
                "HTTP-Referer": settings.ai_app_url
            }
            payload = {
                "model": settings.ai_model,
                "messages": [
                    {"role": "system", "content": "You are a professional logic auditor and game theorist."},
                    {"role": "user", "content": prompt}
                ],
                "response_format": { "type": "json_object" }
            }
            
            with httpx.Client(timeout=30.0) as client:
                response = client.post(f"{settings.ai_base_url}/chat/completions", headers=headers, json=payload)
                response.raise_for_status()
                data = response.json()
            
            content = data["choices"][0]["message"]["content"]
            # Basic cleanup
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0].strip()
            
            result = json.loads(content)
            # Ensure it's a list even if model returns { "findings": [...] }
            # result might be list or dict
            findings = result if isinstance(result, list) else result.get("findings", result.get("issues", []))
            # If still dict, wrap in list if it's a finding
            if isinstance(findings, dict) and "name" in findings:
              return [findings]
            return findings if isinstance(findings, list) else []
        except Exception as e:
            print(f"Semantic Review Error: {e}")
            return []


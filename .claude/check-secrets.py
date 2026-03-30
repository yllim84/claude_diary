#!/usr/bin/env python
"""
Pre-push hook: scans GitHub MCP push payloads for hardcoded API keys/secrets.
Reads JSON from stdin; outputs a block decision if a secret is detected.
"""
import sys
import json
import re
import io

# Ensure UTF-8 output on Windows
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")

def main():
    raw = sys.stdin.read()

    try:
        data = json.loads(raw)
    except Exception:
        sys.exit(0)

    tool_input = data.get("tool_input", {})

    # Collect all text content to scan
    parts = []
    for f in tool_input.get("files", []):           # push_files
        parts.append(f.get("content", ""))
    if "content" in tool_input:                      # create_or_update_file
        parts.append(tool_input["content"])

    content = "\n".join(parts)
    if not content.strip():
        sys.exit(0)

    PATTERNS = [
        (r"sk-or-v1-[A-Za-z0-9]{20,}",
         "OpenRouter API key (sk-or-v1-...)"),
        (r"(?<![A-Za-z0-9])sk-[A-Za-z0-9]{30,}",
         "OpenAI-style API key (sk-...)"),
        (r"AKIA[0-9A-Z]{16}",
         "AWS Access Key ID"),
        (r"ghp_[A-Za-z0-9]{36}",
         "GitHub Personal Access Token (ghp_...)"),
        (r"(?:API_KEY|SECRET|TOKEN|PASSWORD)\s*=\s*['\"]?[A-Za-z0-9+/]{30,}",
         "고엔트로피 시크릿 (API_KEY/SECRET/TOKEN/PASSWORD 값)"),
    ]

    for pattern, label in PATTERNS:
        if re.search(pattern, content):
            msg = (
                f"[SECRET DETECTED] {label} 이(가) 파일에 포함되어 있습니다. "
                "키를 제거한 후 다시 푸시하세요."
            )
            print(json.dumps({"continue": False, "stopReason": msg}, ensure_ascii=False))
            sys.exit(0)

    sys.exit(0)

if __name__ == "__main__":
    main()

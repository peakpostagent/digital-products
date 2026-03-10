#!/bin/bash
# review.sh — Send git diff to local Ollama for code review
# Usage: bash review.sh
# Can be used as a pre-commit hook

OLLAMA_URL="http://localhost:11434/api/generate"
MODEL="qwen3:14b"

# Get the staged diff
DIFF=$(git diff --cached)

if [ -z "$DIFF" ]; then
  echo "No staged changes to review."
  exit 0
fi

echo "Sending staged changes to $MODEL for review..."
echo "---"

# Build the prompt
PROMPT="Review this git diff for bugs, security issues, and improvements. Be concise.\n\n$DIFF"

# Call Ollama API
curl -s "$OLLAMA_URL" \
  -d "{\"model\": \"$MODEL\", \"prompt\": \"$PROMPT\", \"stream\": false}" \
  | python3 -c "import sys,json; print(json.load(sys.stdin).get('response','No response'))" 2>/dev/null \
  || echo "Could not reach Ollama. Is it running? (ollama serve)"

echo ""
echo "---"
echo "Review complete."

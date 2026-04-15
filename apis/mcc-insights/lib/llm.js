// llm.js — Generate the weekly insight paragraph via OpenAI gpt-4o-mini.
// Local Ollama isn't an option on Vercel, so we use gpt-4o-mini for launch.
// Cost estimate: ~300 input tokens + 200 output tokens per user per week.
// At $0.15/M input and $0.60/M output, that's ~$0.00017 per user per week —
// comfortably under the $10/month ceiling in CLAUDE.md.

const { buildInsightPrompt } = require('./prompts');

async function generateInsight(stats) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return { ok: false, error: 'OPENAI_API_KEY not set' };
  }

  const prompt = buildInsightPrompt(stats);

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + apiKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 220
    })
  });

  if (!response.ok) {
    const err = await response.text();
    return { ok: false, error: 'OpenAI: ' + err };
  }

  const data = await response.json();
  const text = data.choices && data.choices[0] && data.choices[0].message
    ? data.choices[0].message.content.trim()
    : '';

  if (!text) return { ok: false, error: 'Empty LLM response' };
  return { ok: true, text };
}

module.exports = { generateInsight };

// generate.js — Vercel serverless function for email subject line generation
// POST /api/generate
// Body: { emailBody: string, tone?: string, count?: number }
// Returns: { subjects: string[] }

const { buildPrompt } = require('../lib/prompts');
const { validateInput } = require('../lib/validator');

module.exports = async function handler(req, res) {
  // CORS headers for RapidAPI
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-RapidAPI-Key');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  // Validate input
  const validation = validateInput(req.body);
  if (!validation.valid) {
    return res.status(400).json({ error: validation.error });
  }

  const { emailBody, tone = 'professional', count = 5 } = req.body;

  try {
    const prompt = buildPrompt(emailBody, tone, count);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.8,
        max_tokens: 300
      })
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('OpenAI API error:', err);
      return res.status(502).json({ error: 'AI service error. Please try again.' });
    }

    const data = await response.json();
    const text = data.choices[0].message.content.trim();

    // Parse numbered list from response
    const subjects = text
      .split('\n')
      .map(line => line.replace(/^\d+[\.\)]\s*/, '').replace(/^[""]|[""]$/g, '').trim())
      .filter(line => line.length > 0 && line.length < 200);

    return res.status(200).json({
      subjects: subjects.slice(0, count),
      tone,
      count: subjects.length
    });

  } catch (err) {
    console.error('Generate error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

// prompts.js — Prompt templates for subject line generation

const TONE_INSTRUCTIONS = {
  professional: 'Use a professional, business-appropriate tone.',
  casual: 'Use a friendly, casual tone.',
  urgent: 'Create a sense of urgency without being spammy.',
  creative: 'Be creative and attention-grabbing.',
  formal: 'Use a formal, corporate tone.'
};

/**
 * Build the prompt for OpenAI to generate subject lines
 * @param {string} emailBody - The email body text
 * @param {string} tone - One of: professional, casual, urgent, creative, formal
 * @param {number} count - Number of subject lines to generate (1-10)
 * @returns {string} The complete prompt
 */
function buildPrompt(emailBody, tone, count) {
  const toneInstruction = TONE_INSTRUCTIONS[tone] || TONE_INSTRUCTIONS.professional;

  return `Generate exactly ${count} email subject lines for the following email body.

Rules:
- Each subject line should be under 60 characters
- ${toneInstruction}
- Make each option distinct from the others
- Do not use ALL CAPS or excessive punctuation
- Return only the numbered list, nothing else

Email body:
${emailBody.slice(0, 2000)}`;
}

module.exports = { buildPrompt, TONE_INSTRUCTIONS };

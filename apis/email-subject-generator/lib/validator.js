// validator.js — Input validation for the generate endpoint

const VALID_TONES = ['professional', 'casual', 'urgent', 'creative', 'formal'];

/**
 * Validate the request body for /api/generate
 * @param {object} body - The request body
 * @returns {{ valid: boolean, error?: string }}
 */
function validateInput(body) {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Request body must be a JSON object.' };
  }

  if (!body.emailBody || typeof body.emailBody !== 'string') {
    return { valid: false, error: 'emailBody is required and must be a string.' };
  }

  const trimmed = body.emailBody.trim();
  if (trimmed.length < 10) {
    return { valid: false, error: 'emailBody must be at least 10 characters.' };
  }

  if (trimmed.length > 5000) {
    return { valid: false, error: 'emailBody must be under 5000 characters.' };
  }

  if (body.tone !== undefined) {
    if (!VALID_TONES.includes(body.tone)) {
      return { valid: false, error: `tone must be one of: ${VALID_TONES.join(', ')}` };
    }
  }

  if (body.count !== undefined) {
    if (typeof body.count !== 'number' || body.count < 1 || body.count > 10 || !Number.isInteger(body.count)) {
      return { valid: false, error: 'count must be an integer between 1 and 10.' };
    }
  }

  return { valid: true };
}

module.exports = { validateInput, VALID_TONES };

// popup.js — Extension popup controller
// Depends on matcher.js being loaded first via popup.html script order

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

const resumeInput = document.getElementById('resume-input');
const saveBtn = document.getElementById('save-btn');
const editBtn = document.getElementById('edit-btn');
const scoreSection = document.getElementById('score-section');
const resumeSection = document.getElementById('resume-section');
const statusSection = document.getElementById('status-section');
const statusMessage = document.getElementById('status-message');
const scoreValue = document.getElementById('score-value');
const scoreCircle = document.getElementById('score-circle');
const matchedKeywords = document.getElementById('matched-keywords');
const missingKeywords = document.getElementById('missing-keywords');
const loadingSection = document.getElementById('loading-section');
const footerText = document.querySelector('.footer-text');

// Load saved resume on popup open
document.addEventListener('DOMContentLoaded', async () => {
  const data = await chrome.storage.local.get(['resumeText', 'resumeKeywords']);

  if (data.resumeText && data.resumeKeywords && data.resumeKeywords.length > 0) {
    showSavedState(data.resumeKeywords.length);
    requestMatchScore();
  } else {
    showResumeInput();
  }
});

// Save resume
saveBtn.addEventListener('click', async () => {
  const text = resumeInput.value.trim();
  if (!text) {
    resumeInput.style.borderColor = '#ef4444';
    return;
  }

  // Use matcher.js for consistent keyword extraction
  const keywords = JobMatchScore.extractKeywords(text);

  if (keywords.length === 0) {
    statusMessage.textContent = 'No keywords found. Try pasting more text.';
    statusSection.classList.remove('hidden');
    return;
  }

  await chrome.storage.local.set({
    resumeText: text,
    resumeKeywords: keywords
  });

  // Notify content script that keywords changed
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab) {
      chrome.tabs.sendMessage(tab.id, { type: 'KEYWORDS_UPDATED' }).catch(() => {});
    }
  } catch (_) {
    // Content script not available, that's fine
  }

  showSavedState(keywords.length);
  requestMatchScore();
});

// Edit resume
editBtn.addEventListener('click', async () => {
  const data = await chrome.storage.local.get('resumeText');
  resumeInput.value = data.resumeText || '';
  showResumeInput();
});

// Request match score from content script on active tab
async function requestMatchScore() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.url) {
      footerText.textContent = 'Open a tab to get started';
      return;
    }

    // Check if we're on a supported job page
    const isJobPage = tab.url.includes('linkedin.com/jobs/');
    if (!isJobPage) {
      footerText.textContent = 'Navigate to a LinkedIn job listing to see your match score';
      return;
    }

    // Show loading
    loadingSection.classList.remove('hidden');
    footerText.textContent = '';

    // Send message to content script
    const response = await chrome.tabs.sendMessage(tab.id, { type: 'GET_MATCH_SCORE' });

    loadingSection.classList.add('hidden');

    if (response && response.error === 'no_job_description') {
      footerText.textContent = 'Could not find job description on this page';
      return;
    }

    if (response && response.score !== undefined) {
      displayScore(response.score, response.matched, response.missing);
    }
  } catch (err) {
    loadingSection.classList.add('hidden');
    // Content script may not be loaded — tell user to refresh
    footerText.textContent = 'Refresh the LinkedIn page and try again';
    console.log('Could not reach content script:', err.message);
  }
}

function displayScore(score, matched, missing) {
  scoreSection.classList.remove('hidden');

  scoreValue.textContent = score;

  // Color the score circle
  scoreCircle.className = '';
  if (score >= 70) scoreCircle.classList.add('score-high');
  else if (score >= 40) scoreCircle.classList.add('score-medium');
  else scoreCircle.classList.add('score-low');

  // Render keyword chips
  matchedKeywords.innerHTML = (matched || [])
    .slice(0, 15)
    .map(k => `<span class="chip chip-matched">${escapeHtml(k)}</span>`)
    .join('');

  missingKeywords.innerHTML = (missing || [])
    .slice(0, 15)
    .map(k => `<span class="chip chip-missing">${escapeHtml(k)}</span>`)
    .join('');

  // Update footer with match summary
  const total = (matched || []).length + (missing || []).length;
  footerText.textContent = `${(matched || []).length} of ${total} keywords matched`;
}

function showResumeInput() {
  resumeSection.classList.remove('hidden');
  statusSection.classList.add('hidden');
  scoreSection.classList.add('hidden');
  loadingSection.classList.add('hidden');
}

function showSavedState(keywordCount) {
  resumeSection.classList.add('hidden');
  statusSection.classList.remove('hidden');
  statusMessage.textContent = `Resume saved (${keywordCount} keywords detected)`;
}

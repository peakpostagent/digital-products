// popup.js — Extension popup controller

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

// Load saved resume on popup open
document.addEventListener('DOMContentLoaded', async () => {
  const data = await chrome.storage.local.get(['resumeText', 'resumeKeywords']);

  if (data.resumeText && data.resumeKeywords) {
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

  // Extract keywords (simple split for now — matcher.js has the full logic)
  const keywords = text
    .toLowerCase()
    .split(/[\s,;|]+/)
    .map(w => w.replace(/[^a-z0-9+#.-]/g, ''))
    .filter(w => w.length > 1);

  const uniqueKeywords = [...new Set(keywords)];

  await chrome.storage.local.set({
    resumeText: text,
    resumeKeywords: uniqueKeywords
  });

  showSavedState(uniqueKeywords.length);
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
    if (!tab || !tab.url) return;

    // Check if we're on a supported job page
    const isJobPage = tab.url.includes('linkedin.com/jobs/');
    if (!isJobPage) {
      document.querySelector('.footer-text').textContent =
        'Navigate to a LinkedIn job listing to see your match score';
      return;
    }

    // Send message to content script
    const response = await chrome.tabs.sendMessage(tab.id, { type: 'GET_MATCH_SCORE' });
    if (response && response.score !== undefined) {
      displayScore(response.score, response.matched, response.missing);
    }
  } catch (err) {
    // Content script may not be loaded yet — this is normal
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
    .map(k => `<span class="chip chip-matched">${k}</span>`)
    .join('');

  missingKeywords.innerHTML = (missing || [])
    .slice(0, 15)
    .map(k => `<span class="chip chip-missing">${k}</span>`)
    .join('');
}

function showResumeInput() {
  resumeSection.classList.remove('hidden');
  statusSection.classList.add('hidden');
  scoreSection.classList.add('hidden');
}

function showSavedState(keywordCount) {
  resumeSection.classList.add('hidden');
  statusSection.classList.remove('hidden');
  statusMessage.textContent = `Resume saved (${keywordCount} keywords detected)`;
}

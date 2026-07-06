/**
 * AI Sidebar — Panel script
 *
 * Chat UI against a LOCAL Ollama instance (http://localhost:11434).
 * Patterns demonstrated beyond the other two examples:
 *   - Metered free tier: the worker gates each message server-side-ish
 *     (in the service worker), panel just reacts
 *   - Pro-gated model picker (free tier locked to the default model)
 *   - Streaming responses rendered token-by-token
 */

import { isPaid } from '../lib/is-paid.js';
import { setupPaywall, showPaywall } from '../popup/paywall.js';

const OLLAMA = 'http://localhost:11434';
const DEFAULT_MODEL = 'llama3.2';

const chatEl = document.getElementById('chat');
const promptEl = document.getElementById('prompt');
const sendBtn = document.getElementById('send-btn');
const statusEl = document.getElementById('status-bar');
const modelSelect = document.getElementById('model-select');

const history = [];

document.addEventListener('DOMContentLoaded', async () => {
  setupPaywall();
  sendBtn.addEventListener('click', send);
  promptEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  });
  modelSelect.addEventListener('mousedown', gateModelPicker);
  await Promise.all([checkOllama(), populateModels()]);
});

async function checkOllama() {
  try {
    const r = await fetch(`${OLLAMA}/api/version`, { signal: AbortSignal.timeout(3000) });
    const v = await r.json();
    setStatus(`Ollama ${v.version} connected`);
  } catch (_) {
    setStatus('Ollama not reachable at localhost:11434 — is it running?', true);
    sendBtn.disabled = true;
  }
}

async function populateModels() {
  try {
    const r = await fetch(`${OLLAMA}/api/tags`, { signal: AbortSignal.timeout(3000) });
    const data = await r.json();
    const models = (data.models || []).map((m) => m.name.replace(/:latest$/, ''));
    if (models.length) {
      modelSelect.innerHTML = models
        .map((m) => `<option value="${m}">${m}</option>`)
        .join('');
      if (models.includes(DEFAULT_MODEL)) modelSelect.value = DEFAULT_MODEL;
    }
  } catch (_) { /* keep default option */ }
}

async function gateModelPicker(e) {
  // Free tier: model picker locked to default. Pro: any local model.
  if (!(await isPaid()) && modelSelect.options.length > 1) {
    e.preventDefault();
    showPaywall();
  }
}

async function send() {
  const text = promptEl.value.trim();
  if (!text) return;

  // Ask the worker for a message credit (metered free tier)
  const credit = await chrome.runtime.sendMessage({ type: 'ai-sidebar/consume-message-credit' });
  if (!credit?.allowed) {
    showPaywall();
    return;
  }
  if (Number.isFinite(credit.remaining)) {
    setStatus(`${credit.remaining} free message${credit.remaining === 1 ? '' : 's'} left today`);
  } else {
    setStatus('Pro — unlimited');
  }

  promptEl.value = '';
  addMsg('user', text);
  history.push({ role: 'user', content: text });

  const aiEl = addMsg('ai', '');
  aiEl.classList.add('streaming');
  sendBtn.disabled = true;

  try {
    const r = await fetch(`${OLLAMA}/api/chat`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        model: modelSelect.value || DEFAULT_MODEL,
        messages: history.slice(-20),
        stream: true,
      }),
    });
    const reader = r.body.getReader();
    const decoder = new TextDecoder();
    let full = '';
    let buf = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      const lines = buf.split('\n');
      buf = lines.pop();
      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const chunk = JSON.parse(line);
          const delta = chunk.message?.content || '';
          full += delta;
          aiEl.textContent = full;
          chatEl.scrollTop = chatEl.scrollHeight;
        } catch (_) { /* partial line */ }
      }
    }
    history.push({ role: 'assistant', content: full });
  } catch (err) {
    aiEl.textContent = `Error talking to Ollama: ${err.message}`;
  } finally {
    aiEl.classList.remove('streaming');
    sendBtn.disabled = false;
  }
}

function addMsg(role, text) {
  const div = document.createElement('div');
  div.className = `msg ${role}`;
  div.textContent = text;
  chatEl.appendChild(div);
  chatEl.scrollTop = chatEl.scrollHeight;
  return div;
}

function setStatus(text, isError = false) {
  statusEl.textContent = text;
  statusEl.classList.toggle('error', isError);
}

/**
 * Snippet Vault - Popup Logic
 * Handles CRUD, search, sort, import/export for code snippets.
 * All data stored in chrome.storage.local.
 */

/* ===== DOM References ===== */
const searchInput    = document.getElementById('search-input');
const sortSelect     = document.getElementById('sort-select');
const btnAdd         = document.getElementById('btn-add');
const btnImport      = document.getElementById('btn-import');
const btnExport      = document.getElementById('btn-export');
const importFile     = document.getElementById('import-file');
const snippetForm    = document.getElementById('snippet-form');
const formTitle      = document.getElementById('form-title');
const formLanguage   = document.getElementById('form-language');
const formCode       = document.getElementById('form-code');
const formTags       = document.getElementById('form-tags');
const btnSave        = document.getElementById('btn-save');
const btnCancel      = document.getElementById('btn-cancel');
const snippetList    = document.getElementById('snippet-list');
const snippetCount   = document.getElementById('snippet-count');
const emptyState     = document.getElementById('empty-state');
const storageWarning = document.getElementById('storage-warning');
const toast          = document.getElementById('toast');

/* ===== State ===== */
let snippets = [];
let editingId = null; // null = adding new, string = editing existing

/* ===== Init ===== */
document.addEventListener('DOMContentLoaded', init);

async function init() {
  await loadSnippets();
  renderList();
  bindEvents();
}

/* ===== Storage Helpers ===== */

/** Load all snippets from chrome.storage.local */
async function loadSnippets() {
  return new Promise((resolve) => {
    chrome.storage.local.get({ snippets: [] }, (result) => {
      snippets = result.snippets;
      resolve();
    });
  });
}

/** Save all snippets to chrome.storage.local and update badge */
async function saveSnippets() {
  return new Promise((resolve) => {
    chrome.storage.local.set({ snippets }, () => {
      updateBadge();
      resolve();
    });
  });
}

/** Tell the background service worker to update the badge count */
function updateBadge() {
  chrome.runtime.sendMessage({ type: 'UPDATE_BADGE', count: snippets.length });
}

/* ===== Event Bindings ===== */

function bindEvents() {
  btnAdd.addEventListener('click', openAddForm);
  btnCancel.addEventListener('click', closeForm);
  btnSave.addEventListener('click', handleSave);
  btnImport.addEventListener('click', () => importFile.click());
  btnExport.addEventListener('click', handleExport);
  importFile.addEventListener('change', handleImport);
  searchInput.addEventListener('input', renderList);
  sortSelect.addEventListener('change', renderList);

  // Allow Tab key inside the code textarea
  formCode.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = formCode.selectionStart;
      const end = formCode.selectionEnd;
      formCode.value = formCode.value.substring(0, start) + '  ' + formCode.value.substring(end);
      formCode.selectionStart = formCode.selectionEnd = start + 2;
    }
  });
}

/* ===== Form Logic ===== */

/** Show the form in "add" mode */
function openAddForm() {
  editingId = null;
  formTitle.value = '';
  formLanguage.value = 'JavaScript';
  formCode.value = '';
  formTags.value = '';
  snippetForm.hidden = false;
  formTitle.focus();
}

/** Show the form in "edit" mode, pre-filled with snippet data */
function openEditForm(id) {
  const snippet = snippets.find((s) => s.id === id);
  if (!snippet) return;

  editingId = id;
  formTitle.value = snippet.title;
  formLanguage.value = snippet.language;
  formCode.value = snippet.code;
  formTags.value = snippet.tags.join(', ');
  snippetForm.hidden = false;
  formTitle.focus();
}

/** Hide the form and reset state */
function closeForm() {
  snippetForm.hidden = true;
  editingId = null;
}

/** Save a new snippet or update an existing one */
async function handleSave() {
  const title = formTitle.value.trim();
  const language = formLanguage.value;
  const code = formCode.value;
  const tags = parseTags(formTags.value);

  // Validate required fields
  if (!title) {
    showToast('Title is required');
    formTitle.focus();
    return;
  }
  if (!code) {
    showToast('Code is required');
    formCode.focus();
    return;
  }

  if (editingId) {
    // Update existing snippet
    const index = snippets.findIndex((s) => s.id === editingId);
    if (index !== -1) {
      snippets[index] = {
        ...snippets[index],
        title,
        language,
        code,
        tags,
        updatedAt: Date.now()
      };
    }
    showToast('Snippet updated');
  } else {
    // Create new snippet
    const newSnippet = {
      id: generateId(),
      title,
      language,
      code,
      tags,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    snippets.unshift(newSnippet);
    showToast('Snippet saved');
  }

  await saveSnippets();
  closeForm();
  renderList();
}

/* ===== Delete ===== */

async function deleteSnippet(id) {
  if (!confirm('Delete this snippet? This cannot be undone.')) return;

  snippets = snippets.filter((s) => s.id !== id);
  await saveSnippets();
  renderList();
  showToast('Snippet deleted');
}

/* ===== Copy to Clipboard ===== */

async function copySnippet(id) {
  const snippet = snippets.find((s) => s.id === id);
  if (!snippet) return;

  try {
    await navigator.clipboard.writeText(snippet.code);
    showToast('Copied to clipboard!');
  } catch (err) {
    showToast('Copy failed');
  }
}

/* ===== Search & Sort ===== */

/** Filter snippets by search query across title, tags, language, code */
function filterSnippets(query) {
  if (!query) return [...snippets];

  const q = query.toLowerCase();
  return snippets.filter((s) => {
    return (
      s.title.toLowerCase().includes(q) ||
      s.language.toLowerCase().includes(q) ||
      s.code.toLowerCase().includes(q) ||
      s.tags.some((t) => t.toLowerCase().includes(q))
    );
  });
}

/** Sort snippets based on the selected sort option */
function sortSnippets(list, sortBy) {
  const sorted = [...list];

  switch (sortBy) {
    case 'newest':
      sorted.sort((a, b) => b.createdAt - a.createdAt);
      break;
    case 'oldest':
      sorted.sort((a, b) => a.createdAt - b.createdAt);
      break;
    case 'alpha':
      sorted.sort((a, b) => a.title.localeCompare(b.title));
      break;
    case 'language':
      sorted.sort((a, b) => a.language.localeCompare(b.language) || a.title.localeCompare(b.title));
      break;
  }

  return sorted;
}

/* ===== Render ===== */

/** Re-render the snippet list based on current search + sort state */
function renderList() {
  const query = searchInput.value.trim();
  const sortBy = sortSelect.value;

  const filtered = filterSnippets(query);
  const sorted = sortSnippets(filtered, sortBy);

  // Update count
  snippetCount.textContent = `${snippets.length} snippet${snippets.length !== 1 ? 's' : ''}`;

  // Show warning if approaching storage limits
  storageWarning.hidden = snippets.length < 100;

  // Show empty state or list
  if (sorted.length === 0) {
    snippetList.innerHTML = '';
    emptyState.hidden = false;
    if (query) {
      emptyState.innerHTML = '<p>No snippets match your search.</p>';
    } else {
      emptyState.innerHTML =
        '<p>No snippets yet.</p><p>Click <strong>+ Add Snippet</strong> to save your first one.</p>';
    }
    return;
  }

  emptyState.hidden = true;
  snippetList.innerHTML = sorted.map((s) => renderCard(s)).join('');

  // Bind card action buttons
  snippetList.querySelectorAll('[data-action]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const action = e.currentTarget.dataset.action;
      const id = e.currentTarget.dataset.id;

      if (action === 'copy') copySnippet(id);
      if (action === 'edit') openEditForm(id);
      if (action === 'delete') deleteSnippet(id);
    });
  });
}

/** Build HTML string for one snippet card */
function renderCard(snippet) {
  const langClass = 'lang--' + snippet.language.toLowerCase();
  const preview = escapeHtml(snippet.code.split('\n')[0].substring(0, 60));
  const tagsHtml = snippet.tags
    .map((t) => `<span class="snippet-card__tag">${escapeHtml(t)}</span>`)
    .join('');

  return `
    <div class="snippet-card">
      <div class="snippet-card__header">
        <span class="snippet-card__title" title="${escapeHtml(snippet.title)}">${escapeHtml(snippet.title)}</span>
        <span class="snippet-card__lang ${langClass}">${escapeHtml(snippet.language)}</span>
      </div>
      <div class="snippet-card__preview">${preview || '(empty)'}</div>
      ${tagsHtml ? `<div class="snippet-card__tags">${tagsHtml}</div>` : ''}
      <div class="snippet-card__actions">
        <button class="snippet-card__btn snippet-card__btn--copy" data-action="copy" data-id="${snippet.id}">Copy</button>
        <button class="snippet-card__btn" data-action="edit" data-id="${snippet.id}">Edit</button>
        <button class="snippet-card__btn snippet-card__btn--delete" data-action="delete" data-id="${snippet.id}">Delete</button>
      </div>
    </div>
  `;
}

/* ===== Import / Export ===== */

/** Export all snippets as a downloadable JSON file */
function handleExport() {
  if (snippets.length === 0) {
    showToast('No snippets to export');
    return;
  }

  const data = JSON.stringify(snippets, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = 'snippet-vault-export.json';
  a.click();

  URL.revokeObjectURL(url);
  showToast('Snippets exported');
}

/** Import snippets from a JSON file, merging with existing data */
function handleImport(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async (event) => {
    try {
      const imported = JSON.parse(event.target.result);

      // Validate the imported data
      if (!Array.isArray(imported)) {
        showToast('Invalid file: expected an array');
        return;
      }

      // Validate each snippet has required fields
      const valid = imported.every(
        (s) =>
          typeof s.title === 'string' && s.title &&
          typeof s.code === 'string' && s.code &&
          typeof s.language === 'string' && s.language
      );
      if (!valid) {
        showToast('Invalid file: missing fields');
        return;
      }

      // Assign new IDs to avoid collisions, keep original timestamps
      const newSnippets = imported.map((s) => ({
        id: generateId(),
        title: s.title,
        language: s.language,
        code: s.code,
        tags: Array.isArray(s.tags) ? s.tags : [],
        createdAt: s.createdAt || Date.now(),
        updatedAt: s.updatedAt || Date.now()
      }));

      snippets = [...newSnippets, ...snippets];
      await saveSnippets();
      renderList();
      showToast(`Imported ${newSnippets.length} snippets`);
    } catch (err) {
      showToast('Failed to parse JSON');
    }
  };

  reader.readAsText(file);

  // Reset file input so the same file can be re-imported
  importFile.value = '';
}

/* ===== Utilities ===== */

/** Generate a unique ID (timestamp + random) */
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
}

/** Parse a comma-separated tag string into a clean array */
function parseTags(input) {
  return input
    .split(',')
    .map((t) => t.trim())
    .filter((t) => t.length > 0);
}

/** Escape HTML special characters to prevent XSS */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

/** Show a brief toast notification */
function showToast(message) {
  toast.textContent = message;
  toast.hidden = false;

  clearTimeout(toast._timeout);
  toast._timeout = setTimeout(() => {
    toast.hidden = true;
  }, 2000);
}

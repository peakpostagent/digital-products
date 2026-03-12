/**
 * Tab Brake — Blocked page script
 *
 * Runs on the "tab limit reached" interstitial.
 * Communicates with the service worker via chrome.runtime.sendMessage.
 */

(function () {
  'use strict';

  var elCurrentCount = document.getElementById('currentCount');
  var elMaxTabs = document.getElementById('maxTabs');
  var btnCloseTabs = document.getElementById('btnCloseTabs');
  var btnOverride = document.getElementById('btnOverride');
  var tabListSection = document.getElementById('tabListSection');
  var tabList = document.getElementById('tabList');
  var openSettings = document.getElementById('openSettings');

  /* ---- Load initial data ---- */

  chrome.storage.local.get(['maxTabs'], function (data) {
    elMaxTabs.textContent = data.maxTabs || 8;
  });

  chrome.runtime.sendMessage({ type: 'getTabCount' }, function (res) {
    if (res && typeof res.count === 'number') {
      elCurrentCount.textContent = res.count;
    }
  });

  /* ---- Close a tab ---- */

  btnCloseTabs.addEventListener('click', function () {
    tabListSection.classList.remove('hidden');
    loadTabList();
  });

  function loadTabList() {
    chrome.runtime.sendMessage({ type: 'getOpenTabs' }, function (res) {
      if (!res || !res.tabs) return;

      tabList.innerHTML = '';

      // Get this tab's own id so we can exclude it
      var thisTabUrl = location.href;

      res.tabs.forEach(function (tab) {
        // Don't list the blocked page itself
        if (tab.url === thisTabUrl) return;

        var li = document.createElement('li');

        // Favicon
        var img = document.createElement('img');
        img.src = tab.favIconUrl || 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"/>';
        img.alt = '';
        li.appendChild(img);

        // Title
        var title = document.createElement('span');
        title.className = 'tab-title';
        title.textContent = tab.title;
        li.appendChild(title);

        // Close button
        var closeX = document.createElement('span');
        closeX.className = 'close-x';
        closeX.textContent = '\u00D7'; // multiplication sign
        li.appendChild(closeX);

        li.addEventListener('click', function () {
          chrome.runtime.sendMessage({ type: 'closeTab', tabId: tab.id }, function () {
            // Refresh the list and count
            li.remove();
            chrome.runtime.sendMessage({ type: 'getTabCount' }, function (r) {
              if (r && typeof r.count === 'number') {
                elCurrentCount.textContent = r.count;
              }
            });
          });
        });

        tabList.appendChild(li);
      });
    });
  }

  /* ---- Override ---- */

  btnOverride.addEventListener('click', function () {
    chrome.runtime.sendMessage({ type: 'override' }, function () {
      // Navigate this tab to the new-tab page (about:newtab won't work from
      // an extension page, so we open a blank Google search instead)
      window.location.href = 'https://www.google.com';
    });
  });

  /* ---- Settings link ---- */

  openSettings.addEventListener('click', function (e) {
    e.preventDefault();
    // Open the extension popup — we can't do that programmatically,
    // so just point the user to the extension's options.
    if (chrome.runtime.openOptionsPage) {
      chrome.runtime.openOptionsPage();
    }
  });
})();

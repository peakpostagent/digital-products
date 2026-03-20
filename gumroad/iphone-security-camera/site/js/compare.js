/**
 * compare.js — App comparison table with filtering and sorting
 */

(function () {
  /* ---- App data ---- */
  var apps = [
    {
      name: 'Alfred Camera',
      price: 'Free / $3.99/mo',
      freeTier: true,
      motionDetection: true,
      motionType: 'Basic',
      cloudStorage: '7 days free',
      remoteViewing: true,
      nightMode: false,
      twoWayAudio: true,
      easeOfSetup: 5,
      batteryImpact: 'Medium',
      platforms: 'iOS, Android',
      ourPick: true,
      bestFor: 'Best overall free option'
    },
    {
      name: 'Presence',
      price: 'Free / $4.99/mo',
      freeTier: true,
      motionDetection: true,
      motionType: 'AI (Person/Vehicle)',
      cloudStorage: 'Limited free',
      remoteViewing: true,
      nightMode: true,
      twoWayAudio: true,
      easeOfSetup: 4,
      batteryImpact: 'Medium',
      platforms: 'iOS, Android',
      ourPick: false,
      bestFor: 'Best AI-powered alerts'
    },
    {
      name: 'AtHome Camera',
      price: 'Free / $2.99/mo',
      freeTier: true,
      motionDetection: true,
      motionType: 'Basic',
      cloudStorage: 'None (local)',
      remoteViewing: true,
      nightMode: false,
      twoWayAudio: false,
      easeOfSetup: 4,
      batteryImpact: 'Low',
      platforms: 'iOS, Android',
      ourPick: false,
      bestFor: 'Best for battery life'
    },
    {
      name: 'iVCam',
      price: 'Free / $4.99/mo',
      freeTier: true,
      motionDetection: true,
      motionType: 'Custom Zones',
      cloudStorage: 'Limited free',
      remoteViewing: true,
      nightMode: true,
      twoWayAudio: true,
      easeOfSetup: 4,
      batteryImpact: 'Medium',
      platforms: 'iOS, Windows',
      ourPick: false,
      bestFor: 'Best video quality'
    },
    {
      name: 'Manything',
      price: 'Free / $3.99/mo',
      freeTier: true,
      motionDetection: true,
      motionType: 'AI (Smart)',
      cloudStorage: '14 days (720p)',
      remoteViewing: true,
      nightMode: true,
      twoWayAudio: true,
      easeOfSetup: 4,
      batteryImpact: 'Medium',
      platforms: 'iOS, Android',
      ourPick: false,
      bestFor: 'Best cloud storage'
    },
    {
      name: 'EpocCam',
      price: 'Free / $7.99 once',
      freeTier: true,
      motionDetection: false,
      motionType: 'None',
      cloudStorage: 'None',
      remoteViewing: true,
      nightMode: false,
      twoWayAudio: false,
      easeOfSetup: 5,
      batteryImpact: 'Low',
      platforms: 'iOS, macOS, Windows',
      ourPick: false,
      bestFor: 'Best webcam replacement'
    }
  ];

  /* ---- Current filter ---- */
  var currentFilter = 'all';

  /* ---- Render helpers ---- */
  function checkMark(val) {
    if (val === true) return '<span class="compare-check">&#10003;</span>';
    if (val === false) return '<span class="compare-cross">&#10007;</span>';
    return val;
  }

  function starsHtml(count) {
    var html = '<span class="stars">';
    for (var i = 0; i < count; i++) html += '&#9733;';
    for (var j = count; j < 5; j++) html += '&#9734;';
    html += '</span>';
    return html;
  }

  /* ---- Filter logic ---- */
  function filterApps(filter) {
    if (filter === 'all') return apps;
    if (filter === 'free') return apps.filter(function (a) { return a.freeTier; });
    if (filter === 'night') return apps.filter(function (a) { return a.nightMode; });
    if (filter === 'cloud') return apps.filter(function (a) { return a.cloudStorage !== 'None' && a.cloudStorage !== 'None (local)'; });
    if (filter === 'low-battery') return apps.filter(function (a) { return a.batteryImpact === 'Low'; });
    if (filter === 'audio') return apps.filter(function (a) { return a.twoWayAudio; });
    return apps;
  }

  /* ---- Render table ---- */
  function renderTable(filteredApps) {
    var tbody = document.getElementById('compareBody');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (filteredApps.length === 0) {
      var tr = document.createElement('tr');
      var td = document.createElement('td');
      td.colSpan = 10;
      td.textContent = 'No apps match this filter.';
      td.style.textAlign = 'center';
      td.style.padding = '2rem';
      td.style.color = '#86868b';
      tr.appendChild(td);
      tbody.appendChild(tr);
      return;
    }

    filteredApps.forEach(function (app) {
      var tr = document.createElement('tr');
      tr.innerHTML =
        '<td>' + app.name + (app.ourPick ? ' <span class="pick-badge">Our Pick</span>' : '') + '</td>' +
        '<td>' + app.price + '</td>' +
        '<td>' + (app.motionDetection ? app.motionType : checkMark(false)) + '</td>' +
        '<td>' + app.cloudStorage + '</td>' +
        '<td>' + checkMark(app.remoteViewing) + '</td>' +
        '<td>' + checkMark(app.nightMode) + '</td>' +
        '<td>' + checkMark(app.twoWayAudio) + '</td>' +
        '<td>' + starsHtml(app.easeOfSetup) + '</td>' +
        '<td>' + app.batteryImpact + '</td>' +
        '<td>' + app.bestFor + '</td>';
      tbody.appendChild(tr);
    });
  }

  /* ---- Sort by column ---- */
  var sortColumn = null;
  var sortAsc = true;

  function sortApps(filteredApps, col) {
    var sorted = filteredApps.slice();
    sorted.sort(function (a, b) {
      var va, vb;
      switch (col) {
        case 'name': va = a.name; vb = b.name; break;
        case 'price': va = a.price; vb = b.price; break;
        case 'setup': va = a.easeOfSetup; vb = b.easeOfSetup; break;
        case 'battery':
          var order = { Low: 1, Medium: 2, High: 3 };
          va = order[a.batteryImpact] || 2;
          vb = order[b.batteryImpact] || 2;
          break;
        default: va = a.name; vb = b.name;
      }
      if (va < vb) return sortAsc ? -1 : 1;
      if (va > vb) return sortAsc ? 1 : -1;
      return 0;
    });
    return sorted;
  }

  /* ---- Init ---- */
  function init() {
    /* Render initial table */
    renderTable(apps);

    /* Filter buttons */
    document.querySelectorAll('.filter-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        currentFilter = this.getAttribute('data-filter');
        /* Update active state */
        document.querySelectorAll('.filter-btn').forEach(function (b) {
          b.classList.remove('active');
        });
        this.classList.add('active');
        /* Re-render */
        var filtered = filterApps(currentFilter);
        if (sortColumn) {
          filtered = sortApps(filtered, sortColumn);
        }
        renderTable(filtered);
      });
    });

    /* Sortable headers */
    document.querySelectorAll('[data-sort]').forEach(function (th) {
      th.style.cursor = 'pointer';
      th.addEventListener('click', function () {
        var col = this.getAttribute('data-sort');
        if (sortColumn === col) {
          sortAsc = !sortAsc;
        } else {
          sortColumn = col;
          sortAsc = true;
        }
        var filtered = filterApps(currentFilter);
        filtered = sortApps(filtered, col);
        renderTable(filtered);
      });
    });
  }

  document.addEventListener('DOMContentLoaded', init);
})();

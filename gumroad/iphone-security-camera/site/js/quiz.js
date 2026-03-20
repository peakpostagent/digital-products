/**
 * quiz.js — Interactive setup quiz logic
 * Recommends the best camera app based on user answers
 */

(function () {
  /* ---- State ---- */
  var currentStep = 0;
  var totalSteps = 5;
  var answers = {};

  /* ---- DOM refs ---- */
  var questions = document.querySelectorAll('.quiz-question');
  var progressSteps = document.querySelectorAll('.quiz-progress-step');
  var prevBtn = document.getElementById('quizPrev');
  var nextBtn = document.getElementById('quizNext');
  var resultEl = document.getElementById('quizResult');
  var progressBar = document.getElementById('quizProgress');

  /* ---- App recommendation database ---- */
  var apps = {
    alfred: {
      name: 'Alfred Camera',
      reason: 'Best overall free option with the easiest setup and reliable motion alerts.',
      tips: [
        'Free tier includes 7 days of cloud storage',
        'Setup takes under 5 minutes with QR code pairing',
        'Works great on older iPhones (6s and up)',
        'Two-way audio included in free version',
        'Low-light performance is limited — best for well-lit areas'
      ]
    },
    presence: {
      name: 'Presence',
      reason: 'Best for AI-powered motion detection and smart alerts with person/vehicle recognition.',
      tips: [
        'AI motion detection reduces false alerts significantly',
        'Supports night mode for low-light environments',
        'Cloud storage available on free tier (limited)',
        'Best choice for outdoor or mixed placement',
        'Premium plan ($4.99/mo) unlocks extended cloud storage'
      ]
    },
    athome: {
      name: 'AtHome Camera',
      reason: 'Best for battery-conscious setups with minimal power drain and local-only storage.',
      tips: [
        'Lowest battery impact of any camera app tested',
        'Local-only storage keeps your data private',
        'No cloud fees ever — completely free to use',
        'Great for battery-only setups without an outlet',
        'Basic motion detection works well for indoor use'
      ]
    },
    manything: {
      name: 'Manything',
      reason: 'Best for cloud recording with AI-powered motion detection and extended storage.',
      tips: [
        'AI-powered detection for people, animals, and vehicles',
        'Free tier includes 14 days of 720p cloud storage',
        'Night mode works well for low-light indoor areas',
        'Two-way audio included',
        'Best choice if cloud recording is your top priority'
      ]
    },
    ivcam: {
      name: 'iVCam',
      reason: 'Best for high-quality video with customizable motion zones and versatile camera features.',
      tips: [
        'Custom motion detection zones reduce false alerts',
        'Higher video quality than most free alternatives',
        'Night mode with infrared support',
        'Also doubles as a webcam for video calls',
        'Best for users who want fine-tuned control over settings'
      ]
    }
  };

  /* ---- Recommendation engine ---- */
  function getRecommendation() {
    var model = answers[0];
    var placement = answers[1];
    var priority = answers[2];
    var power = answers[3];
    var remote = answers[4];

    /* Score each app based on answers */
    var scores = { alfred: 0, presence: 0, athome: 0, manything: 0, ivcam: 0 };

    /* Model scoring — older phones benefit from lighter apps */
    if (model === '5s-6') {
      scores.alfred += 3;
      scores.athome += 2;
    } else if (model === '6s-7') {
      scores.alfred += 2;
      scores.athome += 1;
    } else {
      scores.presence += 1;
      scores.manything += 1;
      scores.ivcam += 1;
    }

    /* Placement scoring */
    if (placement === 'outdoor' || placement === 'both') {
      scores.presence += 3; /* night mode + AI detection */
      scores.manything += 2;
      scores.ivcam += 1;
    } else {
      scores.alfred += 1;
      scores.athome += 1;
    }

    /* Priority scoring */
    if (priority === 'free') {
      scores.alfred += 3;
      scores.athome += 3;
    } else if (priority === 'quality') {
      scores.ivcam += 3;
      scores.presence += 2;
    } else if (priority === 'cloud') {
      scores.manything += 3;
      scores.presence += 2;
    } else if (priority === 'alerts') {
      scores.presence += 3;
      scores.manything += 2;
      scores.alfred += 1;
    }

    /* Power scoring */
    if (power === 'battery') {
      scores.athome += 3;
      scores.alfred += 1;
    } else if (power === 'sometimes') {
      scores.athome += 2;
      scores.alfred += 1;
    } else {
      scores.presence += 1;
      scores.manything += 1;
    }

    /* Remote viewing scoring */
    if (remote === 'yes') {
      scores.alfred += 1;
      scores.presence += 1;
      scores.manything += 1;
    } else {
      scores.athome += 2;
    }

    /* Find highest score */
    var best = 'alfred';
    var bestScore = 0;
    for (var key in scores) {
      if (scores[key] > bestScore) {
        bestScore = scores[key];
        best = key;
      }
    }

    return apps[best];
  }

  /* ---- UI updates ---- */
  function updateProgress() {
    progressSteps.forEach(function (step, i) {
      step.classList.remove('active', 'done');
      if (i < currentStep) step.classList.add('done');
      if (i === currentStep) step.classList.add('active');
    });
  }

  function showStep(step) {
    questions.forEach(function (q) {
      q.classList.remove('active');
    });
    if (questions[step]) {
      questions[step].classList.add('active');
    }
    updateProgress();

    /* Show/hide prev button */
    prevBtn.style.visibility = step === 0 ? 'hidden' : 'visible';

    /* Update next button text */
    nextBtn.textContent = step === totalSteps - 1 ? 'See Results' : 'Next';

    /* Enable/disable next based on selection */
    nextBtn.disabled = !answers.hasOwnProperty(step);
  }

  function showResult() {
    /* Hide quiz UI */
    questions.forEach(function (q) { q.classList.remove('active'); });
    document.querySelector('.quiz-nav').style.display = 'none';
    progressBar.style.display = 'none';

    /* Get recommendation */
    var rec = getRecommendation();

    /* Populate result */
    document.getElementById('resultApp').textContent = rec.name;
    document.getElementById('resultReason').textContent = rec.reason;

    var summaryEl = document.getElementById('resultSummary');
    summaryEl.innerHTML = '';
    rec.tips.forEach(function (tip) {
      var li = document.createElement('li');
      li.textContent = tip;
      summaryEl.appendChild(li);
    });

    resultEl.classList.add('active');
  }

  /* ---- Event listeners ---- */

  /* Option selection */
  document.querySelectorAll('.quiz-option').forEach(function (option) {
    option.addEventListener('click', function () {
      var question = this.closest('.quiz-question');
      var step = parseInt(question.getAttribute('data-step'));

      /* Deselect siblings */
      question.querySelectorAll('.quiz-option').forEach(function (o) {
        o.classList.remove('selected');
      });

      /* Select this one */
      this.classList.add('selected');
      answers[step] = this.getAttribute('data-value');

      /* Enable next button */
      nextBtn.disabled = false;
    });
  });

  /* Next button */
  nextBtn.addEventListener('click', function () {
    if (currentStep < totalSteps - 1) {
      currentStep++;
      showStep(currentStep);
    } else {
      showResult();
    }
  });

  /* Prev button */
  prevBtn.addEventListener('click', function () {
    if (currentStep > 0) {
      currentStep--;
      showStep(currentStep);
    }
  });

  /* Init */
  showStep(0);
})();
